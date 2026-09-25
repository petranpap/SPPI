// Every error response carries a stable `code` (translated by the client) plus an English `error` text.
export function sendError(res, status, code, message, extra = {}) {
  return res.status(status).json({ error: message, code, ...extra })
}
