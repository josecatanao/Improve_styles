'use client'

import Link from 'next/link'
import { Headphones, Heart, Menu, Search, ShieldCheck, ShoppingCart, Truck, UserRound } from 'lucide-react'
import { CartSheet } from '@/components/store/CartSheet'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

type HeaderCategory = {
  label: string
  href: string
}

const primaryLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Promocoes', href: '/?sort=price_asc' },
  { label: 'Novidades', href: '/?sort=popular' },
  { label: 'Mais vendidos', href: '/?sort=price_desc' },
]

export function Header({
  categories,
  query = '',
}: {
  categories: HeaderCategory[]
  query?: string
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="bg-[#0f172a] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto px-4 py-2 text-[11px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:px-6 lg:py-2.5 lg:text-xs">
          <div className="flex shrink-0 items-center gap-5 lg:gap-8">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-white/85 lg:gap-2">
              <Truck className="h-3.5 w-3.5" />
              Frete gratis acima de R$199
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-white/85 lg:gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Troca facil em ate 7 dias
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-white/85 lg:gap-2">
              <ShoppingCart className="h-3.5 w-3.5" />
              Parcele em ate 6x sem juros
            </span>
          </div>

          <div className="hidden items-center gap-6 text-white/85 lg:flex">
            <span className="inline-flex items-center gap-2">
              <Headphones className="h-3.5 w-3.5" />
              Atendimento
            </span>
            <Link href="/login" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <UserRound className="h-3.5 w-3.5" />
              Minha conta
            </Link>
          </div>
        </div>
      </div>

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
                <Link href="/" className="text-2xl font-bold tracking-tight text-slate-950">
                  Style<span className="text-[#3483fa]">Store</span>
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

          <Link href="/" className="shrink-0 text-[1.45rem] font-bold tracking-tight text-slate-950 sm:text-[1.8rem]">
            Style<span className="text-[#3483fa]">Store</span>
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
                className="inline-flex w-16 items-center justify-center bg-[#0f172a] text-white transition-colors hover:bg-[#111f3b]"
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
              className="inline-flex w-12 items-center justify-center bg-[#0f172a] text-white"
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

          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950 lg:border-0 lg:px-3 lg:py-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
