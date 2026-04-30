'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, ShoppingCart, Trash2, Check } from 'lucide-react'
import { useCart } from '@/components/store/CartProvider'
import type { ProductListItem } from '@/lib/product-shared'
import { formatMoney } from '@/lib/storefront'
import { getProductsByIds } from './actions'

export function WishlistClient() {
  const { wishlist, removeFromWishlist, addItem } = useCart()
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (wishlist.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    getProductsByIds(wishlist).then((data) => {
      setProducts(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [wishlist])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Carregando favoritos...
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
        <Heart className="h-12 w-12 text-slate-300" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-700">Nenhum favorito ainda</h2>
          <p className="text-sm text-slate-500">Salve produtos que voce gostou para encontra-los depois.</p>
        </div>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-[#3483fa] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2968c8]"
        >
          Explorar produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {products.length} {products.length === 1 ? 'produto salvo' : 'produtos salvos'}
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              <th className="px-6 py-4" scope="col">Produto</th>
              <th className="px-6 py-4" scope="col">Preco</th>
              <th className="px-6 py-4 text-right" scope="col">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const images = product.product_images ?? []
              const primaryImage = images.find((img) => img.public_url)
              const imageUrl = primaryImage?.public_url ?? null
              const hasDiscount = Number(product.compare_at_price ?? 0) > Number(product.price ?? 0)
              const colorName = primaryImage?.assigned_color_name ?? product.colors?.[0]?.name
              const justAdded = addedIds.has(product.id)

              return (
                <tr key={product.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <Link href={`/produto/${product.id}`} className="flex items-center gap-4">
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            sem foto
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                        {colorName ? (
                          <p className="mt-0.5 text-xs text-slate-500">{colorName}</p>
                        ) : null}
                        {product.sku ? (
                          <p className="mt-0.5 text-[11px] text-slate-400">SKU: {product.sku}</p>
                        ) : null}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {hasDiscount ? (
                      <div>
                        <span className="text-sm font-bold text-slate-900">{formatMoney(product.price)}</span>
                        <span className="ml-2 text-xs text-slate-400 line-through">{formatMoney(product.compare_at_price!)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-900">{formatMoney(product.price)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()

                          addItem({
                            id: `${product.id}-${primaryImage?.assigned_color_hex ?? 'default'}-default`,
                            productId: product.id,
                            name: product.name,
                            price: Number(product.price),
                            quantity: 1,
                            image: imageUrl,
                            colorName: colorName ?? null,
                            colorHex: primaryImage?.assigned_color_hex ?? null,
                          })

                          setAddedIds((prev) => new Set(prev).add(product.id))
                          setTimeout(() => {
                            setAddedIds((prev) => {
                              const next = new Set(prev)
                              next.delete(product.id)
                              return next
                            })
                          }, 1500)
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                          justAdded
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[#3483fa] text-white hover:bg-[#2968c8]'
                        }`}
                      >
                        {justAdded ? (
                          <>
                            <Check className="h-4 w-4" />
                            Adicionado
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4" />
                            Carrinho
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeFromWishlist(product.id)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Remover dos favoritos"
                      >
                        <Trash2 className="h-4 w-4" />
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
  )
}
