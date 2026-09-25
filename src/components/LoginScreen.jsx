import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useI18n } from '../i18n'
import PublicLayout from './PublicLayout'
import { usePageTitle } from '../usePageTitle'

export default function LoginScreen({ onLogin }) {
  const { t, errorMessage } = useI18n()
  const [searchParams] = useSearchParams()
  const [mode,        setMode]        = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')   // 'login' | 'register'
  const [username,    setUsername]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password,    setPassword]    = useState('')
  const [inviteCode,  setInviteCode]  = useState('')
  const [error,       setError]       = useState(null)
  const [pending,     setPending]     = useState(false)

  const isRegister = mode === 'register'
  usePageTitle(t(isRegister ? 'login.titleRegister' : 'login.titleSignIn'))

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const { user } = isRegister
        ? await api.register(username.trim(), password, displayName.trim(), inviteCode.trim())
        : await api.login(username.trim(), password)
      onLogin(user)
    } catch (err) {
      setError(err)
      setPending(false)
    }
  }

  return (
    <PublicLayout user={null} hideSignIn>
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-heading">{t(isRegister ? 'login.headingRegister' : 'login.headingSignIn')}</h1>

        {isRegister && (
          <div className="field-group">
            <label className="field-label" htmlFor="login-name">{t('login.name')}</label>
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
          <label className="field-label" htmlFor="login-username">{t('login.username')}</label>
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
          <label className="field-label" htmlFor="login-password">{t('login.password')}</label>
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
          {isRegister && <p className="field-hint">{t('login.passwordHint')}</p>}
        </div>

        {isRegister && (
          <div className="field-group">
            <label className="field-label" htmlFor="login-invite">{t('login.inviteCode')}</label>
            <input
              id="login-invite"
              className="field-input"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              autoComplete="off"
              required
            />
            <p className="field-hint">{t('login.inviteHint')}</p>
          </div>
        )}

        {error && <p className="login-error" role="alert">{errorMessage(error)}</p>}

        <button className="confirm-btn" type="submit" disabled={pending}>
          {pending ? t('login.wait') : t(isRegister ? 'login.submitRegister' : 'login.submitSignIn')}
        </button>

        <p className="login-hint">
          {t(isRegister ? 'login.haveAccount' : 'login.newHere')}{' '}
          <button type="button" className="link-btn" onClick={switchMode}>
            {t(isRegister ? 'login.signInLink' : 'login.createLink')}
          </button>
        </p>
        {isRegister && <p className="login-hint">{t('login.privacyNote')}</p>}
        <p className="login-hint"><Link to="/help" className="link-btn">{t('site.helpFaq')}</Link></p>
      </form>
    </div>
    </PublicLayout>
  )
}
