import { LANGUAGES, useI18n } from '../i18n'

const SHORT_NAMES = { en: 'EN', el: 'ΕΛ' }

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label={t('language.label')}>
      {LANGUAGES.map(code => (
        <button
          key={code}
          type="button"
          className={`lang-switch-btn${lang === code ? ' lang-switch-btn--active' : ''}`}
          aria-pressed={lang === code}
          lang={code}
          title={t(`language.${code}`)}
          onClick={() => setLang(code)}
        >
          {SHORT_NAMES[code]}
        </button>
      ))}
    </div>
  )
}
