import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { createAttemptLimiter } from '../attemptLimiter.js'
import { checkNewAccount } from '../accountRules.js'
import { DuplicateUsernameError } from '../repositories/userRepository.js'
import { sendError } from '../httpError.js'

// Compared against when the username is unknown, so response time doesn't reveal which usernames exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12)

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

export function createAuthRouter({ userRepository, sessions, registrationCode }) {
  const router = Router()
  const loginLimiter    = createAttemptLimiter({ windowMs: 15 * 60 * 1000, max: 10 })   // failed logins per ip+username
  const registerLimiter = createAttemptLimiter({ windowMs: 60 * 60 * 1000, max: 10 })   // sign-ups per ip

  router.post('/register', async (req, res, next) => {
    try {
      if (registerLimiter.isBlocked(req.ip)) {
        return sendError(res, 429, 'too_many_signups', 'Too many sign-ups from this address. Try again later.')
      }
      const { username, password, displayName, inviteCode } = req.body ?? {}
      if (registrationCode && !timingSafeEqual(inviteCode ?? '', registrationCode)) {
        registerLimiter.record(req.ip)
        return sendError(res, 403, 'invalid_invite_code', 'Invalid invite code')
      }
      const problem = checkNewAccount({ username, password, displayName })
      if (problem) return sendError(res, 400, problem.code, problem.message)

      registerLimiter.record(req.ip)
      const passwordHash = await bcrypt.hash(password, 12)
      const id = await userRepository.create({ username: username.trim(), passwordHash, displayName: displayName.trim() })
      sessions.startSession(res, id)
      res.status(201).json({ user: { username: username.trim().toLowerCase(), displayName: displayName.trim(), organisation: null } })
    } catch (error) {
      if (error instanceof DuplicateUsernameError) {
        return sendError(res, 409, 'username_taken', 'That username is already taken')
      }
      next(error)
    }
  })

  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body ?? {}
      if (typeof username !== 'string' || typeof password !== 'string') {
        return sendError(res, 400, 'credentials_required', 'Username and password are required')
      }

      const limiterKey = `${req.ip}|${username.toLowerCase()}`
      if (loginLimiter.isBlocked(limiterKey)) {
        return sendError(res, 429, 'too_many_attempts', 'Too many failed attempts. Try again later.')
      }

      const user = await userRepository.findByUsername(username)
      const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
      if (!user || !passwordMatches) {
        loginLimiter.record(limiterKey)
        return sendError(res, 401, 'invalid_credentials', 'Invalid username or password')
      }

      loginLimiter.clear(limiterKey)
      sessions.startSession(res, user.id)
      res.json({ user: { username: user.username, displayName: user.displayName, organisation: user.organisation } })
    } catch (error) {
      next(error)
    }
  })

  router.post('/logout', (req, res) => {
    sessions.endSession(res)
    res.status(204).end()
  })

  router.get('/me', sessions.requireAuth, (req, res) => {
    const { username, displayName, organisation } = req.user
    res.json({ user: { username, displayName, organisation } })
  })

  return router
}
