// In-memory limiter: at most `max` recorded attempts per key within `windowMs`.
export function createAttemptLimiter({ windowMs, max }) {
  const attempts = new Map()

  function entryFor(key) {
    const entry = attempts.get(key)
    if (entry && entry.resetAt > Date.now()) return entry
    attempts.delete(key)
    return null
  }

  return {
    isBlocked: key => (entryFor(key)?.count ?? 0) >= max,
    record(key) {
      const entry = entryFor(key) ?? { count: 0, resetAt: Date.now() + windowMs }
      entry.count += 1
      attempts.set(key, entry)
    },
    clear: key => attempts.delete(key),
  }
}
