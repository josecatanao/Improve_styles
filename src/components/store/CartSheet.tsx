'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart, X } from 'lucide-react'
import { useCart } from '@/components/store/CartProvider'
import { CartContents } from '@/components/store/CartContents'

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

function CartDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
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
      <div className="relative z-10 ml-auto flex h-full w-[88vw] max-w-md flex-col bg-slate-50 shadow-xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-base font-medium text-foreground">Seu carrinho</h2>
            <p className="text-sm text-muted-foreground">Revise os itens antes de seguir para o checkout.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

export function CartSheet({ compact = false }: { compact?: boolean }) {
  const { totalItems } = useCart()
  const [open, setOpen] = useState(false)
  const handleClose = useCallback(() => setOpen(false), [])

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={compact ? `Carrinho, ${totalItems} itens` : undefined}
      className={
        compact
          ? 'relative inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:opacity-90'
          : 'relative inline-flex h-11 items-center justify-center rounded-md border border-[color:var(--store-header-border)] bg-[var(--store-header-bg)] px-4 text-sm font-medium text-[var(--store-header-fg)] transition-colors hover:opacity-90'
      }
    >
      {compact ? (
        <>
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Carrinho
          <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--store-cart-bg)] px-1.5 py-0.5 text-xs text-[var(--store-cart-fg)]">
            {totalItems}
          </span>
        </>
      )}
    </button>
  )

  return (
    <>
      {trigger}
      <CartDrawer open={open} onClose={handleClose}>
        <CartContents showActions={false} />
        <Link
          href="/carrinho"
          onClick={handleClose}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--store-button-bg)] px-4 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90"
        >
          Abrir carrinho completo
        </Link>
      </CartDrawer>
    </>
  )
}
