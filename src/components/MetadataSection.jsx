export default function MetadataSection({ data, onChange, validated }) {
  const set = (field, value) => onChange({ ...data, [field]: value })
  const err = (val) => validated && !String(val).trim() ? 'is-error' : ''

  return (
    <div>
      <p className="section-title">Match Metadata</p>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">SPPI ID</label>
          <input
            className={`field-input ${err(data.sppi_id)}`}
            value={data.sppi_id}
            onChange={e => set('sppi_id', e.target.value)}
            placeholder="e.g. SPPI_001"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Match ID</label>
          <input
            className={`field-input ${err(data.match_id)}`}
            value={data.match_id}
            onChange={e => set('match_id', e.target.value)}
            placeholder="e.g. UCL_2024_BAR_RMA_001"
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Competition</label>
          <input
            className={`field-input ${err(data.competition)}`}
            value={data.competition}
            onChange={e => set('competition', e.target.value)}
            placeholder="UEFA Champions League"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Season</label>
          <input
            className={`field-input ${err(data.season)}`}
            value={data.season}
            onChange={e => set('season', e.target.value)}
            placeholder="2023/24"
          />
        </div>
      </div>

      <div className="divider" />

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Home Team</label>
          <input
            className={`field-input ${err(data.home_team)}`}
            value={data.home_team}
            onChange={e => set('home_team', e.target.value)}
            placeholder="e.g. Barcelona"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Away Team</label>
          <input
            className={`field-input ${err(data.away_team)}`}
            value={data.away_team}
            onChange={e => set('away_team', e.target.value)}
            placeholder="e.g. Real Madrid"
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Attacking Team</label>
          <input
            className={`field-input ${err(data.attacking_team)}`}
            value={data.attacking_team}
            onChange={e => set('attacking_team', e.target.value)}
            placeholder="Taking the corner"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Defending Team</label>
          <input
            className={`field-input ${err(data.defending_team)}`}
            value={data.defending_team}
            onChange={e => set('defending_team', e.target.value)}
            placeholder="Defending"
          />
        </div>
      </div>
    </div>
  )
}
