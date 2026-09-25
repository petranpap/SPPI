import ZoneSelector from './ZoneSelector'
import { useI18n } from '../i18n'

const TERMINATION_TYPES = ['goal', 'out_of_play', 'cleared']
const ACTION_TYPES = ['header', 'shot', 'pass', 'clearance', 'block', 'touch']

export default function OutcomeSection({ data, onChange, onSave }) {
  const { t } = useI18n()
  const set = (field, value) => onChange({ ...data, [field]: value })
  const setFinalPlayer = (field, value) =>
    onChange({ ...data, final_player: { ...data.final_player, [field]: value } })

  return (
    <div>
      <p className="section-title">{t('outcome.title')}</p>

      {/* Termination type */}
      <div className="field-group">
        <label className="field-label">{t('outcome.terminationType')}</label>
        <div className="btn-group">
          {TERMINATION_TYPES.map(type => (
            <button
              key={type}
              className={`btn-option ${data.termination_type === type ? 'selected' : ''}`}
              onClick={() => set('termination_type', type)}
            >
              {t(`outcome.termination.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Termination zone */}
      <ZoneSelector
        label={t('outcome.terminationZone')}
        value={data.termination_zone}
        onChange={v => set('termination_zone', v)}
      />

      {/* Final action */}
      <div className="field-group">
        <label className="field-label">{t('outcome.finalAction')}</label>
        <div className="btn-group">
          {ACTION_TYPES.map(action => (
            <button
              key={action}
              className={`btn-option ${data.final_action === action ? 'selected' : ''}`}
              onClick={() => set('final_action', action)}
            >
              {t(`action.${action}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Final player */}
      <label className="field-label" style={{ marginBottom: '10px', display: 'block' }}>
        {t('outcome.finalPlayer')}
      </label>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">{t('outcome.jersey')}</label>
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
          <label className="field-label">{t('outcome.team')}</label>
          <div className="btn-group" style={{ flexDirection: 'column', gap: '5px' }}>
            {['attacking', 'defending'].map(team => (
              <button
                key={team}
                className={`btn-option ${data.final_player.team === team ? 'selected' : ''}`}
                onClick={() => setFinalPlayer('team', team)}
                style={{ fontSize: '11px' }}
              >
                {t(`team.${team}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Spawned instance */}
      <div className="toggle-row">
        <span className="toggle-label">{t('outcome.spawned')}</span>
        <button
          className={`toggle-btn ${data.hasSpawned ? 'on' : ''}`}
          onClick={() => set('hasSpawned', !data.hasSpawned)}
        />
      </div>
      {data.hasSpawned && (
        <div className="field-group">
          <label className="field-label">{t('outcome.spawnedId')}</label>
          <input
            className="field-input"
            value={data.spawned_instance}
            onChange={e => set('spawned_instance', e.target.value)}
            placeholder={t('outcome.spawnedPlaceholder')}
          />
        </div>
      )}
      {!data.hasSpawned && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '-4px' }}>
          {t('outcome.spawnedHint')}
        </p>
      )}

      {/* Parent instance */}
      <div className="toggle-row">
        <span className="toggle-label">{t('outcome.parent')}</span>
        <button
          className={`toggle-btn ${data.hasParent ? 'on' : ''}`}
          onClick={() => set('hasParent', !data.hasParent)}
        />
      </div>
      {data.hasParent && (
        <div className="field-group">
          <label className="field-label">{t('outcome.parentId')}</label>
          <input
            className="field-input"
            value={data.parent_instance}
            onChange={e => set('parent_instance', e.target.value)}
            placeholder={t('outcome.parentPlaceholder')}
          />
        </div>
      )}
      {!data.hasParent && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px' }}>
          {t('outcome.parentHint')}
        </p>
      )}

      <div className="divider" />

      <button className="confirm-btn" onClick={onSave}>
        {t('outcome.save')}
      </button>
    </div>
  )
}
