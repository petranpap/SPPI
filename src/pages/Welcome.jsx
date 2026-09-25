import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import CornerIllustration from '../components/CornerIllustration'
import { usePageTitle } from '../usePageTitle'

const FEATURES = [
  {
    title: 'Record',
    body: 'Walk through five short steps — match, context, execution, events, outcome — with a live pitch diagram beside the form. Every corner becomes one structured SPPI record.',
  },
  {
    title: 'Review',
    body: 'Once you have recorded 10 corners for a team or a coach, Insights shows plain counts: which signals were used, where deliveries went, what type they were. Group by team, or by coach across clubs.',
  },
  {
    title: 'Keep it yours',
    body: 'Your annotations are visible only to you. There is no search across other users and no shared pool — other accounts cannot look up what you recorded.',
  },
]

const STEPS = [
  { title: 'Get an account', body: 'Sign up with the invite code from your administrator.' },
  { title: 'Record corners', body: 'Fill in the form for each corner you watch.' },
  { title: 'Save', body: 'Each record is stored in your account, ready to review.' },
  { title: 'See your patterns', body: 'At 10 corners for a team or coach, Insights unlocks.' },
]

export default function Welcome({ user }) {
  usePageTitle('')

  return (
    <PublicLayout user={user}>
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">SPPI · Set-Piece Phase Instance</p>
          <h1>Record corner kicks. See how teams really take them.</h1>
          <p className="hero-lead">
            A structured annotation tool for football analysts and coaching staff. Log each corner-kick
            attacking phase — the routine, the pre-corner signal, the ball contacts, the outcome — then
            review the patterns in your own data.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/app" className="cta cta--primary">Open the recorder</Link>
            ) : (
              <>
                <Link to="/login?mode=register" className="cta cta--primary">Create an account</Link>
                <Link to="/login" className="cta cta--ghost">Sign in</Link>
              </>
            )}
            <Link to="/help" className="text-link">How it works →</Link>
          </div>
        </div>
        <CornerIllustration />
      </section>

      <section className="band">
        <div className="band-inner">
          <h2>What you can do</h2>
          <div className="feature-grid">
            {FEATURES.map(feature => (
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
          <h2>How it works</h2>
          <ol className="step-list">
            {STEPS.map((step, i) => (
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
            <h3>What Insights are — and are not</h3>
            <p>
              Insights are descriptive tallies of the corners <strong>you</strong> annotated, such as
              “6 of 10 went to the far post.” They are not predictions, and they only reflect what you
              have recorded.
            </p>
          </div>
          <h2>About the project</h2>
          <p className="about-text">
            SPPI is a provider-independent data model for corner-kick phases, developed as part of a PhD
            project on set-piece analysis at the Cyprus University of Technology. Records follow a
            published JSON schema, so annotations can be reused in research.
          </p>
          <Link to="/help" className="text-link">Read the guide and FAQ →</Link>
        </div>
      </section>
    </PublicLayout>
  )
}
