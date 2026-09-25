import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { api } from './api'
import App from './App'
import Welcome from './pages/Welcome'
import Help from './pages/Help'
import LoginScreen from './components/LoginScreen'

// user: undefined = still checking the session, null = signed out
function AppRoutes() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
  }, [])

  // A full page load (not a client-side navigation) so no signed-in state survives in memory.
  const handleLogout = async () => {
    await api.logout().catch(() => {})
    window.location.assign('/')
  }

  if (user === undefined) return <div className="auth-loading">Loading…</div>

  return (
    <Routes>
      <Route path="/"      element={<Welcome user={user} />} />
      <Route path="/help"  element={<Help user={user} />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <LoginScreen onLogin={setUser} />} />
      <Route path="/app"   element={user ? <App user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
      <Route path="*"      element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function Root() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
