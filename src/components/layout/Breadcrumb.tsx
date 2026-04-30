'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  produtos: 'Produtos',
  pedidos: 'Pedidos',
  clientes: 'Clientes',
  usuarios: 'Usuarios',
  configuracoes: 'Configuracoes',
  marketing: 'Marketing',
  cupons: 'Cupons',
  entrega: 'Entrega',
  catalogo: 'Catalogo',
  categorias: 'Categorias',
  novo: 'Novo produto',
  loja: 'Loja',
  editar: 'Editar',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === segments.length - 1

    return { href, label, isLast }
  })

  if (breadcrumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            {crumb.isLast ? (
              <span className="font-medium text-slate-900">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-slate-500 transition-colors hover:text-slate-900">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
