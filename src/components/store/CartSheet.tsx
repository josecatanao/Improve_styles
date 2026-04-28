'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCart } from '@/components/store/CartProvider'
import { CartContents } from '@/components/store/CartContents'

export function CartSheet() {
  const { totalItems } = useCart()

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button className="relative inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50" />
        }
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Carrinho
        <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[#3483fa] px-1.5 py-0.5 text-xs text-white">
          {totalItems}
        </span>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-md overflow-y-auto bg-slate-50 p-0">
        <SheetHeader className="border-b border-slate-200 bg-white">
          <SheetTitle>Seu carrinho</SheetTitle>
          <SheetDescription>Revise os itens antes de seguir para o checkout.</SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <CartContents showActions={false} />

          <Link
            href="/carrinho"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#3483fa] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2968c8]"
          >
            Abrir carrinho completo
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
