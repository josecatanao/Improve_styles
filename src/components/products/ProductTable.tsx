'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ellipsis, LoaderCircle, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useConfirm } from '@/components/ui/feedback-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getProductStatusClasses,
  getProductStatusLabel,
  type ProductListItem,
  type ProductStatus,
} from '@/lib/product-shared'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value))
}

function getStockIndicator(stock: number) {
  if (stock <= 0) {
    return { dot: 'bg-red-400', text: 'text-red-600', label: 'Esgotado' }
  }
  if (stock <= 3) {
    return { dot: 'bg-amber-400', text: 'text-amber-600', label: `${stock} un.` }
  }
  if (stock <= 10) {
    return { dot: 'bg-amber-300', text: 'text-amber-600', label: `${stock} un.` }
  }
  return { dot: 'bg-emerald-400', text: 'text-emerald-600', label: `${stock} un.` }
}

type ProductTableProps = {
  products: ProductListItem[]
  currentPage: number
  totalPages: number
  query: string
  status: string
  loading?: boolean
  onPageChange: (page: number) => void
  onToggleOffer: (productId: string, value: boolean) => void
  onToggleFeatured: (productId: string, value: boolean) => void
  onStatusChange: (productId: string, nextStatus: ProductStatus) => void
  onDelete: (productId: string, productName: string) => void
}

export function ProductTable({
  products,
  currentPage,
  totalPages,
  query,
  status,
  loading = false,
  onPageChange,
  onToggleOffer,
  onToggleFeatured,
  onStatusChange,
  onDelete,
}: ProductTableProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [busyProductId, setBusyProductId] = useState<string | null>(null)

  async function handleDeleteClick(productId: string, productName: string) {
    const confirmed = await confirm({
      title: 'Excluir produto?',
      description: `O produto "${productName}" sera apagado permanentemente.`,
      confirmLabel: 'Excluir produto',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })
    if (!confirmed) return
    setBusyProductId(productId)
    await onDelete(productId, productName)
    setBusyProductId(null)
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-slate-900">Nenhum produto encontrado</h3>
        <p className="mt-2 text-sm text-slate-500">
          Cadastre o primeiro item ou ajuste os filtros para ver os resultados.
        </p>
      </div>
    )
  }

  const currentRows = products.length

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-24">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/90 px-5 py-3 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm">
              <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Carregando...</span>
            </div>
          </div>
        )}

        <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <th scope="col" className="px-4 py-3.5">Produto</th>
                <th scope="col" className="px-4 py-3.5">Preco</th>
                <th scope="col" className="px-4 py-3.5">Estoque</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="w-16 px-2 py-3.5 text-center">Oferta</th>
                <th scope="col" className="w-16 px-2 py-3.5 text-center">Destaque</th>
                <th scope="col" className="px-4 py-3.5">Criado em</th>
                <th scope="col" className="w-12 px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading
                ? Array.from({ length: currentRows }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-200" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-44 animate-pulse rounded-md bg-slate-200" />
                            <div className="h-3 w-28 animate-pulse rounded-md bg-slate-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          <div className="h-4 w-16 animate-pulse rounded-md bg-slate-200" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-slate-200" />
                          <div className="h-4 w-14 animate-pulse rounded-md bg-slate-200" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="inline-flex justify-center">
                          <div className="h-[18px] w-[32px] animate-pulse rounded-full bg-slate-200" />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="inline-flex justify-center">
                          <div className="h-[18px] w-[32px] animate-pulse rounded-full bg-slate-200" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
                        </div>
                      </td>
                    </tr>
                  ))
                : products.map((product) => {
                    const cover = product.product_images?.[0]?.public_url
                    const variantsCount = product.product_variants?.length ?? 0
                    const isBusy = busyProductId === product.id
                    const stockStyle = getStockIndicator(product.stock)

                    return (
                      <tr
                        key={product.id}
                        className="group cursor-pointer transition-colors hover:bg-slate-50"
                        onClick={() => router.push(`/dashboard/produtos/${product.id}/editar`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                              {cover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={cover}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  foto
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {product.name}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                                {product.category && <span>{product.category}</span>}
                                {product.category && product.brand && (
                                  <span aria-hidden="true">&middot;</span>
                                )}
                                {product.brand && <span>{product.brand}</span>}
                                {variantsCount > 0 && (
                                  <>
                                    {(product.category || product.brand) && (
                                      <span aria-hidden="true">&middot;</span>
                                    )}
                                    <span>
                                      {variantsCount} variac{'\u00E3'}o{'\u00F5'}es
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold tabular-nums text-slate-900">
                            {formatMoney(Number(product.price ?? 0))}
                          </p>
                          {product.compare_at_price ? (
                            <p className="text-xs text-slate-400 line-through">
                              {formatMoney(Number(product.compare_at_price))}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block h-2 w-2 shrink-0 rounded-full ${stockStyle.dot}`}
                              aria-hidden="true"
                            />
                            <span className={`text-sm font-medium tabular-nums ${stockStyle.text}`}>
                              {stockStyle.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${getProductStatusClasses(product.status)}`}
                            >
                              {getProductStatusLabel(product.status)}
                            </span>
                            <select
                              value={product.status}
                              disabled={isBusy}
                              onChange={(event) => {
                                event.stopPropagation()
                                onStatusChange(product.id, event.target.value as ProductStatus)
                              }}
                              onClick={(event) => event.stopPropagation()}
                              className="h-7 rounded-lg border border-slate-200 bg-white px-1.5 text-xs text-slate-600 outline-none transition-colors focus:border-slate-400 opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="draft">Rascunho</option>
                              <option value="active">Ativo</option>
                              <option value="out_of_stock">Esgotado</option>
                              <option value="hidden">Oculto</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div
                            className="inline-flex justify-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Switch
                              size="sm"
                              checked={product.is_promotion || false}
                              disabled={isBusy}
                              onCheckedChange={(checked) =>
                                onToggleOffer(product.id, checked)
                              }
                              aria-label={`Oferta: ${product.is_promotion ? 'Ativa' : 'Inativa'}`}
                            />
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div
                            className="inline-flex justify-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Switch
                              size="sm"
                              checked={product.is_featured || false}
                              disabled={isBusy}
                              onCheckedChange={(checked) =>
                                onToggleFeatured(product.id, checked)
                              }
                              aria-label={`Destaque: ${product.is_featured ? 'Ativo' : 'Inativo'}`}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-500">
                          {formatDate(product.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex justify-end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                disabled={isBusy}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Acoes do produto"
                              >
                                {isBusy ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Ellipsis className="h-4 w-4" />
                                )}
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" sideOffset={4}>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/dashboard/produtos/${product.id}/editar`)
                                  }
                                >
                                  <Pencil />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteClick(product.id, product.name)
                                  }
                                >
                                  <Trash2 />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Pagina {currentPage} de {Math.max(totalPages, 1)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || currentPage <= 1}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPage <= 1
                ? 'pointer-events-none bg-slate-100 text-slate-400'
                : loading
                  ? 'pointer-events-none bg-slate-100 text-slate-400'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {loading && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
            Anterior
          </button>
          <button
            type="button"
            disabled={loading || currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPage >= totalPages
                ? 'pointer-events-none bg-slate-100 text-slate-400'
                : loading
                  ? 'pointer-events-none bg-slate-100 text-slate-400'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            Proxima
            {loading && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  )
}
