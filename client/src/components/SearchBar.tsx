import { useState } from 'react'
import { useI18n } from '../lib/i18n'

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const { t } = useI18n()
  const [q, setQ] = useState('')

  return (
    <div className="flex items-center gap-2 glass rounded-xl p-2 w-full">
      <input
        className="bg-transparent outline-none px-2 md:px-3 py-2 flex-1 text-sm md:text-base"
        placeholder={t('search')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(q)}
      />
      <button
        className="px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 text-sm md:text-base"
        onClick={() => onSearch(q)}
      >
        {t('search')}
      </button>
    </div>
  )
}
