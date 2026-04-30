'use client'

import Link from 'next/link'
import { Headphones, Heart, Menu, UserRound } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { CartSheet } from '@/components/store/CartSheet'
import { StoreSearchBox } from '@/components/store/StoreSearchBox'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import type { StoreCustomerSession } from '@/lib/customer-session'
import type { StoreSearchSuggestion } from '@/lib/products'

type HeaderCategory = {
  label: string
  href: string
}

const primaryLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Promocoes', href: '/?sort=price_asc' },
  { label: 'Novidades', href: '/?sort=recent' },
  { label: 'Mais vendidos', href: '/#mais-vendidos' },
]

const customerAccountHref = '/conta'
const supportHref = '#atendimento'

export function Header({
  categories,
  query = '',
  customerSession,
  branding,
  searchSuggestions,
}: {
  categories: HeaderCategory[]
  query?: string
  customerSession: StoreCustomerSession
  searchSuggestions: StoreSearchSuggestion[]
  branding?: {
    logoUrl?: string | null
    storeName?: string | null
  }
}) {
  const customerName = customerSession?.profile?.full_name?.trim() || customerSession?.email || 'Minha conta'
  const customerPhotoUrl = customerSession?.profile?.photo_url?.trim() || null
  const isAuthenticated = Boolean(customerSession)
  const storeName = branding?.storeName?.trim() || 'Improve Styles'

  return (
    <header className="border-b border-[color:var(--store-header-border)] bg-[var(--store-header-bg)] text-[var(--store-header-fg)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-3 sm:px-6 lg:gap-4 lg:px-8 lg:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sheet>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Abrir menu da loja"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto bg-[var(--store-header-bg,#ffffff)] p-0 text-[var(--store-header-fg,#0f172a)]">
              <div className="border-b border-[color:var(--store-header-border)] px-5 py-4">
                <Link href="/" className="flex items-center gap-2.5">
                  {branding?.logoUrl ? (
                    <span className="flex h-9 shrink-0 items-center justify-start overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={branding.logoUrl} alt="Logo da loja" className="block h-full w-auto max-w-[40px] object-contain object-left" />
                    </span>
                  ) : null}
                  <span className="text-base font-bold tracking-tight text-[var(--store-header-fg)] sm:text-lg">
                    {storeName}
                  </span>
                </Link>
              </div>
              <nav className="flex flex-col gap-1 px-4 py-4">
                {primaryLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-none px-3 py-3 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:bg-black/5"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={supportHref}
                  className="rounded-none px-3 py-3 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:bg-black/5"
                >
                  Atendimento
                </Link>
                {isAuthenticated ? (
                  <div className="rounded-none px-3 py-3">
                    <Link href={customerAccountHref} className="flex items-center gap-3 rounded-none transition-colors hover:bg-black/5">
                      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-none bg-slate-100">
                        {customerPhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={customerPhotoUrl} alt={customerName} className="h-full w-full object-cover" />
                        ) : (
                          <UserRound className="h-5 w-5 text-slate-500" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--store-header-fg)]">{customerName}</p>
                        <p className="text-xs text-[var(--store-header-muted)]">Conta da loja</p>
                      </div>
                    </Link>
                    <form action={logout} className="mt-3">
                      <input type="hidden" name="mode" value="customer" />
                      <input type="hidden" name="next" value="/" />
                      <button
                        type="submit"
                        className="w-full rounded-none border border-[color:var(--store-header-border)] px-3 py-2 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:bg-black/5"
                      >
                        Sair
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href={customerAccountHref}
                    className="rounded-none px-3 py-3 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:bg-black/5"
                  >
                    Minha conta
                  </Link>
                )}
              </nav>
              <div className="border-t border-[color:var(--store-header-border)] px-4 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--store-header-muted)]">Categorias</p>
                <div className="flex flex-col gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      className="rounded-none px-3 py-3 text-sm text-[var(--store-header-fg)] transition-colors hover:bg-black/5"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex min-w-0 flex-1 shrink items-center gap-2.5 lg:flex-none">
            {branding?.logoUrl ? (
              <span className="flex h-9 shrink-0 items-center justify-start overflow-hidden sm:h-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logoUrl} alt="Logo da loja" className="block h-full w-auto max-w-[40px] object-contain object-left sm:max-w-[44px]" />
              </span>
            ) : null}
            <span className="truncate text-[0.95rem] font-bold tracking-tight text-[var(--store-header-fg)] sm:text-lg">
              {storeName}
            </span>
          </Link>

          <StoreSearchBox key={`desktop:${query}`} query={query} suggestions={searchSuggestions} />

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href="/conta/favoritos"
              className="hidden h-11 items-center gap-2 rounded-none border border-transparent px-3 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:bg-black/5 md:inline-flex"
            >
              <Heart className="h-4 w-4" />
              Favoritos
            </Link>

            <CartSheet />
          </div>
        </div>

        <div className="lg:hidden">
          <StoreSearchBox key={`mobile:${query}`} query={query} suggestions={searchSuggestions} mobile />
        </div>
      </div>

      <div className="border-t border-[color:var(--store-header-border)] bg-[var(--store-header-bg)]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:gap-4 lg:px-8 lg:py-3">
          <div className="inline-flex shrink-0 items-center gap-2 rounded-none border border-[color:var(--store-header-border)] bg-black/5 px-3 py-2 text-xs font-medium text-[var(--store-header-fg)] sm:text-sm lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
            <Menu className="h-4 w-4" />
            Todas as categorias
          </div>

          <div className="hidden h-5 w-px bg-[var(--store-header-border)] lg:block" />

          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="shrink-0 rounded-none border border-[color:var(--store-header-border)] px-3 py-2 text-xs font-medium text-[var(--store-header-fg)] transition-colors hover:opacity-80 sm:text-sm lg:border-0 lg:px-3 lg:py-0"
            >
              {category.label}
            </Link>
          ))}

          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-none border border-[color:var(--store-header-border)] px-3 py-2 text-xs font-medium text-[var(--store-header-fg)] transition-colors hover:opacity-80 sm:text-sm lg:border-0 lg:px-3 lg:py-0"
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              href={supportHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-none border border-[color:var(--store-header-border)] px-3 py-2 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:opacity-80"
            >
              <Headphones className="h-4 w-4" />
              Atendimento
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href={customerAccountHref}
                  className="inline-flex max-w-[220px] shrink-0 items-center gap-2 rounded-none border border-[color:var(--store-header-border)] px-2 py-1.5 text-sm text-[var(--store-header-fg)] transition-colors hover:bg-black/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-none bg-slate-100">
                    {customerPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={customerPhotoUrl} alt={customerName} className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-4 w-4 text-slate-500" />
                    )}
                  </span>
                  <span className="truncate font-medium">{customerName}</span>
                </Link>
                <form action={logout}>
                  <input type="hidden" name="mode" value="customer" />
                  <input type="hidden" name="next" value="/" />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center rounded-none border border-[color:var(--store-header-border)] px-3 py-2 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:opacity-80"
                  >
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <Link
                href={customerAccountHref}
                className="inline-flex shrink-0 items-center gap-2 rounded-none border border-[color:var(--store-header-border)] px-3 py-2 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:opacity-80"
              >
                <UserRound className="h-4 w-4" />
                Minha conta
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
