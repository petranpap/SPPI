import { useI18n } from '../i18n'

// Order matches the 2-column grid layout (outside_area spans both columns).
const ZONES = ['near_post', 'far_post', 'penalty_spot', 'center', 'outside_area']

export default function ZoneSelector({ value, onChange, label }) {
  const { t } = useI18n()

  return (
    <div className="field-group">
      {label && <label className="field-label">{label}</label>}
      <div className="zone-grid">
        {ZONES.map(zone => (
          <button
            key={zone}
            data-zone={zone}
            className={`zone-btn ${value === zone ? 'selected' : ''}`}
            onClick={() => onChange(zone)}
            style={zone === 'outside_area' ? { gridColumn: 'span 2' } : {}}
          >
            {t(`zone.button.${zone}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
