'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, MapPin, ShoppingBag, Shield, Heart, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'

const navigation = [
  { name: 'Dados pessoais', href: '/conta', icon: User },
  { name: 'Endereços', href: '/conta/enderecos', icon: MapPin },
  { name: 'Meus pedidos', href: '/conta/pedidos', icon: ShoppingBag },
  { name: 'Favoritos', href: '/conta/favoritos', icon: Heart },
  { name: 'Segurança', href: '/conta/seguranca', icon: Shield },
]

export function AccountSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-[#3483fa]' : 'text-slate-400'}`} />
            {item.name}
          </Link>
        )
      })}

      <div className="my-2 border-t border-slate-100" />

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </button>
      </form>
    </nav>
  )
}
