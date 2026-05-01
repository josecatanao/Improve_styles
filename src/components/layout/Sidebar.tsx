'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  FolderKanban,
  Grid2X2,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Settings,
  ShoppingBag,
  Tags,
  TicketPercent,
  Truck,
  User as UserIcon,
  Users,
} from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { logout } from '@/app/login/actions'

const productNavigation = [
  { name: 'Visao geral', href: '/dashboard/produtos', icon: Grid2X2 },
  { name: 'Catalogo', href: '/dashboard/produtos/catalogo', icon: FolderKanban },
  { name: 'Categorias', href: '/dashboard/produtos/categorias', icon: Tags },
  { name: 'Cupons', href: '/dashboard/cupons', icon: TicketPercent },
  { name: 'Cadastrar produto', href: '/dashboard/produtos/novo', icon: PlusCircle },
]

const settingsNavigation = [
  { name: 'Configurações da loja', href: '/dashboard/configuracoes/loja', icon: ShoppingBag },
  { name: 'Configurações do dashboard', href: '/dashboard/configuracoes/dashboard', icon: LayoutDashboard },
  { name: 'Configurações de entrega', href: '/dashboard/configuracoes/entrega', icon: Truck },
]

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Pedidos', href: '/dashboard/pedidos', icon: ShoppingBag },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Grid2X2 },
  { name: 'Entrega', href: '/dashboard/entrega', icon: Truck },
  { name: 'Clientes', href: '/dashboard/clientes', icon: UserIcon },
  { name: 'Usuários', href: '/dashboard/usuarios', icon: Users },
]

type SidebarProps = {
  onNavigate?: () => void
  branding?: {
    logoUrl?: string | null
    storeName?: string | null
  }
  recentOrders?: Array<{
    id: string
    createdAt: string
  }>
}

const ORDER_NOTIFICATIONS_VIEWED_KEY = 'dashboard-orders-viewed-at'

export function Sidebar({ onNavigate, branding, recentOrders = [] }: SidebarProps) {
  const pathname = usePathname()
  const isProductsSectionActive = pathname === '/dashboard/produtos' || pathname.startsWith('/dashboard/produtos/')
  const isSettingsSectionActive = pathname === '/dashboard/configuracoes' || pathname.startsWith('/dashboard/configuracoes/')
  const [isProductsOpen, setIsProductsOpen] = useState(isProductsSectionActive)
  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsSectionActive)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const latestRecentOrderAt = useMemo(() => recentOrders[0]?.createdAt ?? null, [recentOrders])
  const recentOrderCount = useSyncExternalStore(
    () => () => {},
    () => {
      if (pathname === '/dashboard/pedidos' || pathname.startsWith('/dashboard/pedidos/')) {
        return 0
      }
      const lastViewedAt = window.localStorage.getItem(ORDER_NOTIFICATIONS_VIEWED_KEY)
      return recentOrders.filter((order) => !lastViewedAt || order.createdAt > lastViewedAt).length
    },
    () => 0
  )

  useEffect(() => {
    if (pathname === '/dashboard/pedidos' || pathname.startsWith('/dashboard/pedidos/')) {
      if (latestRecentOrderAt) {
        window.localStorage.setItem(ORDER_NOTIFICATIONS_VIEWED_KEY, latestRecentOrderAt)
      }
    }
  }, [latestRecentOrderAt, pathname])

  function handleProductsToggle() {
    if (isCollapsed) {
      setIsCollapsed(false)
      setIsProductsOpen(true)
      return
    }

    setIsProductsOpen((current) => !current)
  }

  function handleSettingsToggle() {
    if (isCollapsed) {
      setIsCollapsed(false)
      setIsSettingsOpen(true)
      return
    }

    setIsSettingsOpen((current) => !current)
  }

  function getPrimaryItemClasses(isActive: boolean) {
    return `group relative flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
      isActive
        ? 'bg-slate-100 text-slate-950 ring-1 ring-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
    }`
  }

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)] transition-[width] duration-200 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)] ${
        isCollapsed ? 'w-[88px]' : 'w-[292px]'
      }`}
    >
      <div
        className={`flex h-20 shrink-0 items-center border-b border-slate-100 dark:border-slate-800 ${
          isCollapsed ? 'justify-center px-3' : 'justify-between px-6'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'gap-2.5'}`}>
          {branding?.logoUrl ? (
            <div className="flex h-10 shrink-0 items-center justify-start overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.logoUrl} alt="Logo da loja" className="block h-full w-auto max-w-[44px] object-contain object-left" />
            </div>
          ) : null}
          {!isCollapsed ? (
            <div className="min-w-0">
              <span className="block truncate text-base leading-tight font-bold text-slate-900 dark:text-slate-50">
                {branding?.storeName?.trim() || 'Improve Styles'}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.26em] text-slate-400 dark:text-slate-500">Admin Store</span>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          className="hidden h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50 lg:inline-flex"
          aria-label={isCollapsed ? 'Expandir menu lateral' : 'Retrair menu lateral'}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto py-5 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {!isCollapsed ? (
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Menu principal</p>
        ) : null}

        <div className="space-y-2">
          {navigation.map((item) => {
            if (item.href === '/dashboard') {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
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
            }

            return null
          })}

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
              <div className="rounded-[1.5rem] bg-slate-50/90 p-2 ring-1 ring-slate-200/80 dark:bg-slate-900/80 dark:ring-slate-800">
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
                            ? 'bg-white font-medium text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
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

          {navigation.filter((item) => item.href !== '/dashboard').map((item) => {
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
                {!isCollapsed ? (
                  <>
                    <span className="truncate">{item.name}</span>
                    {item.href === '/dashboard/pedidos' && recentOrderCount > 0 ? (
                      <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-[11px] font-semibold text-white">
                        {recentOrderCount}
                      </span>
                    ) : null}
                  </>
                ) : item.href === '/dashboard/pedidos' && recentOrderCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                ) : null}
              </Link>
            )
          })}

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSettingsToggle}
              title="Configurações"
              className={`${getPrimaryItemClasses(isSettingsSectionActive)} w-full justify-between ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                <Settings
                  className={`h-5 w-5 shrink-0 ${
                    isSettingsSectionActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
                  } ${isCollapsed ? '' : 'mr-3'}`}
                />
                {!isCollapsed ? 'Configurações' : null}
              </span>
              {!isCollapsed ? (
                <ChevronRight
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    isSettingsOpen ? 'rotate-90 text-slate-700' : isSettingsSectionActive ? 'text-slate-700' : ''
                  }`}
                />
              ) : null}
            </button>

            {!isCollapsed && isSettingsOpen ? (
              <div className="rounded-[1.5rem] bg-slate-50/90 p-2 ring-1 ring-slate-200/80 dark:bg-slate-900/80 dark:ring-slate-800">
                <div className="space-y-1.5">
                  {settingsNavigation.map((item) => {
                    const isActive = pathname === item.href
                    const ItemIcon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition-all ${
                          isActive
                            ? 'bg-white font-medium text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
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
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className={`rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <UserIcon className="h-5 w-5" />
            </div>
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">Admin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Painel administrativo</p>
              </div>
            ) : null}
          </div>

          <form action={logout} className={isCollapsed ? 'mt-3' : 'mt-4'}>
            <button
              type="submit"
              title="Sair"
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-red-600 ring-1 ring-slate-200 transition-colors hover:bg-red-50 dark:bg-slate-950 dark:ring-slate-800 dark:hover:bg-red-950/30 ${
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
