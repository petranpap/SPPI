import ZoneSelector from './ZoneSelector'

const GESTURES = [
  { id: 'one_arm_up',  label: 'One Arm Up' },
  { id: 'two_arms_up', label: 'Two Arms Up' },
  { id: 'point_near',  label: 'Point Near' },
  { id: 'point_far',   label: 'Point Far' },
  { id: 'wave',        label: 'Wave' },
  { id: 'open_hand',   label: 'Open Hand' },
]

const DELIVERY_TYPES = [
  { id: 'inswinger',  label: 'Inswinger',  desc: 'Curves toward goal' },
  { id: 'outswinger', label: 'Outswinger', desc: 'Curves away from goal' },
  { id: 'flat',       label: 'Flat',       desc: 'Driven, no curve' },
  { id: 'short',      label: 'Short',      desc: 'Short pass routine' },
]

export default function ExecutionSection({ data, onChange, validated }) {
  const set = (field, value) => onChange({ ...data, [field]: value })

  const setExecutor = (idx, field, value) => {
    const exs = [...data.executors]
    exs[idx] = { ...exs[idx], [field]: value }
    set('executors', exs)
  }

  const addExecutor = () => {
    if (data.executors.length < 2) {
      set('executors', [...data.executors, { jersey_number: '', role: 'secondary' }])
    }
  }

  const removeExecutor = (idx) => {
    set('executors', data.executors.filter((_, i) => i !== idx))
  }

  const setSignal = (field, value) =>
    onChange({ ...data, signal: { ...data.signal, [field]: value } })

  const setSignaler = (field, value) =>
    onChange({
      ...data,
      signal: {
        ...data.signal,
        signaler: { ...data.signal.signaler, [field]: value },
      },
    })

  return (
    <div>
      <p className="section-title">Execution</p>

      {/* Corner Side */}
      <div className="field-group">
        <label className="field-label">Corner Side</label>
        <div className="btn-group">
          {[
            { id: 'left',  label: '← Left Corner'  },
            { id: 'right', label: 'Right Corner →' },
          ].map(s => (
            <button
              key={s.id}
              className={`btn-option ${data.corner_side === s.id ? 'selected' : ''}`}
              onClick={() => set('corner_side', s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Executors */}
      <div className="field-group">
        <label className="field-label">Executor(s)</label>
        {data.executors.map((ex, i) => (
          <div key={i} className="executor-row">
            <input
              className={`field-input ${validated && i === 0 && !ex.jersey_number ? 'is-error' : ''}`}
              type="number"
              min="1"
              max="99"
              placeholder="Jersey #"
              value={ex.jersey_number}
              onChange={e => setExecutor(i, 'jersey_number', e.target.value)}
              style={{ width: '90px', flexShrink: 0 }}
            />
            <span className={`role-badge ${ex.role}`}>
              {ex.role === 'primary' ? 'Primary' : 'Secondary'}
            </span>
            {i > 0 && (
              <button className="icon-btn" onClick={() => removeExecutor(i)} title="Remove">×</button>
            )}
          </div>
        ))}
        {data.executors.length < 2 && (
          <button className="dashed-btn" onClick={addExecutor}>
            + Add Secondary Executor
          </button>
        )}
      </div>

      <div className="divider" />

      {/* Signal toggle */}
      <div className="toggle-row">
        <span className="toggle-label">Pre-Corner Signal</span>
        <button
          className={`toggle-btn ${data.hasSignal ? 'on' : ''}`}
          onClick={() => set('hasSignal', !data.hasSignal)}
        />
      </div>

      {data.hasSignal && (
        <div className="sub-card" style={{ marginBottom: '14px' }}>
          <div className="field-row" style={{ marginBottom: '0' }}>
            <div className="field-group">
              <label className="field-label">Signaler Jersey #</label>
              <input
                className="field-input"
                type="number"
                min="1"
                max="99"
                placeholder="#"
                value={data.signal.signaler.jersey_number}
                onChange={e => setSignaler('jersey_number', e.target.value)}
              />
            </div>
          </div>

          <ZoneSelector
            label="Signaler Location"
            value={data.signal.signaler.location}
            onChange={v => setSignaler('location', v)}
          />

          <div className="field-group">
            <label className="field-label">Gesture</label>
            <div className="btn-group">
              {GESTURES.map(g => (
                <button
                  key={g.id}
                  className={`btn-option ${data.signal.gesture === g.id ? 'selected' : ''}`}
                  onClick={() => setSignal('gesture', g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <ZoneSelector
            label="Signal Target Zone"
            value={data.signal.target}
            onChange={v => setSignal('target', v)}
          />
        </div>
      )}

      <div className="divider" />

      {/* Foot */}
      <div className="field-group">
        <label className="field-label">Kicking Foot</label>
        <div className="btn-group">
          {['left', 'right'].map(f => (
            <button
              key={f}
              className={`btn-option ${data.foot === f ? 'selected' : ''}`}
              onClick={() => set('foot', f)}
            >
              {f === 'left' ? '← Left' : 'Right →'}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery type */}
      <div className="field-group">
        <label className="field-label">Delivery Type</label>
        <div className="btn-group">
          {DELIVERY_TYPES.map(d => (
            <button
              key={d.id}
              className={`btn-option ${data.delivery_type === d.id ? 'selected' : ''}`}
              onClick={() => set('delivery_type', d.id)}
              title={d.desc}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target zone */}
      <ZoneSelector
        label="Delivery Target Zone"
        value={data.target_zone}
        onChange={v => set('target_zone', v)}
      />
    </div>
  )
}
