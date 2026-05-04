'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderCircle, Search, X } from 'lucide-react'
import { ProductTable } from '@/components/products/ProductTable'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ui/feedback-provider'
import type { ProductListItem, ProductStatus } from '@/lib/product-shared'
import type { ProductListResult } from '@/lib/products'

type CatalogClientProps = {
  initialData: ProductListResult
}

export function CatalogClient({ initialData }: CatalogClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showToast = useToast()
  const supabase = createClient()

  const [products, setProducts] = useState<ProductListItem[]>(initialData.products)
  const [totalPages, setTotalPages] = useState(initialData.totalPages)
  const [currentPage, setCurrentPage] = useState(initialData.currentPage)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const syncUrl = useCallback(
    (params: { q?: string; status?: string; page?: number }) => {
      const next = new URLSearchParams()
      if (params.q) next.set('q', params.q)
      if (params.status) next.set('status', params.status)
      if (params.page && params.page > 1) next.set('page', String(params.page))
      const href = `/dashboard/produtos/catalogo${next.size ? `?${next.toString()}` : ''}`
      router.replace(href)
    },
    [router],
  )

  const fetchProducts = useCallback(
    async (params: { q: string; status: string; page: number }) => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)

      const searchParams = new URLSearchParams()
      if (params.q) searchParams.set('q', params.q)
      if (params.status) searchParams.set('status', params.status)
      searchParams.set('page', String(params.page))

      try {
        const res = await fetch(`/api/products?${searchParams.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data: ProductListResult = await res.json()
        setProducts(data.products)
        setTotalPages(data.totalPages)
        setCurrentPage(data.currentPage)
        syncUrl(params)
      } catch {
        // aborted or network error — silently ignore
      } finally {
        setIsLoading(false)
      }
    },
    [syncUrl],
  )

  const applyFilters = useCallback(
    (q: string, s: string, p: number = 1) => {
      fetchProducts({ q, status: s, page: p })
    },
    [fetchProducts],
  )

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        applyFilters(value, status, 1)
      }, 300)
    },
    [status, applyFilters],
  )

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatus(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      applyFilters(query, value, 1)
    },
    [query, applyFilters],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      applyFilters(query, status, page)
    },
    [query, status, applyFilters],
  )

  const handleClearFilters = useCallback(() => {
    setQuery('')
    setStatus('')
    applyFilters('', '', 1)
  }, [applyFilters])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const showClear = query || status

  async function handleToggleOffer(productId: string, value: boolean) {
    const previous = products
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_promotion: value } : p)),
    )

    const { error } = await supabase
      .from('products')
      .update({ is_promotion: value })
      .eq('id', productId)

    if (error) {
      setProducts(previous)
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar oferta',
      })
    } else {
      showToast({
        variant: 'success',
        title: value ? 'Produto adicionado as ofertas' : 'Produto removido das ofertas',
      })
    }
  }

  async function handleToggleFeatured(productId: string, value: boolean) {
    const previous = products
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_featured: value } : p)),
    )

    const { error } = await supabase
      .from('products')
      .update({ is_featured: value })
      .eq('id', productId)

    if (error) {
      setProducts(previous)
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar destaque',
      })
    } else {
      showToast({
        variant: 'success',
        title: value ? 'Produto adicionado aos destaques' : 'Produto removido dos destaques',
      })
    }
  }

  async function handleStatusToggle(productId: string, nextStatus: ProductStatus) {
    const previous = products
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: nextStatus, is_active: nextStatus === 'active' }
          : p,
      ),
    )

    const { error } = await supabase
      .from('products')
      .update({
        status: nextStatus,
        is_active: nextStatus === 'active',
      })
      .eq('id', productId)

    if (error) {
      setProducts(previous)
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar status',
      })
    } else {
      showToast({
        variant: 'success',
        title: 'Status atualizado',
      })
    }
  }

  async function handleDelete(productId: string, productName: string) {
    const previous = products
    setProducts((prev) => prev.filter((p) => p.id !== productId))

    const { data: imageRows, error: imagesError } = await supabase
      .from('product_images')
      .select('storage_path')
      .eq('product_id', productId)

    if (!imagesError && imageRows) {
      const storagePaths = imageRows
        .map((row) => row.storage_path)
        .filter((value): value is string => Boolean(value))
      if (storagePaths.length > 0) {
        await supabase.storage.from('product-images').remove(storagePaths)
      }
    }

    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId)

    if (deleteError) {
      setProducts(previous)
      showToast({
        variant: 'error',
        title: 'Falha ao apagar produto',
      })
      return
    }

    showToast({
      variant: 'success',
      title: 'Produto apagado',
    })
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Filtrar produtos</h2>
          <p className="text-sm text-slate-500">
            Busque por nome, SKU, categoria ou marca e ajuste a listagem pelo status do item.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar por nome, SKU, categoria ou marca"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="draft">Rascunhos</option>
            <option value="out_of_stock">Esgotados</option>
            <option value="hidden">Ocultos</option>
          </select>

          <div className="flex items-center gap-2">
            {showClear && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
            {isLoading && (
              <LoaderCircle className="h-5 w-5 animate-spin text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {initialData.errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {initialData.errorMessage}
        </div>
      ) : (
        <ProductTable
          products={products}
          currentPage={currentPage}
          totalPages={totalPages}
          query={query}
          status={status}
          loading={isLoading}
          onPageChange={handlePageChange}
          onToggleOffer={handleToggleOffer}
          onToggleFeatured={handleToggleFeatured}
          onStatusChange={handleStatusToggle}
          onDelete={handleDelete}
        />
      )}
    </section>
  )
}
