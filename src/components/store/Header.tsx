'use client'

import Link from 'next/link'
import { Headphones, Heart, Menu, Search, UserRound } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { CartSheet } from '@/components/store/CartSheet'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import type { StoreCustomerSession } from '@/lib/customer-session'

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
}: {
  categories: HeaderCategory[]
  query?: string
  customerSession: StoreCustomerSession
  branding?: {
    logoUrl?: string | null
  }
}) {
  const customerName = customerSession?.profile?.full_name?.trim() || customerSession?.email || 'Minha conta'
  const customerPhotoUrl = customerSession?.profile?.photo_url?.trim() || null
  const isAuthenticated = Boolean(customerSession)

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:gap-4 lg:px-8 lg:py-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Sheet>
            <SheetTrigger
              render={
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden" />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto bg-white p-0">
              <div className="border-b border-slate-200 px-5 py-4">
                <Link href="/" className="flex items-center gap-2">
                  {branding?.logoUrl ? (
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={branding.logoUrl} alt="Logo da loja" className="h-full w-full object-cover" />
                    </span>
                  ) : null}
                  <span className="text-xl font-bold tracking-tight text-slate-950">
                    Improve Styles
                  </span>
                </Link>
              </div>
              <nav className="flex flex-col gap-1 px-4 py-4">
                {primaryLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={supportHref}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Atendimento
                </Link>
                {isAuthenticated ? (
                  <div className="rounded-xl px-3 py-3">
                    <Link href={customerAccountHref} className="flex items-center gap-3 rounded-2xl transition-colors hover:bg-slate-50">
                      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                        {customerPhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={customerPhotoUrl} alt={customerName} className="h-full w-full object-cover" />
                        ) : (
                          <UserRound className="h-5 w-5 text-slate-500" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{customerName}</p>
                        <p className="text-xs text-slate-500">Conta da loja</p>
                      </div>
                    </Link>
                    <form action={logout} className="mt-3">
                      <input type="hidden" name="mode" value="customer" />
                      <input type="hidden" name="next" value="/" />
                      <button
                        type="submit"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Sair
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href={customerAccountHref}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Minha conta
                  </Link>
                )}
              </nav>
              <div className="border-t border-slate-200 px-4 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Categorias</p>
                <div className="flex flex-col gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      className="rounded-xl px-3 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            {branding?.logoUrl ? (
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:h-11 sm:w-11">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logoUrl} alt="Logo da loja" className="h-full w-full object-cover" />
              </span>
            ) : null}
            <span className="text-[1.45rem] font-bold tracking-tight text-slate-950 sm:text-[1.8rem]">
              Improve Styles
            </span>
          </Link>

          <form action="/" className="hidden flex-1 lg:block">
            <div className="flex h-13 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Buscar produtos, categorias, marcas..."
                className="h-full flex-1 px-5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="inline-flex w-16 items-center justify-center bg-primary text-primary-foreground transition-colors hover:opacity-90"
                aria-label="Buscar produtos"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              className="hidden h-11 items-center gap-2 rounded-xl border border-transparent px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 md:inline-flex"
            >
              <Heart className="h-4 w-4" />
              Favoritos
            </button>

            <CartSheet />
          </div>
        </div>

        <form action="/" className="lg:hidden">
          <div className="flex h-11 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Buscar produtos, categorias, marcas..."
              className="h-full flex-1 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="inline-flex w-12 items-center justify-center bg-primary text-primary-foreground"
              aria-label="Buscar produtos"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      <div className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:gap-4 lg:px-8">
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
            <Menu className="h-4 w-4" />
            Todas as categorias
          </div>

          <div className="hidden h-5 w-px bg-slate-200 lg:block" />

          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950 lg:border-0 lg:px-3 lg:py-0"
            >
              {category.label}
            </Link>
          ))}

          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950 lg:border-0 lg:px-3 lg:py-0"
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              href={supportHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
            >
              <Headphones className="h-4 w-4" />
              Atendimento
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href={customerAccountHref}
                  className="inline-flex max-w-[220px] shrink-0 items-center gap-2 rounded-full border border-slate-200 px-2 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100">
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
                    className="inline-flex shrink-0 items-center rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
                  >
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <Link
                href={customerAccountHref}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
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
