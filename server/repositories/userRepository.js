import { isUniqueViolation } from '../dbErrors.js'

export class DuplicateUsernameError extends Error {}

function toUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    organisation: row.organisation,
  }
}

export function createUserRepository(db) {
  return {
    async findByUsername(username) {
      const row = await db('users').where({ username: username.toLowerCase() }).first()
      return row ? { ...toUser(row), passwordHash: row.password_hash } : null
    },

    async findById(id) {
      const row = await db('users').where({ id }).first()
      return row ? toUser(row) : null
    },

    async create({ username, passwordHash, displayName, organisation }) {
      try {
        const [{ id }] = await db('users')
          .insert({
            username:      username.toLowerCase(),
            password_hash: passwordHash,
            display_name:  displayName,
            organisation:  organisation ?? null,
            created_at:    new Date().toISOString(),
          })
          .returning('id')
        return id
      } catch (error) {
        if (isUniqueViolation(error)) throw new DuplicateUsernameError()
        throw error
      }
    },

    async updatePasswordHash(username, passwordHash) {
      return db('users').where({ username: username.toLowerCase() }).update({ password_hash: passwordHash })
    },
  }
}
