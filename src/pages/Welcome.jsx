import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import CornerIllustration from '../components/CornerIllustration'
import CutLogo from '../components/CutLogo'
import RichText from '../i18n/RichText'
import { useI18n } from '../i18n'
import { usePageTitle } from '../usePageTitle'

export default function Welcome({ user }) {
  const { t } = useI18n()
  usePageTitle('')

  return (
    <PublicLayout user={user}>
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">{t('welcome.eyebrow')}</p>
          <h1>{t('welcome.heading')}</h1>
          <p className="hero-lead">{t('welcome.lead')}</p>
          <div className="hero-actions">
            {user ? (
              <Link to="/app" className="cta cta--primary">{t('welcome.openRecorder')}</Link>
            ) : (
              <>
                <Link to="/login?mode=register" className="cta cta--primary">{t('welcome.createAccount')}</Link>
                <Link to="/login" className="cta cta--ghost">{t('welcome.signIn')}</Link>
              </>
            )}
            <Link to="/help" className="text-link">{t('welcome.howItWorksLink')}</Link>
          </div>
          <div className="hero-credit">
            <CutLogo />
            <p>{t('welcome.credit')}</p>
          </div>
        </div>
        <CornerIllustration />
      </section>

      <section className="band">
        <div className="band-inner">
          <h2>{t('welcome.whatYouCanDo')}</h2>
          <div className="feature-grid">
            {t('welcome.features').map(feature => (
              <article key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band band--plain">
        <div className="band-inner">
          <h2>{t('welcome.howItWorks')}</h2>
          <ol className="step-list">
            {t('welcome.steps').map((step, i) => (
              <li key={step.title}>
                <span className="step-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band">
        <div className="band-inner band-inner--narrow">
          <div className="callout">
            <h3>{t('welcome.calloutTitle')}</h3>
            <p><RichText text={t('welcome.calloutBody')} /></p>
          </div>
          <h2>{t('welcome.aboutTitle')}</h2>
          <p className="about-text">{t('welcome.aboutBody')}</p>
          <dl className="credits">
            {t('welcome.credits').map(credit => (
              <div key={credit.role}>
                <dt>{credit.role}</dt>
                <dd>{credit.name}</dd>
              </div>
            ))}
          </dl>
          <Link to="/help" className="text-link">{t('welcome.readGuide')}</Link>
        </div>
      </section>
    </PublicLayout>
  )
}
