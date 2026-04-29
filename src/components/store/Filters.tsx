import { Search } from 'lucide-react'
import type { StoreSortOption } from '@/lib/storefront'

const SORT_OPTIONS: Array<{ label: string; value: StoreSortOption }> = [
  { label: 'Mais populares', value: 'popular' },
  { label: 'Menor preco', value: 'price_asc' },
  { label: 'Maior preco', value: 'price_desc' },
]

export function Filters({
  query,
  category,
  sort,
  categories,
  action = '/',
  showCategory = true,
}: {
  query: string
  category: string
  sort: StoreSortOption
  categories: string[]
  action?: string
  showCategory?: boolean
}) {
  return (
    <form
      action={action}
      className={`grid gap-3 rounded-none border border-slate-200 bg-white p-4 ${
        showCategory ? 'md:grid-cols-[minmax(0,1fr)_220px_200px_auto]' : 'md:grid-cols-[minmax(0,1fr)_200px_auto]'
      }`}
    >
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar produtos"
          className="h-11 w-full rounded-none border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      {showCategory ? (
        <select
          name="category"
          defaultValue={category}
          className="h-11 rounded-none border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ) : null}

      <select
        name="sort"
        defaultValue={sort}
        className="h-11 rounded-none border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-none bg-[var(--store-button-bg)] px-4 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90"
      >
        Aplicar
      </button>
    </form>
  )
}
