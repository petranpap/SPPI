const ZONES = [
  { id: 'near_post',    label: 'Near Post' },
  { id: 'far_post',     label: 'Far Post' },
  { id: 'penalty_spot', label: 'Penalty Spot' },
  { id: 'center',       label: 'Center' },
  { id: 'outside_area', label: 'Outside Area' },
]

export default function ZoneSelector({ value, onChange, label }) {
  return (
    <div className="field-group">
      {label && <label className="field-label">{label}</label>}
      <div className="zone-grid">
        {ZONES.map(z => (
          <button
            key={z.id}
            data-zone={z.id}
            className={`zone-btn ${value === z.id ? 'selected' : ''}`}
            onClick={() => onChange(z.id)}
            style={z.id === 'outside_area' ? { gridColumn: 'span 2' } : {}}
          >
            {z.label}
          </button>
        ))}
      </div>
    </div>
  )
}
