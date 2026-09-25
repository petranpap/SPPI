import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cookieParser from 'cookie-parser'
import { createSessionManager } from './auth.js'
import { createUserRepository } from './repositories/userRepository.js'
import { createAnnotationRepository } from './repositories/annotationRepository.js'
import { createAuthRouter } from './routes/auth.js'
import { createAnnotationsRouter } from './routes/annotations.js'
import { createInsightsRouter } from './routes/insights.js'

const DIST_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

export function createApp({ db, config }) {
  const userRepository       = createUserRepository(db)
  const annotationRepository = createAnnotationRepository(db)
  const sessions             = createSessionManager(config, userRepository)

  const app = express()
  app.disable('x-powered-by')
  if (config.trustProxy) app.set('trust proxy', 1)

  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' })
    next()
  })
  app.use(express.json({ limit: '256kb' }))
  app.use(cookieParser())

  app.use('/api/auth', createAuthRouter({ userRepository, sessions, registrationCode: config.registrationCode }))
  app.use('/api/annotations', sessions.requireAuth, createAnnotationsRouter({ annotationRepository }))
  app.use('/api', sessions.requireAuth, createInsightsRouter({ annotationRepository }))
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

  if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR))
    // Client-side routes (/login, /help, /app): serve the SPA shell. Missing files (anything with an extension) stay 404.
    app.get('/{*splat}', (req, res, next) => {
      if (path.extname(req.path)) return next()
      res.sendFile(path.join(DIST_DIR, 'index.html'))
    })
  }

  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' })
    if (error.type === 'entity.too.large')    return res.status(413).json({ error: 'Payload too large' })
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
