'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Palette, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function Header({
  branding,
  recentOrders,
}: {
  branding?: {
    logoUrl?: string | null
    storeName?: string | null
  }
  recentOrders?: Array<{
    id: string
    createdAt: string
  }>
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
            aria-label="Fechar menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Menu</span>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Fechar menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <Sidebar branding={branding} recentOrders={recentOrders} onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed left-4 top-4 z-30 lg:hidden">
        <button
          type="button"
          className="pointer-events-auto inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          aria-label="Abrir menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="pointer-events-none fixed right-4 top-4 z-30">
        <Link
          href="/dashboard/configuracoes/dashboard"
          className="pointer-events-auto inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          aria-label="Tema"
          title="Tema"
        >
          <Palette className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </>
  )
}
