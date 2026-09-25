import { useI18n } from '../i18n'

const PERIODS = ['1', '2', 'ET1', 'ET2']

export default function ContextSection({ data, onChange, validated }) {
  const { t } = useI18n()
  const set = (field, value) => onChange({ ...data, [field]: value })

  return (
    <div>
      <p className="section-title">{t('context.title')}</p>

      <div className="field-group">
        <label className="field-label">{t('context.period')}</label>
        <div className="btn-group">
          {PERIODS.map(period => (
            <button
              key={period}
              className={`btn-option ${data.period === period ? 'selected' : ''}`}
              onClick={() => set('period', period)}
            >
              {t(`context.periods.${period}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">{t('context.minute')}</label>
        <input
          className={`field-input ${validated && !String(data.minute).trim() ? 'is-error' : ''}`}
          type="number"
          min="1"
          max="120"
          value={data.minute}
          onChange={e => set('minute', e.target.value)}
          placeholder={t('context.minutePlaceholder')}
          style={{ width: '110px' }}
        />
      </div>

      <div className="divider" />

      <label className="field-label" style={{ marginBottom: '12px', display: 'block' }}>
        {t('context.score')}
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <label className="field-label">{t('context.home')}</label>
          <div className="score-stepper">
            <button className="stepper-btn" onClick={() => set('score_home', Math.max(0, data.score_home - 1))}>−</button>
            <span className="stepper-val">{data.score_home}</span>
            <button className="stepper-btn" onClick={() => set('score_home', data.score_home + 1)}>+</button>
          </div>
        </div>

        <span style={{ fontSize: '20px', color: 'var(--text-muted)', marginTop: '18px' }}>—</span>

        <div>
          <label className="field-label">{t('context.away')}</label>
          <div className="score-stepper">
            <button className="stepper-btn" onClick={() => set('score_away', Math.max(0, data.score_away - 1))}>−</button>
            <span className="stepper-val">{data.score_away}</span>
            <button className="stepper-btn" onClick={() => set('score_away', data.score_away + 1)}>+</button>
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="field-group">
        <label className="field-label">{t('context.setPieceType')}</label>
        <div className="btn-group">
          <button className="btn-option selected" style={{ cursor: 'default', pointerEvents: 'none' }}>
            {t('context.cornerKick')}
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
          {t('context.fixedNote')}
        </p>
      </div>
    </div>
  )
}
