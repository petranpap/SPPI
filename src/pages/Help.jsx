import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import RichText from '../i18n/RichText'
import { useI18n } from '../i18n'
import { usePageTitle } from '../usePageTitle'

export default function Help({ user }) {
  const { t } = useI18n()
  usePageTitle(t('help.title'))

  return (
    <PublicLayout user={user}>
      <div className="doc">
        <header className="doc-head">
          <p className="eyebrow">{t('help.eyebrow')}</p>
          <h1>{t('help.heading')}</h1>
          <nav className="doc-toc" aria-label={t('help.tocLabel')}>
            <a href="#getting-started">{t('help.toc.gettingStarted')}</a>
            <a href="#recording">{t('help.toc.recording')}</a>
            <a href="#insights">{t('help.toc.insights')}</a>
            <a href="#faq">{t('help.toc.faq')}</a>
          </nav>
        </header>

        <section id="getting-started" className="doc-section">
          <h2>{t('help.gettingStarted.title')}</h2>
          <ol className="doc-list">
            {t('help.gettingStarted.items').map(item => (
              <li key={item}><RichText text={item} /></li>
            ))}
          </ol>
        </section>

        <section id="recording" className="doc-section">
          <h2>{t('help.recording.title')}</h2>
          <p>{t('help.recording.intro')}</p>
          <ol className="doc-steps">
            {t('help.recording.steps').map((step, i) => (
              <li key={step.name}>
                <span className="step-num">{i + 1}</span>
                <div>
                  <h3>{step.name}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="callout">
            <h3>{t('help.recording.savingTitle')}</h3>
            <p><RichText text={t('help.recording.savingBody')} /></p>
          </div>
        </section>

        <section id="insights" className="doc-section">
          <h2>{t('help.insights.title')}</h2>
          <p><RichText text={t('help.insights.intro')} /></p>
          <ul className="doc-list">
            {t('help.insights.charts').map(chart => (
              <li key={chart}><RichText text={chart} /></li>
            ))}
          </ul>
          <p><RichText text={t('help.insights.outro')} /></p>
        </section>

        <section id="faq" className="doc-section">
          <h2>{t('help.faq.title')}</h2>
          <div className="faq">
            {t('help.faq.items').map(item => (
              <details key={item.q} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="doc-cta">
          {user
            ? <Link to="/app" className="cta cta--primary">{t('help.ctaOpen')}</Link>
            : <Link to="/login?mode=register" className="cta cta--primary">{t('help.ctaCreate')}</Link>}
        </div>
      </div>
    </PublicLayout>
  )
}
