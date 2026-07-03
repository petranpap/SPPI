import { useState } from 'react'
import ZoneSelector from './ZoneSelector'

const ACTION_TYPES = [
  { id: 'header',    label: 'Header',    icon: '🦅' },
  { id: 'shot',      label: 'Shot',      icon: '⚡' },
  { id: 'goal',      label: 'Goal',      icon: '⚽' },
  { id: 'pass',      label: 'Pass',      icon: '➡' },
  { id: 'clearance', label: 'Clearance', icon: '↩' },
  { id: 'block',     label: 'Block',     icon: '🛡' },
  { id: 'touch',     label: 'Touch',     icon: '✋' },
]

const BLANK_EVENT = {
  jersey_number: '',
  team: 'attacking',
  zone_before: 'outside_area',
  zone_after: 'near_post',
  action_type: 'pass',
  outcome: 'success',
}

function actionIcon(id) {
  return ACTION_TYPES.find(a => a.id === id)?.icon ?? ''
}

function actionLabel(id) {
  return ACTION_TYPES.find(a => a.id === id)?.label ?? id
}

function zoneName(id) {
  const map = {
    near_post:    'Near Post',
    far_post:     'Far Post',
    penalty_spot: 'Pen. Spot',
    center:       'Center',
    outside_area: 'Outside',
  }
  return map[id] ?? id
}

export default function EventsSection({ events, onChange }) {
  const [showForm, setShowForm] = useState(events.length === 0)
  const [form, setForm] = useState(BLANK_EVENT)
  const [editIdx, setEditIdx] = useState(null)

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const openAdd = () => {
    setForm(BLANK_EVENT)
    setEditIdx(null)
    setShowForm(true)
  }

  const openEdit = (idx) => {
    setForm({ ...events[idx] })
    setEditIdx(idx)
    setShowForm(true)
  }

  const confirmEvent = () => {
    if (editIdx !== null) {
      const updated = [...events]
      updated[editIdx] = { ...form }
      onChange(updated)
    } else {
      onChange([...events, { ...form }])
    }
    setShowForm(false)
    setEditIdx(null)
    setForm(BLANK_EVENT)
  }

  const removeEvent = (idx) => {
    onChange(events.filter((_, i) => i !== idx))
    if (editIdx === idx) {
      setShowForm(false)
      setEditIdx(null)
    }
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const updated = [...events]
    ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
    onChange(updated)
  }

  const moveDown = (idx) => {
    if (idx === events.length - 1) return
    const updated = [...events]
    ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
    onChange(updated)
  }

  return (
    <div>
      <p className="section-title">Event Sequence</p>

      {events.length === 0 && !showForm && (
        <div className="empty-state">
          <span className="empty-state-icon">📋</span>
          No events recorded yet. Add the first ball contact below.
        </div>
      )}

      {events.length > 0 && (
        <div className="events-list">
          {events.map((ev, i) => (
            <div key={i} className={`event-card ${ev.team}`}>
              <div className="event-seq">{i + 1}</div>

              <div className="event-info">
                <strong>#{ev.jersey_number || '?'}</strong>{' '}
                <span className={`team-badge ${ev.team}`}>{ev.team}</span>{' '}
                {actionIcon(ev.action_type)} {actionLabel(ev.action_type)}
                <br />
                <span style={{ fontSize: '11px' }}>
                  {zoneName(ev.zone_before)}
                  <span className="event-arrow"> → </span>
                  {zoneName(ev.zone_after)}
                  {'  ·  '}
                  <span className={`outcome-dot ${ev.outcome}`} />
                  {ev.outcome}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
                <button
                  className="icon-btn"
                  style={{ fontSize: '12px', opacity: i === 0 ? 0.2 : 1 }}
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  title="Move up"
                >▲</button>
                <button
                  className="icon-btn"
                  style={{ fontSize: '12px', opacity: i === events.length - 1 ? 0.2 : 1 }}
                  onClick={() => moveDown(i)}
                  disabled={i === events.length - 1}
                  title="Move down"
                >▼</button>
              </div>

              <button
                className="icon-btn"
                style={{ fontSize: '14px', color: 'var(--text-muted)' }}
                onClick={() => openEdit(i)}
                title="Edit"
              >✎</button>
              <button className="icon-btn" onClick={() => removeEvent(i)} title="Remove">×</button>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button className="dashed-btn" style={{ marginBottom: '0' }} onClick={openAdd}>
          + Add Event
        </button>
      ) : (
        <div className="add-event-form">
          <p className="section-title" style={{ marginBottom: '12px' }}>
            {editIdx !== null ? `Edit Event ${editIdx + 1}` : 'New Event'}
          </p>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Jersey #</label>
              <input
                className="field-input"
                type="number"
                min="1"
                max="99"
                placeholder="#"
                value={form.jersey_number}
                onChange={e => setField('jersey_number', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Team</label>
              <div className="btn-group" style={{ flexDirection: 'column', gap: '5px' }}>
                {['attacking', 'defending'].map(t => (
                  <button
                    key={t}
                    className={`btn-option ${form.team === t ? 'selected' : ''}`}
                    onClick={() => setField('team', t)}
                    style={{ fontSize: '11px' }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Action Type</label>
            <div className="action-grid">
              {ACTION_TYPES.map(a => (
                <button
                  key={a.id}
                  className={`action-btn ${form.action_type === a.id ? 'selected' : ''}`}
                  onClick={() => setField('action_type', a.id)}
                >
                  <span className="action-icon">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <ZoneSelector
            label="Zone Before"
            value={form.zone_before}
            onChange={v => setField('zone_before', v)}
          />

          <ZoneSelector
            label="Zone After"
            value={form.zone_after}
            onChange={v => setField('zone_after', v)}
          />

          <div className="field-group">
            <label className="field-label">Outcome</label>
            <div className="btn-group">
              <button
                className={`btn-option ${form.outcome === 'success' ? 'selected' : ''}`}
                onClick={() => setField('outcome', 'success')}
                style={form.outcome === 'success' ? { background: '#dcfce7', borderColor: '#16a34a', color: '#15803d' } : {}}
              >
                ✓ Success
              </button>
              <button
                className={`btn-option ${form.outcome === 'fail' ? 'selected' : ''}`}
                onClick={() => setField('outcome', 'fail')}
                style={form.outcome === 'fail' ? { background: '#fee2e2', borderColor: '#dc2626', color: '#991b1b' } : {}}
              >
                ✗ Fail
              </button>
            </div>
          </div>

          <div className="btn-row">
            <button className="confirm-btn" style={{ flex: 1 }} onClick={confirmEvent}>
              {editIdx !== null ? 'Update Event' : 'Add Event'}
            </button>
            <button className="cancel-btn" onClick={() => { setShowForm(false); setEditIdx(null) }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
