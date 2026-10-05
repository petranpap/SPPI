import { useState } from 'react'
import { useI18n } from '../i18n'

export default function MetadataSection({ data, onChange, validated, suggestions = { teams: [], coaches: [] }, recentMatches = [], onPickMatch, onNewMatch }) {
  const { t } = useI18n()
  const set = (field, value) => onChange({ ...data, [field]: value })
  const err = (val) => validated && !String(val).trim() ? 'is-error' : ''

  // Continuing the same match is now signalled by the SPPI ID being pre-filled (auto-
  // suggested) rather than blank — see nextSppiId in App.jsx — so check home/away instead.
  const continuingMatch = (data.home_team.trim() || data.away_team.trim()) && !data.attacking_team.trim()
  // A genuinely blank form — not continuing a match, not mid-edit — is the only time
  // offering "pick a past match" makes sense; once any match field is filled, it would
  // just be clutter on top of a decision the annotator has already made.
  const showRecentMatches = !continuingMatch && !data.match_id.trim() && !data.home_team.trim() && !data.away_team.trim() && recentMatches.length > 0

  const home = data.home_team.trim()
  const away = data.away_team.trim()
  const canPickSide = home && away
  // Tap-to-pick only covers "attacking team is literally the home or away team". Older
  // records, or a name typed in before Home/Away were filled, can land outside that —
  // the manual fields stay reachable instead of silently hiding a value that doesn't fit.
  const attackingMatchesKnownTeam = !data.attacking_team.trim() || data.attacking_team === home || data.attacking_team === away
  // Only the explicit "type/pick instead" toggle is remembered as a choice; whether tap
  // mode is even available is re-derived from the current Home/Away every render, so filling
  // them in mid-session switches the view over immediately instead of waiting for a remount.
  const [forcedManual, setForcedManual] = useState(false)
  const manualEntry = forcedManual || !canPickSide || !attackingMatchesKnownTeam

  const pickAttacking = team => {
    const other = team === home ? away : home
    onChange({ ...data, attacking_team: team, defending_team: other })
  }

  return (
    <div>
      <p className="section-title">{t('metadata.title')}</p>

      {continuingMatch && (
        <div className="continuing-match">
          <p>{t('metadata.continuingMatch', { home: data.home_team || '—', away: data.away_team || '—' })}</p>
          <button type="button" className="link-btn" onClick={onNewMatch}>{t('metadata.newMatch')}</button>
        </div>
      )}

      {showRecentMatches && (
        <div className="field-group recent-matches">
          <label className="field-label">{t('metadata.recentMatches')}</label>
          <div className="recent-match-list">
            {recentMatches.map((match, i) => (
              <button
                type="button"
                key={match.matchId ?? `${match.homeTeam}-${match.awayTeam}-${i}`}
                className="recent-match-card"
                onClick={() => onPickMatch(match)}
              >
                <span className="recent-match-teams">{match.homeTeam} – {match.awayTeam}</span>
                <span className="recent-match-sub">
                  {[match.competition, match.season].filter(Boolean).join(' · ')}
                  {match.competition || match.season ? ' · ' : ''}
                  {t('metadata.recentMatchCount', { n: match.count })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">
            {t('metadata.sppiId')} <span className="field-optional">{t('metadata.optional')}</span>
          </label>
          <input
            className="field-input"
            value={data.sppi_id}
            onChange={e => set('sppi_id', e.target.value)}
            placeholder={t('metadata.placeholders.sppiId')}
          />
        </div>
        <div className="field-group">
          <label className="field-label">
            {t('metadata.matchId')} <span className="field-optional">{t('metadata.optional')}</span>
          </label>
          <input
            className="field-input"
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

      {canPickSide && !manualEntry ? (
        <div className="field-group">
          <label className="field-label">{t('metadata.whichAttacks')}</label>
          <div className="btn-group">
            <button
              type="button"
              className={`btn-option ${data.attacking_team === home ? 'selected' : ''} ${validated && !data.attacking_team.trim() ? 'is-error' : ''}`}
              onClick={() => pickAttacking(home)}
            >
              {home}
            </button>
            <button
              type="button"
              className={`btn-option ${data.attacking_team === away ? 'selected' : ''} ${validated && !data.attacking_team.trim() ? 'is-error' : ''}`}
              onClick={() => pickAttacking(away)}
            >
              {away}
            </button>
          </div>
          {data.attacking_team.trim() && (
            <p className="field-hint">{t('metadata.defendingIs', { team: data.defending_team })}</p>
          )}
          <button type="button" className="link-btn" style={{ marginTop: '8px', fontSize: '11px' }} onClick={() => setForcedManual(true)}>
            {t('metadata.typeInstead')}
          </button>
        </div>
      ) : (
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
          {canPickSide && (
            <button type="button" className="link-btn" style={{ fontSize: '11px' }} onClick={() => setForcedManual(false)}>
              {t('metadata.pickInstead', { home, away })}
            </button>
          )}
        </div>
      )}

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
