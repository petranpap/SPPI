import crypto from 'node:crypto'

const isProduction = process.env.NODE_ENV === 'production'

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (isProduction) throw new Error('JWT_SECRET must be set in production')
  console.warn('[config] JWT_SECRET not set — using a random one; sessions reset on every restart.')
  return crypto.randomBytes(32).toString('hex')
}

function resolveDatabase() {
  if (process.env.DATABASE_URL) {
    return { client: 'pg', connection: process.env.DATABASE_URL }
  }
  return {
    client: 'better-sqlite3',
    connection: { filename: process.env.DATABASE_FILE || 'data/sppi.sqlite' },
    useNullAsDefault: true,
  }
}

function resolveRegistrationCode() {
  const code = process.env.REGISTRATION_CODE
  if (!code && isProduction) {
    console.warn('[config] REGISTRATION_CODE not set — sign-up is open to anyone who reaches this server.')
  }
  return code || null
}

// Browsers refuse Secure cookies over plain http://, so login only works over HTTPS unless this is off.
// Default: secure in production. COOKIE_SECURE=0 is for an HTTP-only pilot; use HTTPS for real use.
const cookieSecure = process.env.COOKIE_SECURE !== undefined ? process.env.COOKIE_SECURE === '1' : isProduction

const trustProxy = process.env.TRUST_PROXY === '1'

export const config = {
  isProduction,
  cookieSecure,
  port: Number(process.env.PORT) || 3001,
  // Behind a reverse proxy only the proxy may reach us; otherwise clients could forge X-Forwarded-For.
  host: process.env.HOST || (trustProxy ? '127.0.0.1' : '0.0.0.0'),
  jwtSecret: resolveJwtSecret(),
  sessionDays: 7,
  trustProxy,
  database: resolveDatabase(),
  registrationCode: resolveRegistrationCode(),
}
