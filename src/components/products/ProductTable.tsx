'use client'

import Link from 'next/link'
import { startTransition, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/utils/supabase/client'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
import {
  getProductStatusClasses,
  getProductStatusLabel,
  type ProductColor,
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

function getColorKey(productId: string, color: ProductColor) {
  return `${productId}-${color.name}-${color.hex}`
}

type ProductTableProps = {
  products: ProductListItem[]
  currentPage: number
  totalPages: number
  query: string
  status: string
  basePath?: string
}

export function ProductTable({
  products,
  currentPage,
  totalPages,
  query,
  status,
  basePath = '/dashboard/produtos',
}: ProductTableProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const showToast = useToast()
  const confirm = useConfirm()
  const [busyProductId, setBusyProductId] = useState<string | null>(null)

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

  const baseParams = new URLSearchParams()
  if (query) {
    baseParams.set('q', query)
  }
  if (status) {
    baseParams.set('status', status)
  }

  function getPageHref(page: number) {
    const params = new URLSearchParams(baseParams)
    params.set('page', String(page))
    return `${basePath}?${params.toString()}`
  }

  async function refreshTable() {
    startTransition(() => {
      router.refresh()
    })
  }

  async function handleStatusChange(productId: string, nextStatus: ProductStatus) {
    setBusyProductId(productId)

    const { error: updateError } = await supabase
      .from('products')
      .update({
        status: nextStatus,
        is_active: nextStatus === 'active',
      })
      .eq('id', productId)

    if (updateError) {
      setBusyProductId(null)
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar status',
        description: updateError.message,
      })
      return
    }

    setBusyProductId(null)
    showToast({
      variant: 'success',
      title: 'Status atualizado',
    })
    await refreshTable()
  }

  async function handleFeaturedChange(productId: string, isFeatured: boolean) {
    setBusyProductId(productId)

    const { error: updateError } = await supabase
      .from('products')
      .update({ is_featured: isFeatured })
      .eq('id', productId)

    if (updateError) {
      setBusyProductId(null)
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar destaque',
        description: updateError.message,
      })
      return
    }

    setBusyProductId(null)
    showToast({
      variant: 'success',
      title: isFeatured ? 'Produto adicionado aos destaques' : 'Produto removido dos destaques',
    })
    await refreshTable()
  }

  async function handleDelete(productId: string, productName: string) {
    const confirmed = await confirm({
      title: 'Excluir produto?',
      description: `O produto "${productName}" sera apagado permanentemente.`,
      confirmLabel: 'Excluir produto',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })
    if (!confirmed) {
      return
    }

    setBusyProductId(productId)

    const { data: imageRows, error: imagesError } = await supabase
      .from('product_images')
      .select('storage_path')
      .eq('product_id', productId)

    if (imagesError) {
      setBusyProductId(null)
      showToast({
        variant: 'error',
        title: 'Falha ao buscar imagens',
        description: imagesError.message,
      })
      return
    }

    const storagePaths =
      imageRows?.map((row) => row.storage_path).filter((value): value is string => Boolean(value)) ?? []

    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId)

    if (deleteError) {
      setBusyProductId(null)
      showToast({
        variant: 'error',
        title: 'Falha ao apagar produto',
        description: deleteError.message,
      })
      return
    }

    if (storagePaths.length > 0) {
      await supabase.storage.from('product-images').remove(storagePaths)
    }

    setBusyProductId(null)
    showToast({
      variant: 'success',
      title: 'Produto apagado',
    })
    await refreshTable()
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Comercial</th>
                <th className="px-4 py-3">Variacoes</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3 text-center">Vitrine</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const cover = product.product_images?.[0]?.public_url
                const variantsCount = product.product_variants?.length ?? 0
                const isBusy = busyProductId === product.id

                return (
                  <tr key={product.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              sem foto
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 max-w-md text-sm text-slate-500">
                            {product.short_description || product.description || 'Sem descricao cadastrada.'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {product.category ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                                {product.category}
                              </span>
                            ) : null}
                            {product.brand ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                                {product.brand}
                              </span>
                            ) : null}
                          </div>
                          {!!product.colors?.length && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {product.colors.map((color) => (
                                <span
                                  key={getColorKey(product.id, color)}
                                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                >
                                  <span
                                    className="h-3 w-3 rounded-full border border-slate-300"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  {color.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{formatMoney(Number(product.price ?? 0))}</p>
                      {product.compare_at_price ? (
                        <p className="mt-1 text-xs text-slate-400 line-through">
                          {formatMoney(Number(product.compare_at_price))}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500">SKU {product.sku || '-'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{variantsCount} variante(s)</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {product.product_variants?.slice(0, 4).map((variant) => (
                          <span
                            key={`${product.id}-${variant.id ?? `${variant.color_hex}-${variant.size}`}`}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                          >
                            {variant.color_name} / {variant.size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <p className={`flex items-center gap-1 font-medium ${product.stock < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {product.stock < 10 ? <TriangleAlert className="h-4 w-4 shrink-0" /> : null}
                        {product.stock} un.
                      </p>
                      <p className={`mt-1 text-xs ${product.stock <= 3 ? 'font-semibold text-amber-600' : product.stock < 10 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {product.stock <= 3 ? 'Estoque critico' : product.stock < 10 ? 'Estoque baixo' : 'Estoque regular'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Switch 
                          checked={product.is_featured || false}
                          disabled={isBusy}
                          onCheckedChange={(checked) => handleFeaturedChange(product.id, checked)}
                        />
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {product.is_featured ? 'Destaque' : 'Normal'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getProductStatusClasses(product.status)}`}
                        >
                          {getProductStatusLabel(product.status)}
                        </span>
                        <select
                          value={product.status}
                          disabled={isBusy}
                          onChange={(event) => handleStatusChange(product.id, event.target.value as ProductStatus)}
                          className="block h-9 w-full min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="draft">Rascunho</option>
                          <option value="active">Ativo</option>
                          <option value="out_of_stock">Esgotado</option>
                          <option value="hidden">Oculto</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(product.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/produtos/${product.id}/editar`}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Link>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(product.id, product.name)}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Apagar
                        </button>
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
          <Link
            href={getPageHref(Math.max(currentPage - 1, 1))}
            aria-disabled={currentPage <= 1}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPage <= 1
                ? 'pointer-events-none bg-slate-100 text-slate-400'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            Anterior
          </Link>
          <Link
            href={getPageHref(Math.min(currentPage + 1, totalPages))}
            aria-disabled={currentPage >= totalPages}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPage >= totalPages
                ? 'pointer-events-none bg-slate-100 text-slate-400'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            Proxima
          </Link>
        </div>
      </div>
    </div>
  )
}
