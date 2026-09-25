export const MIN_PASSWORD_LENGTH = 10
export const MAX_PASSWORD_LENGTH = 72 // bcrypt ignores everything past 72 bytes

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/
const MAX_DISPLAY_NAME_LENGTH = 60

// Returns { code, message } for the first problem, or null when the credentials are acceptable.
export function checkNewAccount({ username, password, displayName }) {
  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username.trim().toLowerCase())) {
    return { code: 'invalid_username', message: 'Username must be 3–32 characters: letters, numbers, dot, dash or underscore' }
  }
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > MAX_DISPLAY_NAME_LENGTH) {
    return { code: 'invalid_name', message: `Name is required (max ${MAX_DISPLAY_NAME_LENGTH} characters)` }
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return { code: 'invalid_password', message: `Password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters` }
  }
  return null
}
