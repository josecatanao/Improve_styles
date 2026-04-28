'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  ChevronRight,
  FolderKanban,
  Grid2X2,
  Home,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Settings,
  User as UserIcon,
  Users,
} from 'lucide-react'
import { logout } from '@/app/login/actions'

const productNavigation = [
  { name: 'Visao geral', href: '/dashboard/produtos', icon: Grid2X2 },
  { name: 'Catalogo', href: '/dashboard/produtos/catalogo', icon: FolderKanban },
  { name: 'Cadastrar produto', href: '/dashboard/produtos/novo', icon: PlusCircle },
]

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Usuários', href: '/dashboard/usuarios', icon: Users },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isProductsSectionActive = pathname === '/dashboard/produtos' || pathname.startsWith('/dashboard/produtos/')
  const [isProductsOpen, setIsProductsOpen] = useState(isProductsSectionActive)
  const [isCollapsed, setIsCollapsed] = useState(false)

  function handleProductsToggle() {
    if (isCollapsed) {
      setIsCollapsed(false)
      setIsProductsOpen(true)
      return
    }

    setIsProductsOpen((current) => !current)
  }

  function getPrimaryItemClasses(isActive: boolean) {
    return `group flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
      isActive
        ? 'bg-slate-100 text-slate-950 ring-1 ring-slate-200 shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
    }`
  }

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)] transition-[width] duration-200 ${
        isCollapsed ? 'w-[88px]' : 'w-[292px]'
      }`}
    >
      <div
        className={`flex h-20 shrink-0 items-center border-b border-slate-100 ${
          isCollapsed ? 'justify-center px-3' : 'justify-between px-6'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-[#202020] shadow-sm ring-1 ring-slate-200">
            <div className="absolute bottom-0 left-0 h-6 w-6 bg-white [clip-path:polygon(0_100%,0_35%,100%_0,100%_100%)]" />
            <div className="absolute right-0 top-0 h-6 w-6 bg-[#66e0e0] [clip-path:polygon(0_0,100%_0,100%_78%,38%_100%,38%_54%,0_54%)]" />
          </div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <span className="block truncate text-[2rem] leading-none font-bold tracking-tight text-slate-900">
                Improve Style
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.26em] text-slate-400">Admin Store</span>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          className="hidden h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
          aria-label={isCollapsed ? 'Expandir menu lateral' : 'Retrair menu lateral'}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto py-5 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {!isCollapsed ? (
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Menu principal</p>
        ) : null}

        <div className="space-y-2">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            title="Dashboard"
            className={`${getPrimaryItemClasses(pathname === '/dashboard')} ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Home
              className={`h-5 w-5 shrink-0 ${
                pathname === '/dashboard' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
              } ${isCollapsed ? '' : 'mr-3'}`}
            />
            {!isCollapsed ? 'Dashboard' : null}
          </Link>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleProductsToggle}
              title="Produtos"
              className={`${getPrimaryItemClasses(isProductsSectionActive)} w-full justify-between ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                <Package
                  className={`h-5 w-5 shrink-0 ${
                    isProductsSectionActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
                  } ${isCollapsed ? '' : 'mr-3'}`}
                />
                {!isCollapsed ? 'Produtos' : null}
              </span>
              {!isCollapsed ? (
                <ChevronRight
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    isProductsOpen ? 'rotate-90 text-slate-700' : isProductsSectionActive ? 'text-slate-700' : ''
                  }`}
                />
              ) : null}
            </button>

            {!isCollapsed && isProductsOpen ? (
              <div className="rounded-[1.5rem] bg-slate-50/90 p-2 ring-1 ring-slate-200/80">
                <div className="space-y-1.5">
                  {productNavigation.map((item) => {
                    const isActive = pathname === item.href
                    const ItemIcon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition-all ${
                          isActive
                            ? 'bg-white font-medium text-slate-950 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                      >
                        <ItemIcon className="mr-2.5 h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {navigation.slice(1).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                title={item.name}
                className={`${getPrimaryItemClasses(isActive)} ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
                  } ${isCollapsed ? '' : 'mr-3'}`}
                />
                {!isCollapsed ? item.name : null}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className={`rounded-[1.75rem] border border-slate-200 bg-white shadow-sm ${isCollapsed ? 'p-3' : 'p-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <UserIcon className="h-5 w-5" />
            </div>
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">Admin</p>
                <p className="text-xs text-slate-500">Painel administrativo</p>
              </div>
            ) : null}
          </div>

          <form action={logout} className={isCollapsed ? 'mt-3' : 'mt-4'}>
            <button
              type="submit"
              title="Sair"
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-red-600 ring-1 ring-slate-200 transition-colors hover:bg-red-50 ${
                isCollapsed ? 'h-11' : ''
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed ? <span>Sair</span> : null}
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
