import { useEffect, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import { useLabels } from '../i18n/labels'

const PAGE_SIZE = 25

function formatDate(iso, lang) {
  return new Intl.DateTimeFormat(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// Shows every corner the signed-in user has ever saved — independent of the 10-per-group
// Insights threshold — and lets them reopen one for editing. Read-only beyond that: deleting
// isn't offered yet (see Help/FAQ), only create and edit.
export default function HistoryView({ onEdit }) {
  const { t, lang, errorMessage } = useI18n()
  const labels = useLabels()
  const [records,  setRecords]  = useState(null)
  const [error,    setError]    = useState(null)
  const [hasMore,  setHasMore]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = (offset, replace) => {
    api.annotations(PAGE_SIZE, offset)
      .then(({ annotations }) => {
        setRecords(prev => replace ? annotations : [...(prev ?? []), ...annotations])
        setHasMore(annotations.length === PAGE_SIZE)
        setError(null)
      })
      .catch(err => setError(err))
      .finally(() => setLoadingMore(false))
  }

  // Re-fetches from the top whenever History becomes visible, so an edit made just now shows up.
  useEffect(() => { load(0, true) }, [])

  const loadMore = () => {
    setLoadingMore(true)
    load(records.length, false)
  }

  if (error) return <p className="insights-message insights-message--error" role="alert">{errorMessage(error)}</p>
  if (records === null) return null
  if (records.length === 0) return <p className="insights-message">{t('history.empty')}</p>

  return (
    <div className="history-body">
      <p className="history-intro">{t('history.intro')}</p>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th scope="col">{t('history.columns.sppiId')}</th>
              <th scope="col">{t('history.columns.match')}</th>
              <th scope="col">{t('history.columns.attacking')}</th>
              <th scope="col">{t('history.columns.delivery')}</th>
              <th scope="col">{t('history.columns.outcome')}</th>
              <th scope="col">{t('history.columns.saved')}</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {records.map(record => {
              const { metadata, execution, outcome } = record.payload
              return (
                <tr key={record.id}>
                  <td className="history-mono">{record.sppi_id}</td>
                  <td>
                    {metadata.home_team} – {metadata.away_team}
                    {metadata.competition && <span className="history-sub">{metadata.competition}</span>}
                  </td>
                  <td>
                    {record.attacking_team}
                    {record.attacking_coach && <span className="history-sub">{record.attacking_coach}</span>}
                  </td>
                  <td>
                    {labels.delivery(execution.delivery_type)}
                    <span className="history-sub">{labels.zone(execution.target_zone)}</span>
                  </td>
                  <td>{t(`outcome.termination.${outcome.termination_type}`)}</td>
                  <td className="history-date">
                    {formatDate(record.updated_at ?? record.created_at, lang)}
                    {record.updated_at && <span className="history-sub">{t('history.editedOn', { date: formatDate(record.created_at, lang) })}</span>}
                  </td>
                  <td>
                    <button className="cancel-btn" style={{ padding: '6px 14px', fontSize: '11px' }} onClick={() => onEdit(record)}>
                      {t('history.edit')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button className="dashed-btn" onClick={loadMore} disabled={loadingMore} style={{ marginTop: '14px' }}>
          {loadingMore ? t('login.wait') : t('history.loadMore')}
        </button>
      )}
    </div>
  )
}
