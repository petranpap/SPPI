import { useEffect, useState } from 'react'
import { api } from './api'
import { useI18n } from './i18n'
import LanguageSwitch from './components/LanguageSwitch'
import MetadataSection  from './components/MetadataSection'
import ContextSection   from './components/ContextSection'
import ExecutionSection from './components/ExecutionSection'
import EventsSection    from './components/EventsSection'
import OutcomeSection   from './components/OutcomeSection'
import PitchDiagram     from './components/PitchDiagram'
import InsightsView     from './components/InsightsView'

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
  attacking_coach: '',
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
    gesture_side: null,
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
  { id: 'metadata' },
  { id: 'context' },
  { id: 'execution' },
  { id: 'events' },
  { id: 'outcome' },
]

const VIEWS = ['record', 'insights']

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
        gesture_side: exec.signal.gesture_side ?? null,
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
      attacking_coach: meta.attacking_coach.trim() || null,
    },
    context: {
      minute:         parseInt(ctx.minute) || 0,
      period:         ctx.period,
      score_home:     parseInt(ctx.score_home) || 0,
      score_away:     parseInt(ctx.score_away) || 0,
      set_piece_type: 'corner',
      corner_side:    exec.corner_side,
    },
    execution: {
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
// Returns the app.missing.* keys of the required fields that are still empty.
function getEmptyFields(meta, ctx, exec, events) {
  const missing = []
  if (!meta.sppi_id.trim())                    missing.push('sppiId')
  if (!meta.match_id.trim())                   missing.push('matchId')
  if (!meta.competition.trim())                missing.push('competition')
  if (!meta.season.trim())                     missing.push('season')
  if (!meta.home_team.trim())                  missing.push('homeTeam')
  if (!meta.away_team.trim())                  missing.push('awayTeam')
  if (!meta.attacking_team.trim())             missing.push('attackingTeam')
  if (!meta.defending_team.trim())             missing.push('defendingTeam')
  if (!String(ctx.minute).trim())              missing.push('minute')
  if (!exec.executors[0]?.jersey_number)       missing.push('executorJersey')
  if (events.length === 0)                     missing.push('events')
  return missing
}

function downloadJson(json) {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${json.metadata.sppi_id}_${json.metadata.match_id.trim() || 'unknown'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App({ user, onLogout }) {
  const { t, errorMessage } = useI18n()
  const [view,        setView]        = useState('record')
  const [active,      setActive]      = useState('metadata')
  const [meta,        setMeta]        = useState(INIT_META)
  const [ctx,         setCtx]         = useState(INIT_CTX)
  const [exec,        setExec]        = useState(INIT_EXEC)
  const [events,      setEvents]      = useState([])
  const [outcome,     setOutcome]     = useState(INIT_OUTCOME)
  const [showConfirm, setShowConfirm] = useState(false)
  const [validated,   setValidated]   = useState(false)
  const [emptyFields, setEmptyFields] = useState([])
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState(null)
  const [savedNotice, setSavedNotice] = useState('')
  const [suggestions, setSuggestions] = useState({ teams: [], coaches: [] })

  const loadSuggestions = () =>
    Promise.all([api.groups('team'), api.groups('coach')])
      .then(([teams, coaches]) => setSuggestions({
        teams:   teams.groups.map(g => g.name),
        coaches: coaches.groups.map(g => g.name),
      }))
      .catch(() => {})

  useEffect(() => { loadSuggestions() }, [])

  const handleSaveAttempt = () => {
    setValidated(true)
    const errors = getEmptyFields(meta, ctx, exec, events)
    setEmptyFields(errors)
    setSaveError(null)
    setShowConfirm(true)
  }

  const handleConfirmSave = async () => {
    const json = buildSppi(meta, ctx, exec, events, outcome)
    setSaving(true)
    setSaveError(null)
    try {
      await api.saveAnnotation(json)
    } catch (err) {
      // Keep the form intact so nothing the annotator entered is lost.
      if (err.status === 401) return onLogout()
      setSaveError(err)
      setSaving(false)
      return
    }
    setSaving(false)
    setSavedNotice(json.metadata.sppi_id)
    setTimeout(() => setSavedNotice(''), 4000)
    setMeta(INIT_META)
    setCtx(INIT_CTX)
    setExec(INIT_EXEC)
    setEvents([])
    setOutcome(INIT_OUTCOME)
    setActive('metadata')
    setValidated(false)
    setShowConfirm(false)
    setEmptyFields([])
    loadSuggestions()
  }

  const handleExportJson = () => downloadJson(buildSppi(meta, ctx, exec, events, outcome))

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
        <span className="step-label">{t(`app.sections.${s.id}`)}</span>
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
          <span className="brand-title">{t('site.name')}</span>
        </div>

        <nav className="header-nav" aria-label={t('app.viewsLabel')}>
          {VIEWS.map(id => (
            <button
              key={id}
              className={`header-tab${view === id ? ' header-tab--active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => setView(id)}
            >
              {t(`app.tabs.${id}`)}
            </button>
          ))}
        </nav>

        <div className="header-right">
          {savedNotice && <span className="header-notice" role="status">{t('app.savedNotice', { id: savedNotice })}</span>}
          {view === 'record' && (
            <span className="header-status">
              {totalEvents > 0 ? t('app.eventsRecorded', { n: totalEvents }) : t('app.noEvents')}
              {hasSppiId && `  ·  ${meta.sppi_id}`}
            </span>
          )}

          {view === 'record' && (
            <button className="save-btn" onClick={handleSaveAttempt}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12l-4.5-4.5 1.06-1.06L7.5 9.38V2h1v7.38l2.94-2.94 1.06 1.06L8 12z"/>
                <path d="M2 13h12v1H2z"/>
              </svg>
              {t('app.save')}
            </button>
          )}

          <LanguageSwitch />
          <a className="header-help" href="/help" target="_blank" rel="noopener noreferrer">{t('app.help')}</a>
          <span className="header-user">{user.displayName}</span>
          <button className="header-logout" onClick={onLogout}>{t('app.signOut')}</button>
        </div>
      </header>

      {/* ── Body ── */}
      {view === 'insights' && <InsightsView />}
      {view === 'record' && <div className="app-body">

        {/* ── Form panel ── */}
        <div className="form-panel">
          <nav className="step-bar">
            {stepElements}
          </nav>

          <div className="section-content">
            {active === 'metadata'  && <MetadataSection  data={meta}    onChange={setMeta}    validated={validated} suggestions={suggestions} />}
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

      </div>}

      {/* ── Confirmation modal ── */}
      {showConfirm && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowConfirm(false)}
        >
          <div className="modal">
            <p className="modal-title">{t('app.modal.title')}</p>

            {emptyFields.length > 0 && (
              <div className="modal-warnings">
                <p className="modal-warn-header">{t('app.modal.missingHeader')}</p>
                <ul className="modal-warn-list">
                  {emptyFields.map(field => (
                    <li key={field} className="modal-warn-item">{t(`app.missing.${field}`)}</li>
                  ))}
                </ul>
              </div>
            )}

            {saveError && (
              <div className="modal-warnings" role="alert">
                <p className="modal-warn-header">{errorMessage(saveError)}</p>
                <ul className="modal-warn-list">
                  {(saveError.details ?? []).map(d => (
                    <li key={d} className="modal-warn-item">{d}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="modal-message">{t('app.modal.message')}</p>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleExportJson} disabled={saving}>
                {t('app.modal.download')}
              </button>
              <button className="cancel-btn" onClick={() => setShowConfirm(false)} disabled={saving}>
                {t('app.modal.cancel')}
              </button>
              <button
                className="confirm-btn"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={handleConfirmSave}
                disabled={saving}
              >
                {saving ? t('app.modal.saving') : emptyFields.length > 0 ? t('app.modal.saveAnyway') : t('app.modal.saveClear')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
