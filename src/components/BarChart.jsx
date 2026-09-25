import { useState } from 'react'
import { useI18n } from '../i18n'

// Horizontal frequency bars for one categorical breakdown of a single group.
// Bar length is the share of ALL corners in the group (axis runs 0 → total).
// rows: [{ label, count, sentence }]
export default function BarChart({ title, caption, rows, total, countHeader }) {
  const { t } = useI18n()
  const [showTable, setShowTable] = useState(false)
  const percent = count => Math.round((count / total) * 100)

  return (
    <section className="chart-card">
      <header className="chart-head">
        <div>
          <h3 className="chart-title">{title}</h3>
          {caption && <p className="chart-caption">{caption}</p>}
        </div>
        <button className="chart-toggle" onClick={() => setShowTable(v => !v)}>
          {showTable ? t('insights.charts.chart') : t('insights.charts.table')}
        </button>
      </header>

      {showTable ? (
        <table className="chart-table">
          <thead>
            <tr>
              <th scope="col">{countHeader}</th>
              <th scope="col">{t('insights.charts.corners')}</th>
              <th scope="col">{t('insights.charts.share')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.count}</td>
                <td>{percent(row.count)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="bar-list">
          {rows.map(row => (
            <li
              key={row.label}
              className={`bar-row${row.count === 0 ? ' bar-row--empty' : ''}`}
              tabIndex={0}
              title={row.sentence}
              aria-label={row.sentence}
            >
              <span className="bar-label">{row.label}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${(row.count / total) * 100}%` }} />
              </span>
              <span className="bar-value">
                <strong>{row.count}</strong> <span className="bar-percent">{percent(row.count)}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
