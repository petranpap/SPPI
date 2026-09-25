import { Router } from 'express'
import { DuplicateAnnotationError } from '../repositories/annotationRepository.js'
import { cleanName, normalizeName } from '../nameKey.js'
import { validateSppi } from '../validation.js'

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE     = 500

function parsePagination(query) {
  const limit  = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0)
  return { limit, offset }
}

export function createAnnotationsRouter({ annotationRepository }) {
  const router = Router()

  router.post('/', async (req, res, next) => {
    try {
      const { errors, sppi } = validateSppi(req.body)
      if (errors) return res.status(400).json({ error: 'Invalid SPPI instance', details: errors })

      const { metadata } = sppi
      const attackingTeam  = cleanName(metadata.attacking_team)
      const attackingCoach = cleanName(metadata.attacking_coach) || null
      const id = await annotationRepository.insert(req.user.id, {
        sppiId:             metadata.sppi_id.trim(),
        matchId:            metadata.match_id,
        attackingTeam,
        attackingTeamKey:   normalizeName(attackingTeam),
        attackingCoach,
        attackingCoachKey:  attackingCoach && normalizeName(attackingCoach),
        payload:            sppi,
      })
      res.status(201).json({ id })
    } catch (error) {
      if (error instanceof DuplicateAnnotationError) {
        return res.status(409).json({ error: 'You already saved an instance with this SPPI ID' })
      }
      next(error)
    }
  })

  router.get('/', async (req, res, next) => {
    try {
      const annotations = await annotationRepository.listForUser(req.user.id, parsePagination(req.query))
      res.json({ annotations })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      // Someone else's annotation and a nonexistent one are indistinguishable: both 404.
      const annotation = Number.isInteger(id) ? await annotationRepository.findForUser(req.user.id, id) : null
      if (!annotation) return res.status(404).json({ error: 'Not found' })
      res.json({ annotation })
    } catch (error) {
      next(error)
    }
  })

  return router
}
