import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './en'
import el from './el'

export const LANGUAGES = ['en', 'el']

const DICTIONARIES = { en, el }
const STORAGE_KEY = 'sppi_lang'

function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (LANGUAGES.includes(saved)) return saved
  } catch { /* storage unavailable: fall through to the browser language */ }
  return navigator.language?.toLowerCase().startsWith('el') ? 'el' : 'en'
}

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary)
}

function render(value, vars) {
  if (typeof value === 'function') return value(vars)
  if (typeof value === 'string') return value.replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match)
  return value
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback(next => {
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* preference just won't persist */ }
  }, [])

  const value = useMemo(() => {
    // A key missing from the active language falls back to English rather than showing a raw key.
    const t = (key, vars = {}) => {
      const found = lookup(DICTIONARIES[lang], key) ?? lookup(en, key)
      return found === undefined ? key : render(found, vars)
    }
    const has = key => lookup(DICTIONARIES[lang], key) !== undefined

    // Server errors carry a stable `code`; show it in the user's language, else the server's own text.
    const errorMessage = error => {
      if (error?.code && has(`errors.${error.code}`)) return t(`errors.${error.code}`)
      return error?.message || t('errors.generic')
    }

    return { lang, setLang, t, errorMessage }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}
