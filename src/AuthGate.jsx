import { useEffect, useState } from 'react'
import { api } from './api'
import App from './App'
import LoginScreen from './components/LoginScreen'

// undefined = still checking the session, null = signed out
export default function AuthGate() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
  }, [])

  const handleLogout = async () => {
    await api.logout().catch(() => {})
    setUser(null)
  }

  if (user === undefined) return <div className="auth-loading">Loading…</div>
  if (user === null)      return <LoginScreen onLogin={setUser} />
  return <App user={user} onLogout={handleLogout} />
}
