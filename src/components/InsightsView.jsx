import { useEffect, useState } from 'react'
import { api } from '../api'
import { DELIVERY_LABELS, ZONE_LABELS, signalLabel, zonePhrase } from '../labels'
import BarChart from './BarChart'

const MODES = [
  { id: 'team',  label: 'Team' },
  { id: 'coach', label: 'Coach' },
]

const MAX_COMBO_ROWS = 8

function sortedByCount(items) {
  return [...items].sort((a, b) => b.count - a.count)
}

// "Most frequent in your records: Far post — 6 of 10"; names every category on a tie.
function mostFrequentCaption(rows, total) {
  const top = rows[0].count
  if (top === 0) return null
  const leaders = rows.filter(row => row.count === top).map(row => row.label)
  return `Most frequent in your records: ${leaders.join(' and ')} — ${top} of ${total}${leaders.length > 1 ? ' each' : ''}`
}

function frequencyRows(items, labels, total, noun) {
  return sortedByCount(items).map(item => ({
    label:    labels[item.key],
    count:    item.count,
    sentence: `${item.count} of your ${total} recorded corners: ${noun} ${labels[item.key]}`,
  }))
}

export default function InsightsView() {
  const [by,       setBy]       = useState('team')
  const [groups,   setGroups]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [insights, setInsights] = useState(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
    let stale = false
    setGroups(null)
    setSelected(null)
    setInsights(null)
    setError('')
    api.groups(by)
      .then(({ groups }) => {
        if (stale) return
        setGroups(groups)
        setSelected(groups[0]?.name ?? null)
      })
      .catch(err => !stale && setError(err.message))
    return () => { stale = true }
  }, [by])

  useEffect(() => {
    if (!selected) return
    let stale = false
    setInsights(null)
    api.insights(by, selected)
      .then(result => !stale && setInsights(result))
      .catch(err => !stale && setError(err.message))
    return () => { stale = true }
  }, [by, selected])

  return (
    <div className="insights-body">
      <div className="insights-toolbar">
        <span className="field-label insights-toolbar-label">Group by</span>
        <div className="btn-group">
          {MODES.map(mode => (
            <button
              key={mode.id}
              className={`btn-option ${by === mode.id ? 'selected' : ''}`}
              onClick={() => setBy(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <span className="insights-scope">Only corners you annotated are counted.</span>
      </div>

      {error && <p className="insights-message insights-message--error" role="alert">{error}</p>}

      {groups && groups.length === 0 && (
        <p className="insights-message">
          {by === 'team'
            ? 'No annotations yet. Save your first corner in Record and it will appear here.'
            : 'None of your annotations name an attacking coach yet. Add one in the Metadata step to group by coach.'}
        </p>
      )}

      {groups && groups.length > 0 && (
        <div className="insights-layout">
          <ul className="group-list" aria-label={`Your ${by === 'team' ? 'teams' : 'coaches'}`}>
            {groups.map(group => (
              <li key={group.name}>
                <button
                  className={`group-item${selected === group.name ? ' group-item--active' : ''}`}
                  onClick={() => setSelected(group.name)}
                >
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">
                    {group.total} corner{group.total === 1 ? '' : 's'}
                  </span>
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
  const { name, total, threshold, unlocked, remaining } = insights

  if (!unlocked) {
    return (
      <div className="locked-card">
        <p className="locked-title">
          {remaining} more annotation{remaining === 1 ? '' : 's'} needed to unlock insights
        </p>
        <div
          className="locked-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={threshold}
          aria-valuenow={total}
          aria-label={`${total} of ${threshold} annotations`}
        >
          <span style={{ width: `${(total / threshold) * 100}%` }} />
        </div>
        <p className="locked-detail">
          {total} of {threshold} annotated {by === 'team' ? `${name} corners` : `corners by ${name}'s teams`} so far.
        </p>
      </div>
    )
  }

  const subject = by === 'team' ? `${name} corners` : `corners of ${name}'s teams`

  const comboRows = insights.signalToDelivery.slice(0, MAX_COMBO_ROWS).map(combo => {
    const signal = signalLabel(combo.gesture, combo.side)
    const clause = combo.gesture === 'no_signal'
      ? 'there was no signal'
      : `the signal was “${signal.toLowerCase()}”`
    return {
      label:    `${signal} → ${ZONE_LABELS[combo.target_zone]}`,
      count:    combo.count,
      sentence: `In ${combo.count} of your ${total} recorded ${subject}, ${clause} and the delivery ${zonePhrase(combo.target_zone)}.`,
    }
  })
  const hiddenCombos = insights.signalToDelivery.length - comboRows.length
  const zoneRows     = frequencyRows(insights.targetZone,   ZONE_LABELS,     total, 'delivery target was')
  const deliveryRows = frequencyRows(insights.deliveryType, DELIVERY_LABELS, total, 'delivery type was')

  return (
    <>
      <h2 className="insights-heading">Your recorded {subject}</h2>
      <p className="insights-sub">
        {total} corners annotated. These are plain counts of what you recorded — not predictions.
      </p>

      <BarChart
        title="Signal → delivery target"
        caption={comboRows[0].sentence + (hiddenCombos > 0 ? ` (${hiddenCombos} rarer combination${hiddenCombos === 1 ? '' : 's'} not shown)` : '')}
        rows={comboRows}
        total={total}
        countHeader="Signal → target"
      />
      <BarChart
        title="Delivery type"
        caption={mostFrequentCaption(deliveryRows, total)}
        rows={deliveryRows}
        total={total}
        countHeader="Delivery type"
      />
      <BarChart
        title="Delivery target zone"
        caption={mostFrequentCaption(zoneRows, total)}
        rows={zoneRows}
        total={total}
        countHeader="Target zone"
      />
    </>
  )
}
