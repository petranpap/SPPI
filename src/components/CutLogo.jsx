import cutLogo from '../assets/cut-logo.png'
import { useI18n } from '../i18n'

// 240×80 source, shown at 120×40 so it stays sharp on high-density screens.
export default function CutLogo({ height = 40 }) {
  const { t } = useI18n()

  return (
    <a
      className="cut-logo"
      href="https://www.cut.ac.cy/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('site.cutLogoLabel')}
    >
      <img src={cutLogo} alt={t('site.cutLogoAlt')} width={height * 3} height={height} />
    </a>
  )
}
