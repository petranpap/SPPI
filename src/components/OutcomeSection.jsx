import ZoneSelector from './ZoneSelector'

const TERMINATION_TYPES = [
  { id: 'goal',        label: '⚽ Goal' },
  { id: 'out_of_play', label: '↗ Out of Play' },
  { id: 'cleared',     label: '↩ Cleared' },
]

const ACTION_TYPES = [
  { id: 'header',    label: 'Header' },
  { id: 'shot',      label: 'Shot' },
  { id: 'pass',      label: 'Pass' },
  { id: 'clearance', label: 'Clearance' },
  { id: 'block',     label: 'Block' },
  { id: 'touch',     label: 'Touch' },
]

export default function OutcomeSection({ data, onChange, onSave }) {
  const set = (field, value) => onChange({ ...data, [field]: value })
  const setFinalPlayer = (field, value) =>
    onChange({ ...data, final_player: { ...data.final_player, [field]: value } })

  return (
    <div>
      <p className="section-title">Outcome</p>

      {/* Termination type */}
      <div className="field-group">
        <label className="field-label">Termination Type</label>
        <div className="btn-group">
          {TERMINATION_TYPES.map(t => (
            <button
              key={t.id}
              className={`btn-option ${data.termination_type === t.id ? 'selected' : ''}`}
              onClick={() => set('termination_type', t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Termination zone */}
      <ZoneSelector
        label="Termination Zone"
        value={data.termination_zone}
        onChange={v => set('termination_zone', v)}
      />

      {/* Final action */}
      <div className="field-group">
        <label className="field-label">Final Action</label>
        <div className="btn-group">
          {ACTION_TYPES.map(a => (
            <button
              key={a.id}
              className={`btn-option ${data.final_action === a.id ? 'selected' : ''}`}
              onClick={() => set('final_action', a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Final player */}
      <label className="field-label" style={{ marginBottom: '10px', display: 'block' }}>
        Final Player
      </label>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Jersey #</label>
          <input
            className="field-input"
            type="number"
            min="1"
            max="99"
            placeholder="#"
            value={data.final_player.jersey_number}
            onChange={e => setFinalPlayer('jersey_number', e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="field-label">Team</label>
          <div className="btn-group" style={{ flexDirection: 'column', gap: '5px' }}>
            {['attacking', 'defending'].map(t => (
              <button
                key={t}
                className={`btn-option ${data.final_player.team === t ? 'selected' : ''}`}
                onClick={() => setFinalPlayer('team', t)}
                style={{ fontSize: '11px' }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Spawned instance */}
      <div className="toggle-row">
        <span className="toggle-label">Spawned Instance</span>
        <button
          className={`toggle-btn ${data.hasSpawned ? 'on' : ''}`}
          onClick={() => set('hasSpawned', !data.hasSpawned)}
        />
      </div>
      {data.hasSpawned && (
        <div className="field-group">
          <label className="field-label">Spawned SPPI ID</label>
          <input
            className="field-input"
            value={data.spawned_instance}
            onChange={e => set('spawned_instance', e.target.value)}
            placeholder="e.g. SPPI_002 (next linked phase)"
          />
        </div>
      )}
      {!data.hasSpawned && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-4px' }}>
          Enable if this corner led to a short-corner or subsequent set piece.
        </p>
      )}

      {/* Parent instance */}
      <div className="toggle-row">
        <span className="toggle-label">Parent Instance</span>
        <button
          className={`toggle-btn ${data.hasParent ? 'on' : ''}`}
          onClick={() => set('hasParent', !data.hasParent)}
        />
      </div>
      {data.hasParent && (
        <div className="field-group">
          <label className="field-label">Parent SPPI ID</label>
          <input
            className="field-input"
            value={data.parent_instance}
            onChange={e => set('parent_instance', e.target.value)}
            placeholder="e.g. SPPI_001 (parent phase)"
          />
        </div>
      )}
      {!data.hasParent && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px' }}>
          Enable if this phase was derived from a previous SPPI instance.
        </p>
      )}

      <div className="divider" />

      <button className="confirm-btn" onClick={onSave}>
        Save Instance
      </button>
    </div>
  )
}
