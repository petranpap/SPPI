import { useEffect, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import { useLabels } from '../i18n/labels'
import BarChart from './BarChart'

const MODES = ['team', 'coach']

const MAX_COMBO_ROWS = 8

function sortedByCount(items) {
  return [...items].sort((a, b) => b.count - a.count)
}

export default function InsightsView() {
  const { t, errorMessage } = useI18n()
  const [by,       setBy]       = useState('team')
  const [groups,   setGroups]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [insights, setInsights] = useState(null)
  const [error,    setError]    = useState(null)

  // Reset in the same update as the click, so no frame renders the previous mode's or group's data.
  const changeMode = mode => {
    setBy(mode)
    setGroups(null)
    setSelected(null)
    setInsights(null)
    setError(null)
  }

  const selectGroup = name => {
    setSelected(name)
    setInsights(null)
  }

  useEffect(() => {
    let stale = false
    api.groups(by)
      .then(({ groups }) => {
        if (stale) return
        setGroups(groups)
        setSelected(groups[0]?.name ?? null)
      })
      .catch(err => !stale && setError(err))
    return () => { stale = true }
  }, [by])

  useEffect(() => {
    if (!selected) return
    let stale = false
    api.insights(by, selected)
      .then(result => !stale && setInsights(result))
      .catch(err => !stale && setError(err))
    return () => { stale = true }
  }, [by, selected])

  return (
    <div className="insights-body">
      <div className="insights-toolbar">
        <span className="field-label insights-toolbar-label">{t('insights.groupBy')}</span>
        <div className="btn-group">
          {MODES.map(mode => (
            <button
              key={mode}
              className={`btn-option ${by === mode ? 'selected' : ''}`}
              onClick={() => changeMode(mode)}
            >
              {t(`insights.modes.${mode}`)}
            </button>
          ))}
        </div>
        <span className="insights-scope">{t('insights.scope')}</span>
      </div>

      {error && <p className="insights-message insights-message--error" role="alert">{errorMessage(error)}</p>}

      {groups && groups.length === 0 && (
        <p className="insights-message">{t(by === 'team' ? 'insights.emptyTeam' : 'insights.emptyCoach')}</p>
      )}

      {groups && groups.length > 0 && (
        <div className="insights-layout">
          <ul className="group-list" aria-label={t(`insights.groupsLabel.${by}`)}>
            {groups.map(group => (
              <li key={group.name}>
                <button
                  className={`group-item${selected === group.name ? ' group-item--active' : ''}`}
                  onClick={() => selectGroup(group.name)}
                >
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">{t('insights.cornerCount', { n: group.total })}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="insights-main">
            {insights && <GroupInsights by={by} insights={insights} />}
          </div>
        </div>
      )}
    </div>
  )
}

function GroupInsights({ by, insights }) {
  const { t } = useI18n()
  const labels = useLabels()
  const { name, total, threshold, unlocked, remaining } = insights

  if (!unlocked) {
    return (
      <div className="locked-card">
        <p className="locked-title">{t('insights.lockedTitle', { n: remaining })}</p>
        <div
          className="locked-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={threshold}
          aria-valuenow={total}
          aria-label={t('insights.progressLabel', { total, threshold })}
        >
          <span style={{ width: `${(total / threshold) * 100}%` }} />
        </div>
        <p className="locked-detail">{t(`insights.lockedDetail.${by}`, { total, threshold, name })}</p>
      </div>
    )
  }

  const subject = t(`insights.comboSentence.subject.${by}`, { name })

  const comboRows = insights.signalToDelivery.slice(0, MAX_COMBO_ROWS).map(combo => {
    const signal = labels.signal(combo.gesture, combo.side)
    const clause = combo.gesture === 'no_signal'
      ? t('insights.comboSentence.clauseNone')
      : t('insights.comboSentence.clauseSignal', { signal: signal.toLowerCase() })
    return {
      label:    `${signal} → ${labels.zone(combo.target_zone)}`,
      count:    combo.count,
      sentence: t('insights.comboSentence.sentence', {
        count: combo.count, total, subject, clause, phrase: labels.zonePhrase(combo.target_zone),
      }),
    }
  })
  const hiddenCombos = insights.signalToDelivery.length - comboRows.length

  const frequencyRows = (items, label, sentenceKey) => sortedByCount(items).map(item => ({
    label:    label(item.key),
    count:    item.count,
    sentence: t(sentenceKey, { count: item.count, total, label: label(item.key) }),
  }))
  const zoneRows     = frequencyRows(insights.targetZone,   labels.zone,     'insights.rowSentence.zone')
  const deliveryRows = frequencyRows(insights.deliveryType, labels.delivery, 'insights.rowSentence.delivery')

  // "Most frequent in your records: Far post — 6 of 10"; names every category on a tie.
  const mostFrequent = rows => {
    const top = rows[0].count
    if (top === 0) return null
    const leaders = rows.filter(row => row.count === top).map(row => row.label)
    return t('insights.mostFrequent', { leaders: leaders.join(t('insights.and')), top, total, tie: leaders.length > 1 })
  }

  return (
    <>
      <h2 className="insights-heading">{t(`insights.heading.${by}`, { name })}</h2>
      <p className="insights-sub">{t('insights.sub', { total })}</p>

      <BarChart
        title={t('insights.charts.signalTitle')}
        caption={comboRows[0].sentence + (hiddenCombos > 0 ? t('insights.hiddenCombos', { n: hiddenCombos }) : '')}
        rows={comboRows}
        total={total}
        countHeader={t('insights.charts.signalColumn')}
      />
      <BarChart
        title={t('insights.charts.deliveryTitle')}
        caption={mostFrequent(deliveryRows)}
        rows={deliveryRows}
        total={total}
        countHeader={t('insights.charts.deliveryColumn')}
      />
      <BarChart
        title={t('insights.charts.zoneTitle')}
        caption={mostFrequent(zoneRows)}
        rows={zoneRows}
        total={total}
        countHeader={t('insights.charts.zoneColumn')}
      />
    </>
  )
}
