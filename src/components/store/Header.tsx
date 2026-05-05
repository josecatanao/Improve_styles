'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, Headphones, Heart, LogOut, Menu, UserRound, X } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { cn } from '@/lib/utils'
import { StoreBrandMark } from '@/components/store/StoreBrandMark'
import { CartSheet } from '@/components/store/CartSheet'
import { StoreSearchBox } from '@/components/store/StoreSearchBox'
import type { StoreCustomerSession } from '@/lib/customer-session'
import type { StoreSearchSuggestion } from '@/lib/products'
import type { HeaderNavigation, HeaderNavItemId } from '@/lib/store-settings'

type HeaderCategory = {
  label: string
  href: string
}

type ComputedNavItem =
  | { type: 'link'; label: string; href: string; id: HeaderNavItemId }
  | { type: 'category'; label: string; href: string }

const NAV_ITEM_REGISTRY: Record<string, { label: string; href: string }> = {
  home: { label: 'Início', href: '/' },
  promocoes: { label: '🔥 Promoções', href: '/?sort=price_asc' },
  novidades: { label: 'Novidades', href: '/?sort=recent' },
  mais_vendidos: { label: 'Mais vendidos', href: '/?sort=popular' },
}

function buildNavItems(
  config: HeaderNavigation,
  categories: HeaderCategory[],
): ComputedNavItem[] {
  const items: ComputedNavItem[] = []

  for (const entry of config) {
    if (!entry.enabled) continue

    if (entry.id === 'categories') {
      for (const cat of categories) {
        items.push({ type: 'category', label: cat.label, href: cat.href })
      }
    } else {
      const def = NAV_ITEM_REGISTRY[entry.id]
      if (def) {
        items.push({ type: 'link', label: def.label, href: def.href, id: entry.id })
      }
    }
  }

  return items
}

const customerAccountHref = '/conta'

function NavLink({ href, label, className }: { href: string; label: string; className?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort')

  const [basePath, queryString] = href.split('?')
  const linkParams = new URLSearchParams(queryString || '')
  const linkSort = linkParams.get('sort')

  const isActive = pathname === basePath && (linkSort ? currentSort === linkSort : !queryString)

  return (
    <Link
      href={href}
      className={cn(
        'relative shrink-0 rounded-none text-sm font-medium transition-colors hover:opacity-90',
        isActive && 'after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-4/5 after:-translate-x-1/2 after:bg-current after:transition-all',
        className,
      )}
    >
      {label}
    </Link>
  )
}

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}

function StoreDrawer({
  open,
  onClose,
  side,
  children,
}: {
  open: boolean
  onClose: () => void
  side: 'left' | 'right'
  children: React.ReactNode
}) {
  useLockBodyScroll(open)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-slate-950/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 flex h-full flex-col bg-[var(--store-header-bg,#ffffff)] text-[var(--store-header-fg,#0f172a)] shadow-xl',
          side === 'left' ? 'mr-auto animate-in slide-in-from-left' : 'ml-auto animate-in slide-in-from-right',
          'w-[88vw] max-w-sm',
        )}
      >
        <div className="flex justify-end p-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function MobileSheetContent({
  branding,
  storeName,
  navItems,
  supportHref,
  isAuthenticated,
  customerName,
  customerPhotoUrl,
}: {
  branding?: { logoUrl?: string | null; storeName?: string | null }
  storeName: string
  navItems: ComputedNavItem[]
  supportHref: string | null
  isAuthenticated: boolean
  customerName: string
  customerPhotoUrl: string | null
}) {
  return (
    <>
      <div className="border-b border-[color:var(--store-header-border)] px-5 py-4">
        <StoreBrandMark logoUrl={branding?.logoUrl} storeName={storeName} compact />
      </div>
      <nav className="flex flex-col gap-1 px-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.type === 'link' ? item.id : `category:${item.href}`}
            href={item.href}
            className="rounded-none px-3 py-3 text-sm font-medium transition-colors hover:opacity-90"
          >
            {item.label}
          </Link>
        ))}
        {supportHref ? (
          <Link
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-none px-3 py-3 text-sm font-medium transition-colors hover:opacity-90"
          >
            Atendimento
          </Link>
        ) : null}
        {isAuthenticated ? (
          <div className="px-3 py-3">
            <Link href={customerAccountHref} className="flex items-center gap-3 transition-colors hover:opacity-90">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {customerPhotoUrl ? (
                  <Image src={customerPhotoUrl} alt={customerName} width={44} height={44} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-5 w-5 text-slate-500" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{customerName}</p>
                <p className="text-xs text-[var(--store-header-muted)]">Conta da loja</p>
              </div>
            </Link>
            <form action={logout} className="mt-3">
              <input type="hidden" name="mode" value="customer" />
              <input type="hidden" name="next" value="/" />
              <button
                type="submit"
                  className="w-full rounded-md border border-[color:var(--store-header-border)] px-3 py-2 text-sm font-medium transition-colors hover:opacity-90"
                >
                  <LogOut className="mr-2 inline h-4 w-4" />
                  Sair da conta
              </button>
            </form>
          </div>
        ) : (
          <Link
            href={customerAccountHref}
            className="rounded-none px-3 py-3 text-sm font-medium transition-colors hover:opacity-90"
          >
            Minha conta
          </Link>
        )}
      </nav>
    </>
  )
}

export function Header({
  categories,
  query = '',
  customerSession,
  branding,
  searchSuggestions,
  headerNavigation,
  storeWhatsapp,
}: {
  categories: HeaderCategory[]
  query?: string
  customerSession: StoreCustomerSession
  searchSuggestions: StoreSearchSuggestion[]
  branding?: {
    logoUrl?: string | null
    storeName?: string | null
  }
  headerNavigation: HeaderNavigation
  storeWhatsapp?: string | null
}) {
  const customerName = customerSession?.profile?.full_name?.trim() || 'Minha conta'
  const customerPhotoUrl = customerSession?.profile?.photo_url?.trim() || null
  const isAuthenticated = Boolean(customerSession)
  const storeName = branding?.storeName?.trim() || 'Improve Styles'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  const rawWhatsapp = storeWhatsapp?.replace(/\D/g, '') ?? ''
  const supportHref = rawWhatsapp ? `https://wa.me/${rawWhatsapp}` : null

  const closeMenu = useCallback(() => setIsMenuOpen(false), [])
  const closeCategories = useCallback(() => setIsCategoriesOpen(false), [])

  const navItems = buildNavItems(headerNavigation, categories)

  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const SCROLL_HIDE_THRESHOLD = 80
  const SCROLL_SHOW_THRESHOLD = 5

  useEffect(() => {
    let ticking = false

    function handleScroll() {
      if (ticking) return
      ticking = true

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const delta = currentScrollY - lastScrollY.current

        if (currentScrollY <= 0) {
          setIsHeaderVisible(true)
        } else if (delta > SCROLL_SHOW_THRESHOLD && currentScrollY > SCROLL_HIDE_THRESHOLD) {
          setIsHeaderVisible(false)
        } else if (delta < -SCROLL_SHOW_THRESHOLD) {
          setIsHeaderVisible(true)
        }

        lastScrollY.current = currentScrollY
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <StoreDrawer open={isMenuOpen} onClose={closeMenu} side="left">
        <MobileSheetContent
          branding={branding}
          storeName={storeName}
          navItems={navItems}
          supportHref={supportHref}
          isAuthenticated={isAuthenticated}
          customerName={customerName}
          customerPhotoUrl={customerPhotoUrl}
        />
      </StoreDrawer>

      <StoreDrawer open={isCategoriesOpen} onClose={closeCategories} side="left">
        <div className="px-4 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--store-header-muted)]">Categorias</p>
          <div className="flex flex-col gap-1">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                onClick={closeCategories}
                className="rounded-none px-3 py-3 text-sm transition-colors hover:opacity-90"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </div>
      </StoreDrawer>

      <header
        className={cn(
          'sticky top-0 z-50 border-b border-[color:var(--store-header-border)] bg-[var(--store-header-bg)] text-[var(--store-header-fg)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out',
          !isHeaderVisible && '-translate-y-full'
        )}
      >

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:gap-4 lg:px-8 lg:py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu da loja"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-none border border-[color:var(--store-header-border)] bg-[var(--store-header-bg)] text-[var(--store-header-fg)] transition-colors hover:opacity-90 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <StoreBrandMark
              logoUrl={branding?.logoUrl}
              storeName={storeName}
              compact
              className="min-w-0 shrink lg:flex-none"
            />

            <div className="hidden h-10 w-px bg-[var(--store-header-border)] lg:block" />

            <div className="hidden min-w-0 flex-1 lg:block">
              <StoreSearchBox query={query} suggestions={searchSuggestions} />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
              <Link
                href="/conta/favoritos"
                className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-none transition-colors hover:opacity-90"
                aria-label="Favoritos"
              >
                <Heart className="h-5 w-5" />
              </Link>

              <CartSheet compact />
            </div>
          </div>

          <div className="lg:hidden">
            <StoreSearchBox query={query} suggestions={searchSuggestions} mobile />
          </div>
        </div>

        <div className="border-t border-[color:var(--store-header-border)] bg-[var(--store-header-bg)]">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:gap-3 lg:px-8 lg:py-2.5">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen(true)}
              className="inline-flex min-h-11 shrink-0 touch-manipulation items-center gap-1.5 rounded-none px-3 py-2 text-sm font-semibold transition-colors hover:opacity-90"
            >
              <Menu className="h-4 w-4" />
              Todas as categorias
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <div className="hidden h-5 w-px bg-[var(--store-header-border)] lg:block" />

            {navItems.map((item) => (
              <NavLink
                key={item.type === 'link' ? item.id : `category:${item.href}`}
                href={item.href}
                label={item.label}
                className="border border-[color:var(--store-header-border)] px-3 py-1.5 text-xs sm:text-sm lg:border-0 lg:px-3 lg:py-1"
              />
            ))}

            <div className="ml-auto hidden items-center gap-2 lg:flex">
              {supportHref ? (
                <Link
                  href={supportHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-none px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90"
                >
                  <Headphones className="h-4 w-4" />
                  Atendimento
                </Link>
              ) : null}

              {isAuthenticated ? (
                <>
                  <div className="h-5 w-px bg-[var(--store-header-border)]" />
                  <Link
                    href={customerAccountHref}
                    className="inline-flex max-w-[180px] shrink-0 items-center gap-2 rounded-none px-3 py-1 text-sm transition-colors hover:opacity-90"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      {customerPhotoUrl ? (
                        <Image src={customerPhotoUrl} alt={customerName} width={28} height={28} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-4 w-4" />
                      )}
                    </span>
                    <span className="truncate">{customerName}</span>
                  </Link>
                  <form action={logout} className="flex items-center">
                    <input type="hidden" name="mode" value="customer" />
                    <input type="hidden" name="next" value="/" />
                    <button
                      type="submit"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-70"
                      aria-label="Sair da conta"
                      title="Sair da conta"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href={customerAccountHref}
                  className="inline-flex shrink-0 items-center gap-2 rounded-none px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90"
                >
                  <UserRound className="h-4 w-4" />
                  Minha conta
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
