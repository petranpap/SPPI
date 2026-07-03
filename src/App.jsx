import { useState } from 'react'
import MetadataSection  from './components/MetadataSection'
import ContextSection   from './components/ContextSection'
import ExecutionSection from './components/ExecutionSection'
import EventsSection    from './components/EventsSection'
import OutcomeSection   from './components/OutcomeSection'
import PitchDiagram     from './components/PitchDiagram'

// ── Initial state ──────────────────────────────────────────────────────────────
const INIT_META = {
  sppi_id:        '',
  match_id:       '',
  competition:    '',
  season:         '',
  home_team:      '',
  away_team:      '',
  attacking_team: '',
  defending_team: '',
}

const INIT_CTX = {
  minute:      '',
  period:      '1',
  score_home:  0,
  score_away:  0,
}

const INIT_EXEC = {
  executors:    [{ jersey_number: '', role: 'primary' }],
  hasSignal:    false,
  signal: {
    signaler: { jersey_number: '', location: 'near_post' },
    gesture:  'one_arm_up',
    target:   'near_post',
  },
  foot:          'right',
  delivery_type: 'inswinger',
  target_zone:   'near_post',
  corner_side:   'right',
}

const INIT_OUTCOME = {
  termination_type:  'cleared',
  termination_zone:  'outside_area',
  final_action:      'clearance',
  final_player:      { jersey_number: '', team: 'defending' },
  hasSpawned:        false,
  spawned_instance:  '',
  hasParent:         false,
  parent_instance:   '',
}

const SECTIONS = [
  { id: 'metadata',  label: 'Metadata' },
  { id: 'context',   label: 'Context' },
  { id: 'execution', label: 'Execution' },
  { id: 'events',    label: 'Events' },
  { id: 'outcome',   label: 'Outcome' },
]

// ── JSON builder ───────────────────────────────────────────────────────────────
function buildSppi(meta, ctx, exec, events, outcome) {
  const executors = exec.executors
    .filter(e => e.jersey_number !== '')
    .map(e => ({
      jersey_number: parseInt(e.jersey_number),
      player_id:     null,
      role:          e.role,
    }))

  const signal = exec.hasSignal
    ? {
        signaler: {
          jersey_number: exec.signal.signaler.jersey_number
            ? parseInt(exec.signal.signaler.jersey_number)
            : null,
          player_id: null,
          location:  exec.signal.signaler.location,
        },
        gesture: exec.signal.gesture,
        target:  exec.signal.target,
      }
    : null

  return {
    metadata: {
      sppi_id:        meta.sppi_id  || `SPPI_${Date.now()}`,
      match_id:       meta.match_id,
      source:         'manual',
      timestamp:      Math.floor(Date.now() / 1000),
      competition:    meta.competition,
      season:         meta.season,
      home_team:      meta.home_team,
      away_team:      meta.away_team,
      attacking_team: meta.attacking_team,
      defending_team: meta.defending_team,
    },
    context: {
      minute:         parseInt(ctx.minute) || 0,
      period:         ctx.period,
      score_home:     parseInt(ctx.score_home) || 0,
      score_away:     parseInt(ctx.score_away) || 0,
      set_piece_type: 'corner',
    },
    execution: {
      corner_side:   exec.corner_side,
      executors,
      signal,
      foot:          exec.foot,
      delivery_type: exec.delivery_type,
      target_zone:   exec.target_zone,
    },
    events: events.map((ev, i) => ({
      sequence_index: i + 1,
      player: {
        jersey_number: ev.jersey_number ? parseInt(ev.jersey_number) : null,
        team:          ev.team,
        zone_before:   ev.zone_before,
        zone_after:    ev.zone_after,
        action_type:   ev.action_type,
        outcome:       ev.outcome,
      },
    })),
    outcome: {
      termination_type: outcome.termination_type,
      termination_zone: outcome.termination_zone,
      final_action:     outcome.final_action,
      final_player: {
        jersey_number: outcome.final_player.jersey_number
          ? parseInt(outcome.final_player.jersey_number)
          : null,
        team: outcome.final_player.team,
      },
      spawned_instance: outcome.hasSpawned && outcome.spawned_instance
        ? outcome.spawned_instance
        : null,
      parent_instance:  outcome.hasParent && outcome.parent_instance
        ? outcome.parent_instance
        : null,
    },
  }
}

// ── Validation ─────────────────────────────────────────────────────────────────
function getEmptyFields(meta, ctx, exec, events) {
  const errors = []
  if (!meta.sppi_id.trim())                    errors.push('SPPI ID')
  if (!meta.match_id.trim())                   errors.push('Match ID')
  if (!meta.competition.trim())                errors.push('Competition')
  if (!meta.season.trim())                     errors.push('Season')
  if (!meta.home_team.trim())                  errors.push('Home Team')
  if (!meta.away_team.trim())                  errors.push('Away Team')
  if (!meta.attacking_team.trim())             errors.push('Attacking Team')
  if (!meta.defending_team.trim())             errors.push('Defending Team')
  if (!String(ctx.minute).trim())              errors.push('Minute')
  if (!exec.executors[0]?.jersey_number)       errors.push('Primary Executor Jersey #')
  if (events.length === 0)                     errors.push('At least 1 event required')
  return errors
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [active,      setActive]      = useState('metadata')
  const [meta,        setMeta]        = useState(INIT_META)
  const [ctx,         setCtx]         = useState(INIT_CTX)
  const [exec,        setExec]        = useState(INIT_EXEC)
  const [events,      setEvents]      = useState([])
  const [outcome,     setOutcome]     = useState(INIT_OUTCOME)
  const [showConfirm, setShowConfirm] = useState(false)
  const [validated,   setValidated]   = useState(false)
  const [emptyFields, setEmptyFields] = useState([])

  const handleSaveAttempt = () => {
    setValidated(true)
    const errors = getEmptyFields(meta, ctx, exec, events)
    setEmptyFields(errors)
    setShowConfirm(true)
  }

  const handleConfirmSave = () => {
    const json    = buildSppi(meta, ctx, exec, events, outcome)
    const sppiId  = json.metadata.sppi_id
    const matchId = meta.match_id.trim() || 'unknown'
    const blob    = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url     = URL.createObjectURL(blob)
    const a       = document.createElement('a')
    a.href        = url
    a.download    = `exports/${sppiId}_${matchId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    // Reset everything
    setMeta(INIT_META)
    setCtx(INIT_CTX)
    setExec(INIT_EXEC)
    setEvents([])
    setOutcome(INIT_OUTCOME)
    setActive('metadata')
    setValidated(false)
    setShowConfirm(false)
    setEmptyFields([])
  }

  const totalEvents = events.length
  const hasSppiId   = meta.sppi_id.trim() !== ''

  const activeIdx = SECTIONS.findIndex(s => s.id === active)

  const stepElements = []
  SECTIONS.forEach((s, i) => {
    const isDone    = i < activeIdx
    const isCurrent = i === activeIdx
    if (i > 0) {
      stepElements.push(
        <div
          key={`conn-${i}`}
          className={`step-connector${i <= activeIdx ? ' step-connector--lit' : ''}`}
        />
      )
    }
    stepElements.push(
      <button
        key={s.id}
        className={`step${isCurrent ? ' step--current' : ''}${isDone ? ' step--done' : ''}`}
        onClick={() => setActive(s.id)}
      >
        <div className="step-circle">
          {isDone ? '✓' : i + 1}
        </div>
        <span className="step-label">{s.label}</span>
        {s.id === 'events' && events.length > 0 && (
          <span className="step-event-badge">{events.length}</span>
        )}
      </button>
    )
  })

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-pill">SPPI</span>
          <span className="brand-title">Corner Kick Recorder</span>
        </div>

        <div className="header-right">
          <span className="header-status">
            {totalEvents > 0
              ? `${totalEvents} event${totalEvents > 1 ? 's' : ''} recorded`
              : 'No events yet'}
            {hasSppiId && `  ·  ${meta.sppi_id}`}
          </span>

          <button className="save-btn" onClick={handleSaveAttempt}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12l-4.5-4.5 1.06-1.06L7.5 9.38V2h1v7.38l2.94-2.94 1.06 1.06L8 12z"/>
              <path d="M2 13h12v1H2z"/>
            </svg>
            Save Instance
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="app-body">

        {/* ── Form panel ── */}
        <div className="form-panel">
          <nav className="step-bar">
            {stepElements}
          </nav>

          <div className="section-content">
            {active === 'metadata'  && <MetadataSection  data={meta}    onChange={setMeta}    validated={validated} />}
            {active === 'context'   && <ContextSection   data={ctx}     onChange={setCtx}     validated={validated} />}
            {active === 'execution' && <ExecutionSection data={exec}    onChange={setExec}    validated={validated} />}
            {active === 'events'    && <EventsSection    events={events} onChange={setEvents} />}
            {active === 'outcome'   && <OutcomeSection   data={outcome} onChange={setOutcome} onSave={handleSaveAttempt} />}
          </div>
        </div>

        {/* ── Pitch panel ── */}
        <div className="pitch-panel">
          <PitchDiagram events={events} execution={exec} onExecChange={setExec} />
        </div>

      </div>

      {/* ── Confirmation modal ── */}
      {showConfirm && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowConfirm(false)}
        >
          <div className="modal">
            <p className="modal-title">Save Instance?</p>

            {emptyFields.length > 0 && (
              <div className="modal-warnings">
                <p className="modal-warn-header">Missing required fields</p>
                <ul className="modal-warn-list">
                  {emptyFields.map(f => (
                    <li key={f} className="modal-warn-item">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="modal-message">
              Save as{' '}
              <strong>
                exports/{meta.sppi_id.trim() || `SPPI_${Date.now()}`}_{meta.match_id.trim() || 'unknown'}.json
              </strong>
              {' '}and clear all fields?
            </p>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={handleConfirmSave}
              >
                {emptyFields.length > 0 ? 'Save anyway' : 'Save & Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
