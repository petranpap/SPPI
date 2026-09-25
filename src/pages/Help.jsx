import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { usePageTitle } from '../usePageTitle'

const RECORDING_STEPS = [
  {
    name: 'Metadata',
    body: 'Identify the match and the teams: an SPPI ID (a label you choose, e.g. SPPI_001 — it must be unique among your own annotations), the Match ID, competition, season, home and away team, the attacking team (the team taking the corner) and the defending team. Attacking Coach is optional, but it is what lets you group by coach later.',
  },
  {
    name: 'Context',
    body: 'The period, the minute, and the score at the moment of the corner. The set-piece type is fixed to corner kick.',
  },
  {
    name: 'Execution',
    body: 'How the corner was taken: left or right corner, the executor’s jersey number (add a secondary executor if two players stand over the ball), an optional pre-corner signal, the kicking foot, the delivery type and the delivery target zone. The pitch on the right is interactive — click a corner flag to set the side, click a zone to set the target.',
  },
  {
    name: 'Events',
    body: 'The ball contacts that follow, in order: who touched it (jersey number, attacking or defending), the zone they were in before and after, the action (header, shot, pass, clearance …) and whether it succeeded. At least one event is required. Use ▲ ▼ to reorder and ✎ to edit.',
  },
  {
    name: 'Outcome',
    body: 'How the phase ended — goal, out of play, or cleared — the zone where it ended, and the final action and player. If a short corner led to a follow-up phase, link the two records by their SPPI IDs.',
  },
]

const FAQ = [
  {
    q: 'What is SPPI?',
    a: 'SPPI stands for Set-Piece Phase Instance: a structured record of one corner-kick attacking phase, from the first touch at the corner arc until the phase ends. The format is part of a PhD research project on set-piece analysis at the Cyprus University of Technology.',
  },
  {
    q: 'Who can see the corners I record?',
    a: 'Only you. Every annotation belongs to the account that saved it, and other users cannot list, open or search it. There is deliberately no team-wide pool and no way to look up another user’s data.',
  },
  {
    q: 'Why do I need an invite code to sign up?',
    a: 'Sign-up is restricted to people your administrator has invited. Ask them for the current code.',
  },
  {
    q: 'I forgot my password. What now?',
    a: 'There is no automatic reset yet. Contact the administrator who gave you the invite code, and they can set a new password for you.',
  },
  {
    q: 'Why is Insights locked?',
    a: 'Insights needs at least 10 of your annotated corners for the same team (or the same coach). Each team or coach is counted separately, so 6 corners for one team and 6 for another does not unlock either. Spelling differences in capitals or extra spaces are treated as the same name.',
  },
  {
    q: 'What does “group by coach” do?',
    a: 'It combines your corners across clubs under one coach — for example everything you recorded from a coach’s teams at different clubs. It only includes corners where you filled in the optional Attacking Coach field.',
  },
  {
    q: 'Are the charts predictions?',
    a: 'No. They are plain frequency counts of what you recorded, for example “6 of 10 went to the far post”. They say nothing about what a team will do next.',
  },
  {
    q: 'What is the pre-corner signal?',
    a: 'A gesture a player makes before the corner is taken to indicate the routine — for example one arm raised, or pointing to the far post. Switch on Pre-Corner Signal in the Execution step, then record who signalled (jersey number and where they stand), the gesture, which arm, and the zone the signal pointed to. The signaller can be a different player from the executor.',
  },
  {
    q: 'What do the zones mean?',
    a: 'Near post: the area closest to the corner being taken. Far post: the opposite side. Center: the central penalty area. Penalty spot: around the penalty spot and the D. Outside area: anywhere outside the penalty area. Near and far post switch sides depending on the corner side.',
  },
  {
    q: 'Does the tool fill anything in for me?',
    a: 'No. Every field is entered by you from what you observe. Nothing is pre-filled from data feeds or video timestamps, so each annotation stays independent.',
  },
  {
    q: 'Can I edit or delete a saved corner?',
    a: 'Not yet. Check the details before pressing Save & Clear. If you spot a mistake afterwards, contact the administrator.',
  },
  {
    q: 'Can I get my data out?',
    a: 'In the save dialog, Download JSON gives you the current record as a file that follows the SPPI schema, before you save it. There is no bulk export in the app yet.',
  },
  {
    q: 'It says my SPPI ID is already used.',
    a: 'IDs must be unique among your own annotations. Pick a new one, such as the next number in your sequence. Another user can use the same ID; it does not clash with theirs.',
  },
  {
    q: 'I was in the middle of a corner and left the page.',
    a: 'A record that is not saved is lost if you leave or refresh the page. Open Help from the recorder in a new tab (the Help link does this) so your form stays untouched.',
  },
]

export default function Help({ user }) {
  usePageTitle('Help & FAQ')

  return (
    <PublicLayout user={user}>
      <div className="doc">
        <header className="doc-head">
          <p className="eyebrow">Help</p>
          <h1>How to use the recorder</h1>
          <nav className="doc-toc" aria-label="On this page">
            <a href="#getting-started">Getting started</a>
            <a href="#recording">Recording a corner</a>
            <a href="#insights">Insights</a>
            <a href="#faq">FAQ</a>
          </nav>
        </header>

        <section id="getting-started" className="doc-section">
          <h2>Getting started</h2>
          <ol className="doc-list">
            <li>
              <strong>Create an account.</strong> On the <Link to="/login?mode=register">sign-up page</Link>,
              enter your name, a username, a password of at least 10 characters, and the invite code from
              your administrator. You are signed in straight away.
            </li>
            <li>
              <strong>Record a corner</strong> in the Record tab (below). Each corner is one instance.
            </li>
            <li>
              <strong>Review your patterns</strong> in the Insights tab once you have 10 corners for a
              team or coach.
            </li>
          </ol>
        </section>

        <section id="recording" className="doc-section">
          <h2>Recording a corner</h2>
          <p>
            The form has five steps, shown at the top of the left panel. You can jump between them in any
            order. Fields left empty are listed when you save.
          </p>
          <ol className="doc-steps">
            {RECORDING_STEPS.map((step, i) => (
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
            <h3>Saving</h3>
            <p>
              Press <strong>Save Instance</strong> at the top right. The dialog lists any required fields
              still empty. <strong>Save &amp; Clear</strong> stores the record in your account and resets the
              form for the next corner. If the save fails, the form keeps everything you entered and shows
              the reason.
            </p>
          </div>
        </section>

        <section id="insights" className="doc-section">
          <h2>Insights</h2>
          <p>
            Open the Insights tab and choose <strong>Group by: Team</strong> or <strong>Coach</strong>. Pick a
            group from the list. Below 10 corners you see how many more are needed. From 10 corners, three
            charts appear:
          </p>
          <ul className="doc-list">
            <li><strong>Signal → delivery target</strong> — which pre-corner signal was used and where the delivery went.</li>
            <li><strong>Delivery type</strong> — inswinger, outswinger, flat or short.</li>
            <li><strong>Delivery target zone</strong> — near post, far post, center, penalty spot, outside area.</li>
          </ul>
          <p>
            Each chart has a <strong>Table</strong> button that switches to the same numbers as a table. Only
            corners you recorded are counted.
          </p>
        </section>

        <section id="faq" className="doc-section">
          <h2>FAQ</h2>
          <div className="faq">
            {FAQ.map(item => (
              <details key={item.q} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="doc-cta">
          {user
            ? <Link to="/app" className="cta cta--primary">Open the recorder</Link>
            : <Link to="/login?mode=register" className="cta cta--primary">Create an account</Link>}
        </div>
      </div>
    </PublicLayout>
  )
}
