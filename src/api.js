export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message)
    this.status  = status
    this.details = details
  }
}

async function request(method, path, body) {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body:    body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Request failed', data?.details ?? [])
  }
  return data
}

export const api = {
  login:          (username, password) => request('POST', '/api/auth/login', { username, password }),
  register:        (username, password, displayName, inviteCode) => request('POST', '/api/auth/register', { username, password, displayName, inviteCode }),
  logout:         ()                   => request('POST', '/api/auth/logout'),
  me:             ()                   => request('GET',  '/api/auth/me'),
  saveAnnotation: sppi                 => request('POST', '/api/annotations', sppi),
  groups:         by                   => request('GET',  `/api/groups?by=${by}`),
  insights:       (by, name)           => request('GET',  `/api/insights?by=${by}&name=${encodeURIComponent(name)}`),
}
