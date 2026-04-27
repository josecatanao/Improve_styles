import { AlertTriangle, Boxes, Package, Wallet } from 'lucide-react'
import type { ProductDashboardMetrics } from '@/lib/products'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function ProductMetricsGrid({ metrics }: { metrics: ProductDashboardMetrics }) {
  const cards = [
    {
      label: 'Produtos cadastrados',
      value: String(metrics.totalProducts),
      helper: 'Base total do catalogo.',
      icon: Package,
    },
    {
      label: 'Produtos ativos',
      value: String(metrics.activeProducts),
      helper: 'Itens prontos para operacao.',
      icon: Boxes,
    },
    {
      label: 'Valor em estoque',
      value: formatMoney(metrics.inventoryValue),
      helper: 'Preco x quantidade em estoque.',
      icon: Wallet,
    },
    {
      label: 'Estoque baixo',
      value: String(metrics.lowStockCount),
      helper: 'Produtos com 3 unidades ou menos.',
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <Icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
          </div>
        )
      })}
    </div>
  )
}
