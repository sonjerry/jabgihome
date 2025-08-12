import { createContext, useContext, useMemo, useState } from 'react'

type Lang = 'ko' | 'en'
type I18nValue = {
  lang: Lang
  setLang: (v: Lang) => void
  t: (key: string) => string
}

const I18nCtx = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ko')

  const dict = useMemo(() => ({
    ko: { home: '홈', blog: '블로그', gallery: '갤러리', chat: '프로젝트' },
    en: { home: 'Home', blog: 'Blog', gallery: 'Gallery', chat: 'Project' },
  }), [])

  const value = useMemo<I18nValue>(() => ({
    lang,
    setLang,
    t: (k: string) => (dict[lang] as any)?.[k] ?? k,
  }), [lang, dict])

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nCtx)
  if (!ctx) throw new Error('use within provider')
  return ctx
}
