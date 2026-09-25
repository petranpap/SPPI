import { isUniqueViolation } from '../dbErrors.js'

// ─────────────────────────────────────────────────────────────────────────────
// DATA ISOLATION: this is the ONLY module that reads annotations. Every method
// takes the authenticated user's id as its first argument and applies it as a
// WHERE clause. There is deliberately no method that reads across users.
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_COLUMNS = {
  team:  { key: 'attacking_team_key',  name: 'attacking_team' },
  coach: { key: 'attacking_coach_key', name: 'attacking_coach' },
}

export class DuplicateAnnotationError extends Error {}

function assertUserId(userId) {
  if (!Number.isInteger(userId)) throw new Error('userId is required for annotation queries')
}

function parsePayload(payload) {
  return typeof payload === 'string' ? JSON.parse(payload) : payload
}

function toRecord(row) {
  return {
    id: row.id,
    sppi_id: row.sppi_id,
    match_id: row.match_id,
    attacking_team: row.attacking_team,
    attacking_coach: row.attacking_coach,
    created_at: new Date(row.created_at).toISOString(),
    payload: parsePayload(row.payload),
  }
}

export function createAnnotationRepository(db) {
  return {
    async insert(userId, annotation) {
      assertUserId(userId)
      try {
        const [{ id }] = await db('annotations')
          .insert({
            user_id:             userId,
            sppi_id:             annotation.sppiId,
            match_id:            annotation.matchId,
            attacking_team:      annotation.attackingTeam,
            attacking_team_key:  annotation.attackingTeamKey,
            attacking_coach:     annotation.attackingCoach,
            attacking_coach_key: annotation.attackingCoachKey,
            payload:             JSON.stringify(annotation.payload),
            created_at:          new Date().toISOString(),
          })
          .returning('id')
        return id
      } catch (error) {
        if (isUniqueViolation(error)) throw new DuplicateAnnotationError()
        throw error
      }
    },

    async listForUser(userId, { limit, offset }) {
      assertUserId(userId)
      const rows = await db('annotations')
        .where({ user_id: userId })
        .orderBy('id', 'desc')
        .limit(limit)
        .offset(offset)
      return rows.map(toRecord)
    },

    async findForUser(userId, id) {
      assertUserId(userId)
      const row = await db('annotations').where({ user_id: userId, id }).first()
      return row ? toRecord(row) : null
    },

    // One row per group. Spellings that differ only by case/spacing share a key;
    // the display name is the spelling used most often (ties: alphabetical).
    async listGroups(userId, by) {
      assertUserId(userId)
      const columns = GROUP_COLUMNS[by]
      const rows = await db('annotations')
        .where({ user_id: userId })
        .whereNotNull(columns.key)
        .groupBy(columns.key, columns.name)
        .select({ key: columns.key, name: columns.name })
        .count({ uses: '*' })

      const groups = new Map()
      for (const { key, name, uses } of rows) {
        const group = groups.get(key) ?? { key, total: 0, spellings: [] }
        group.total += Number(uses)
        group.spellings.push({ name, uses: Number(uses) })
        groups.set(key, group)
      }
      return [...groups.values()]
        .map(({ key, total, spellings }) => {
          spellings.sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
          return { key, name: spellings[0].name, total }
        })
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    },

    async payloadsForGroup(userId, by, key) {
      assertUserId(userId)
      const columns = GROUP_COLUMNS[by]
      const rows = await db('annotations')
        .where({ user_id: userId, [columns.key]: key })
        .select('payload')
      return rows.map(row => parsePayload(row.payload))
    },
  }
}
