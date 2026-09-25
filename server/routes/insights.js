import { Router } from 'express'
import { buildInsights } from '../insights.js'
import { normalizeName } from '../nameKey.js'

const GROUP_MODES = new Set(['team', 'coach'])

// Both endpoints only ever see the signed-in user's own annotations. `name` filters
// within that set; it is not a lookup of other users' data.
export function createInsightsRouter({ annotationRepository }) {
  const router = Router()

  const requireGroupMode = (req, res, next) => {
    if (!GROUP_MODES.has(req.query.by)) {
      return res.status(400).json({ error: "Query parameter 'by' must be 'team' or 'coach'" })
    }
    next()
  }

  router.get('/groups', requireGroupMode, async (req, res, next) => {
    try {
      const groups = await annotationRepository.listGroups(req.user.id, req.query.by)
      res.json({ groups: groups.map(({ name, total }) => ({ name, total })) })
    } catch (error) {
      next(error)
    }
  })

  router.get('/insights', requireGroupMode, async (req, res, next) => {
    try {
      const name = typeof req.query.name === 'string' ? req.query.name : ''
      if (!name.trim()) return res.status(400).json({ error: "Query parameter 'name' is required" })

      const payloads = await annotationRepository.payloadsForGroup(req.user.id, req.query.by, normalizeName(name))
      res.json({ by: req.query.by, name: name.trim(), ...buildInsights(payloads) })
    } catch (error) {
      next(error)
    }
  })

  return router
}
