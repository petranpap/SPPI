const PERIODS = [
  { id: '1',   label: '1st Half' },
  { id: '2',   label: '2nd Half' },
  { id: 'ET1', label: 'Extra Time 1' },
  { id: 'ET2', label: 'Extra Time 2' },
]

export default function ContextSection({ data, onChange, validated }) {
  const set = (field, value) => onChange({ ...data, [field]: value })

  return (
    <div>
      <p className="section-title">Match Context</p>

      <div className="field-group">
        <label className="field-label">Period</label>
        <div className="btn-group">
          {PERIODS.map(p => (
            <button
              key={p.id}
              className={`btn-option ${data.period === p.id ? 'selected' : ''}`}
              onClick={() => set('period', p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Minute</label>
        <input
          className={`field-input ${validated && !String(data.minute).trim() ? 'is-error' : ''}`}
          type="number"
          min="1"
          max="120"
          value={data.minute}
          onChange={e => set('minute', e.target.value)}
          placeholder="e.g. 67"
          style={{ width: '110px' }}
        />
      </div>

      <div className="divider" />

      <label className="field-label" style={{ marginBottom: '12px', display: 'block' }}>
        Score at Moment of Corner
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <label className="field-label">Home</label>
          <div className="score-stepper">
            <button className="stepper-btn" onClick={() => set('score_home', Math.max(0, data.score_home - 1))}>−</button>
            <span className="stepper-val">{data.score_home}</span>
            <button className="stepper-btn" onClick={() => set('score_home', data.score_home + 1)}>+</button>
          </div>
        </div>

        <span style={{ fontSize: '20px', color: 'var(--text-muted)', marginTop: '18px' }}>—</span>

        <div>
          <label className="field-label">Away</label>
          <div className="score-stepper">
            <button className="stepper-btn" onClick={() => set('score_away', Math.max(0, data.score_away - 1))}>−</button>
            <span className="stepper-val">{data.score_away}</span>
            <button className="stepper-btn" onClick={() => set('score_away', data.score_away + 1)}>+</button>
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="field-group">
        <label className="field-label">Set Piece Type</label>
        <div className="btn-group">
          <button className="btn-option selected" style={{ cursor: 'default', pointerEvents: 'none' }}>
            Corner Kick
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
          Fixed — this recorder is for corners only.
        </p>
      </div>
    </div>
  )
}
