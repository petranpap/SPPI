import { useEffect } from 'react'
import { useI18n } from './i18n'

export function usePageTitle(title) {
  const { t } = useI18n()
  const siteName = t('site.fullName')

  useEffect(() => {
    document.title = title ? `${title} · ${siteName}` : siteName
  }, [title, siteName])
}
