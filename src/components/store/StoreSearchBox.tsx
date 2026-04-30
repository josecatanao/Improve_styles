'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Clock3, LoaderCircle, Search, Tag } from 'lucide-react'
import type { StoreSearchSuggestion } from '@/lib/products'

const RECENT_SEARCHES_KEY = 'improve-style-recent-searches'
const MAX_RECENT_SEARCHES = 6

function readRecentSearches() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    const parsed = stored ? (JSON.parse(stored) as string[]) : []
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item.trim().length > 0) : []
  } catch {
    return []
  }
}

function writeRecentSearches(items: string[]) {
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, MAX_RECENT_SEARCHES)))
}

function getSuggestionTypeLabel(type: StoreSearchSuggestion['type']) {
  if (type === 'product') return 'Produto'
  if (type === 'category') return 'Categoria'
  return 'Marca'
}

export function StoreSearchBox({
  query = '',
  suggestions,
  mobile = false,
}: {
  query?: string
  suggestions: StoreSearchSuggestion[]
  mobile?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const blurTimeoutRef = useRef<number | null>(null)
  const [value, setValue] = useState(query)
  const [debouncedTerm, setDebouncedTerm] = useState(query)
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(value), 300)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = debouncedTerm
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (!normalizedQuery) {
      return suggestions.slice(0, 8)
    }

    return suggestions
      .map((item) => {
        const haystack = [item.label, item.meta]
          .filter((entry): entry is string => Boolean(entry))
          .join(' ')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()

        let score = 0

        if (haystack.startsWith(normalizedQuery)) {
          score += 10
        }

        if (haystack.includes(normalizedQuery)) {
          score += 6
        }

        normalizedQuery.split(/\s+/).filter(Boolean).forEach((token) => {
          if (haystack.includes(token)) {
            score += 3
          }
        })

        if (item.type === 'product') {
          score += 2
        }

        return { item, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
      .map(({ item }) => item)
      .slice(0, 8)
  }, [suggestions, debouncedTerm])

  const showRecent = value.trim().length === 0 && recentSearches.length > 0

  function persistRecentSearch(nextValue: string) {
    const normalized = nextValue.trim()

    if (!normalized) {
      return
    }

    const nextRecent = [normalized, ...recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES
    )

    setRecentSearches(nextRecent)
    writeRecentSearches(nextRecent)
  }

  function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const normalized = value.trim()

    if (!normalized) {
      return
    }

    persistRecentSearch(normalized)
    setIsOpen(false)
    startTransition(() => {
      const target = `/?q=${encodeURIComponent(normalized)}`
      if (pathname === '/') {
        router.replace(target, { scroll: false })
        return
      }
      router.push(target)
    })
  }

  function handleRecentClick(item: string) {
    setValue(item)
    persistRecentSearch(item)
    setIsOpen(false)
    startTransition(() => {
      const target = `/?q=${encodeURIComponent(item)}`
      if (pathname === '/') {
        router.replace(target, { scroll: false })
        return
      }
      router.push(target)
    })
  }

  const wrapperClass = mobile
    ? 'relative'
    : 'relative hidden min-w-0 lg:block lg:flex-1'
  const controlClass = mobile
    ? 'flex h-11 overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm'
    : 'flex h-13 overflow-hidden rounded-none border border-[color:var(--store-header-border)] bg-white shadow-sm'

  return (
    <div className={wrapperClass}>
      <form action="/" onSubmit={handleSubmit}>
        <div className={controlClass}>
          <input
            type="search"
            name="q"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => {
              if (blurTimeoutRef.current) {
                window.clearTimeout(blurTimeoutRef.current)
              }
              setIsOpen(true)
            }}
            onBlur={() => {
              blurTimeoutRef.current = window.setTimeout(() => setIsOpen(false), 120)
            }}
            placeholder="Buscar produtos, categorias, marcas..."
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            className={mobile ? 'h-full flex-1 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400' : 'h-full flex-1 px-5 text-sm text-slate-900 outline-none placeholder:text-slate-400'}
          />
          <button
            type="submit"
            disabled={isPending}
            className={mobile ? 'inline-flex w-12 items-center justify-center bg-[var(--store-button-bg)] text-[var(--store-button-fg)]' : 'inline-flex w-16 items-center justify-center bg-[var(--store-button-bg)] text-[var(--store-button-fg)] transition-colors hover:opacity-90'}
            aria-label="Buscar produtos"
          >
            {isPending ? (
              <LoaderCircle className={`${mobile ? 'h-4 w-4' : 'h-5 w-5'} animate-spin`} />
            ) : (
              <Search className={mobile ? 'h-4 w-4' : 'h-5 w-5'} />
            )}
          </button>
        </div>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-40 border border-slate-200 bg-white shadow-[0_20px_45px_-30px_rgba(15,23,42,0.28)]">
          {showRecent ? (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Pesquisas recentes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleRecentClick(item)}
                    className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="px-2 py-2" role="listbox">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  role="option"
                  onMouseDown={() => {
                    if (value.trim()) {
                      persistRecentSearch(value)
                    } else {
                      persistRecentSearch(item.label)
                    }
                  }}
                  className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-slate-50"
                >
                  {item.imageUrl ? (
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 overflow-hidden border border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover" />
                    </span>
                  ) : (
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center bg-slate-100 text-slate-500">
                      <Tag className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{item.label}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {[getSuggestionTypeLabel(item.type), item.meta].filter(Boolean).join(' • ')}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-slate-500">Nenhum resultado encontrado.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
