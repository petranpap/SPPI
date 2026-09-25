import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import PublicLayout from './PublicLayout'
import { usePageTitle } from '../usePageTitle'

export default function LoginScreen({ onLogin }) {
  const [searchParams] = useSearchParams()
  const [mode,        setMode]        = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [username,    setUsername]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password,    setPassword]    = useState('')
  const [inviteCode,  setInviteCode]  = useState('')
  const [error,       setError]       = useState('')
  const [pending,     setPending]     = useState(false)

  const isRegister = mode === 'register'
  usePageTitle(isRegister ? 'Create account' : 'Sign in')

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setPending(true)
    setError('')
    try {
      const { user } = isRegister
        ? await api.register(username.trim(), password, displayName.trim(), inviteCode.trim())
        : await api.login(username.trim(), password)
      onLogin(user)
    } catch (err) {
      setError(err.message)
      setPending(false)
    }
  }

  return (
    <PublicLayout user={null} hideSignIn>
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-heading">{isRegister ? 'Create your account' : 'Sign in'}</h1>

        {isRegister && (
          <div className="field-group">
            <label className="field-label" htmlFor="login-name">Your name</label>
            <input
              id="login-name"
              className="field-input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoComplete="name"
              maxLength={60}
              autoFocus
              required
            />
          </div>
        )}

        <div className="field-group">
          <label className="field-label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            className="field-input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus={!isRegister}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="field-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 10 : undefined}
            required
          />
          {isRegister && <p className="field-hint">At least 10 characters.</p>}
        </div>

        {isRegister && (
          <div className="field-group">
            <label className="field-label" htmlFor="login-invite">Invite code</label>
            <input
              id="login-invite"
              className="field-input"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              autoComplete="off"
              required
            />
            <p className="field-hint">Ask your administrator for the invite code.</p>
          </div>
        )}

        {error && <p className="login-error" role="alert">{error}</p>}

        <button className="confirm-btn" type="submit" disabled={pending}>
          {pending ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <p className="login-hint">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" className="link-btn" onClick={switchMode}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        {isRegister && (
          <p className="login-hint">You will only ever see the corners you annotate yourself.</p>
        )}
        <p className="login-hint"><Link to="/help" className="link-btn">Help &amp; FAQ</Link></p>
      </form>
    </div>
    </PublicLayout>
  )
}
