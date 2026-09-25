import jwt from 'jsonwebtoken'
import { sendError } from './httpError.js'

const COOKIE_NAME = 'sppi_session'

export function createSessionManager({ jwtSecret, sessionDays, cookieSecure }, userRepository) {
  const maxAgeMs = sessionDays * 24 * 60 * 60 * 1000

  function startSession(res, userId) {
    const token = jwt.sign({}, jwtSecret, { subject: String(userId), expiresIn: `${sessionDays}d` })
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure:   cookieSecure,
      maxAge:   maxAgeMs,
    })
  }

  function endSession(res) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: cookieSecure })
  }

  // Sets req.user from the signed cookie. The user id always comes from here, never from the request body.
  async function requireAuth(req, res, next) {
    try {
      const token = req.cookies?.[COOKIE_NAME]
      if (!token) return sendError(res, 401, 'not_signed_in', 'Not signed in')
      const claims = jwt.verify(token, jwtSecret)
      const user = await userRepository.findById(Number(claims.sub))
      if (!user) return sendError(res, 401, 'not_signed_in', 'Not signed in')
      req.user = user
      next()
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return sendError(res, 401, 'not_signed_in', 'Not signed in')
      }
      next(error)
    }
  }

  return { startSession, endSession, requireAuth }
}
