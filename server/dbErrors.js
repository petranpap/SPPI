const UNIQUE_VIOLATION_CODES = new Set(['23505', 'SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_CONSTRAINT_PRIMARYKEY'])

export const isUniqueViolation = error => UNIQUE_VIOLATION_CODES.has(error.code)
