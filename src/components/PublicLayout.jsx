import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import CutLogo from './CutLogo'
import LanguageSwitch from './LanguageSwitch'

// Shared frame for the public pages (welcome, login, help): header, content, footer.
export default function PublicLayout({ user, hideSignIn = false, children }) {
  const { t } = useI18n()

  return (
    <div className="public-page">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span className="brand-pill">SPPI</span>
          <span className="brand-title">{t('site.name')}</span>
        </Link>

        <nav className="public-nav" aria-label={t('site.navLabel')}>
          <Link to="/help">{t('site.helpFaq')}</Link>
          <LanguageSwitch />
          {user
            ? <Link to="/app" className="cta cta--light">{t('site.openRecorder')}</Link>
            : !hideSignIn && <Link to="/login" className="cta cta--light">{t('site.signIn')}</Link>}
        </nav>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-footer">
        <div className="footer-credit">
          <CutLogo height={32} />
          <span>{t('site.footerCredit')}</span>
        </div>
        <Link to="/help">{t('site.helpFaq')}</Link>
      </footer>
    </div>
  )
}
