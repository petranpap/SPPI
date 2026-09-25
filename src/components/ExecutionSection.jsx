import ZoneSelector from './ZoneSelector'
import { useI18n } from '../i18n'

const GESTURES       = ['one_arm_up', 'two_arms_up', 'point_near', 'point_far', 'wave', 'open_hand']
const SIDES          = ['left', 'right']
const DELIVERY_TYPES = ['inswinger', 'outswinger', 'flat', 'short']

export default function ExecutionSection({ data, onChange, validated }) {
  const { t } = useI18n()
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

  const setGesture = gesture =>
    onChange({
      ...data,
      signal: {
        ...data.signal,
        gesture,
        gesture_side: gesture === 'two_arms_up' ? null : data.signal.gesture_side,
      },
    })

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
      <p className="section-title">{t('execution.title')}</p>

      {/* Corner Side */}
      <div className="field-group">
        <label className="field-label">{t('execution.cornerSide')}</label>
        <div className="btn-group">
          {[
            { id: 'left',  label: t('execution.leftCorner')  },
            { id: 'right', label: t('execution.rightCorner') },
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
        <label className="field-label">{t('execution.executors')}</label>
        {data.executors.map((ex, i) => (
          <div key={i} className="executor-row">
            <input
              className={`field-input ${validated && i === 0 && !ex.jersey_number ? 'is-error' : ''}`}
              type="number"
              min="1"
              max="99"
              placeholder={t('execution.jerseyPlaceholder')}
              value={ex.jersey_number}
              onChange={e => setExecutor(i, 'jersey_number', e.target.value)}
              style={{ width: '110px', flexShrink: 0 }}
            />
            <span className={`role-badge ${ex.role}`}>
              {ex.role === 'primary' ? t('execution.primary') : t('execution.secondary')}
            </span>
            {i > 0 && (
              <button className="icon-btn" onClick={() => removeExecutor(i)} title={t('execution.remove')}>×</button>
            )}
          </div>
        ))}
        {data.executors.length < 2 && (
          <button className="dashed-btn" onClick={addExecutor}>
            {t('execution.addSecondary')}
          </button>
        )}
      </div>

      <div className="divider" />

      {/* Signal toggle */}
      <div className="toggle-row">
        <span className="toggle-label">{t('execution.signalToggle')}</span>
        <button
          className={`toggle-btn ${data.hasSignal ? 'on' : ''}`}
          onClick={() => set('hasSignal', !data.hasSignal)}
        />
      </div>

      {data.hasSignal && (
        <div className="sub-card" style={{ marginBottom: '14px' }}>
          <div className="field-row" style={{ marginBottom: '0' }}>
            <div className="field-group">
              <label className="field-label">{t('execution.signalerJersey')}</label>
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
            label={t('execution.signalerLocation')}
            value={data.signal.signaler.location}
            onChange={v => setSignaler('location', v)}
          />

          <div className="field-group">
            <label className="field-label">{t('execution.gesture')}</label>
            <div className="btn-group">
              {GESTURES.map(gesture => (
                <button
                  key={gesture}
                  className={`btn-option ${data.signal.gesture === gesture ? 'selected' : ''}`}
                  onClick={() => setGesture(gesture)}
                >
                  {t(`gesture.${gesture}`)}
                </button>
              ))}
            </div>
          </div>

          {data.signal.gesture !== 'two_arms_up' && (
            <div className="field-group">
              <label className="field-label">
                {t('execution.armUsed')} <span className="field-optional">{t('metadata.optional')}</span>
              </label>
              <div className="btn-group">
                {SIDES.map(side => (
                  <button
                    key={side}
                    className={`btn-option ${data.signal.gesture_side === side ? 'selected' : ''}`}
                    onClick={() => setSignal('gesture_side', data.signal.gesture_side === side ? null : side)}
                  >
                    {t(`side.${side}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ZoneSelector
            label={t('execution.signalTarget')}
            value={data.signal.target}
            onChange={v => setSignal('target', v)}
          />
        </div>
      )}

      <div className="divider" />

      {/* Foot */}
      <div className="field-group">
        <label className="field-label">{t('execution.kickingFoot')}</label>
        <div className="btn-group">
          {['left', 'right'].map(foot => (
            <button
              key={foot}
              className={`btn-option ${data.foot === foot ? 'selected' : ''}`}
              onClick={() => set('foot', foot)}
            >
              {foot === 'left' ? t('execution.footLeft') : t('execution.footRight')}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery type */}
      <div className="field-group">
        <label className="field-label">{t('execution.deliveryType')}</label>
        <div className="btn-group">
          {DELIVERY_TYPES.map(type => (
            <button
              key={type}
              className={`btn-option ${data.delivery_type === type ? 'selected' : ''}`}
              onClick={() => set('delivery_type', type)}
              title={t(`delivery.desc.${type}`)}
            >
              {t(`delivery.label.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Target zone */}
      <ZoneSelector
        label={t('execution.deliveryTarget')}
        value={data.target_zone}
        onChange={v => set('target_zone', v)}
      />
    </div>
  )
}
