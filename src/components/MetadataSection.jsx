import { useI18n } from '../i18n'

export default function MetadataSection({ data, onChange, validated, suggestions = { teams: [], coaches: [] } }) {
  const { t } = useI18n()
  const set = (field, value) => onChange({ ...data, [field]: value })
  const err = (val) => validated && !String(val).trim() ? 'is-error' : ''

  return (
    <div>
      <p className="section-title">{t('metadata.title')}</p>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">{t('metadata.sppiId')}</label>
          <input
            className={`field-input ${err(data.sppi_id)}`}
            value={data.sppi_id}
            onChange={e => set('sppi_id', e.target.value)}
            placeholder={t('metadata.placeholders.sppiId')}
          />
        </div>
        <div className="field-group">
          <label className="field-label">{t('metadata.matchId')}</label>
          <input
            className={`field-input ${err(data.match_id)}`}
            value={data.match_id}
            onChange={e => set('match_id', e.target.value)}
            placeholder={t('metadata.placeholders.matchId')}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">{t('metadata.competition')}</label>
          <input
            className={`field-input ${err(data.competition)}`}
            value={data.competition}
            onChange={e => set('competition', e.target.value)}
            placeholder={t('metadata.placeholders.competition')}
          />
        </div>
        <div className="field-group">
          <label className="field-label">{t('metadata.season')}</label>
          <input
            className={`field-input ${err(data.season)}`}
            value={data.season}
            onChange={e => set('season', e.target.value)}
            placeholder={t('metadata.placeholders.season')}
          />
        </div>
      </div>

      <div className="divider" />

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">{t('metadata.homeTeam')}</label>
          <input
            className={`field-input ${err(data.home_team)}`}
            value={data.home_team}
            onChange={e => set('home_team', e.target.value)}
            placeholder={t('metadata.placeholders.homeTeam')}
          />
        </div>
        <div className="field-group">
          <label className="field-label">{t('metadata.awayTeam')}</label>
          <input
            className={`field-input ${err(data.away_team)}`}
            value={data.away_team}
            onChange={e => set('away_team', e.target.value)}
            placeholder={t('metadata.placeholders.awayTeam')}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">{t('metadata.attackingTeam')}</label>
          <input
            className={`field-input ${err(data.attacking_team)}`}
            value={data.attacking_team}
            onChange={e => set('attacking_team', e.target.value)}
            placeholder={t('metadata.placeholders.attackingTeam')}
            list="team-suggestions"
          />
        </div>
        <div className="field-group">
          <label className="field-label">{t('metadata.defendingTeam')}</label>
          <input
            className={`field-input ${err(data.defending_team)}`}
            value={data.defending_team}
            onChange={e => set('defending_team', e.target.value)}
            placeholder={t('metadata.placeholders.defendingTeam')}
          />
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">
          {t('metadata.attackingCoach')} <span className="field-optional">{t('metadata.optional')}</span>
        </label>
        <input
          className="field-input"
          value={data.attacking_coach}
          onChange={e => set('attacking_coach', e.target.value)}
          placeholder={t('metadata.placeholders.attackingCoach')}
          list="coach-suggestions"
        />
        <p className="field-hint">{t('metadata.coachHint')}</p>
      </div>

      <datalist id="team-suggestions">
        {suggestions.teams.map(name => <option key={name} value={name} />)}
      </datalist>
      <datalist id="coach-suggestions">
        {suggestions.coaches.map(name => <option key={name} value={name} />)}
      </datalist>
    </div>
  )
}
