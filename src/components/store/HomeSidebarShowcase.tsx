'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Minus, Plus, ShoppingCart, Star, X } from 'lucide-react'
import { useCart } from '@/components/store/CartProvider'
import type { ProductListItem } from '@/lib/product-shared'
import { formatMoney, getProductPrimaryImage, resolveVariantSelection } from '@/lib/storefront'

function getColorOptions(product: ProductListItem) {
  if (product.colors?.length) {
    return product.colors
  }

  const seen = new Map<string, { name: string; hex: string }>()
  product.product_variants?.forEach((variant) => {
    if (variant.color_name && variant.color_hex) {
      seen.set(`${variant.color_name}-${variant.color_hex}`, {
        name: variant.color_name,
        hex: variant.color_hex,
      })
    }
  })

  return Array.from(seen.values())
}

function getSizeOptions(product: ProductListItem) {
  return Array.from(
    new Set(
      (product.product_variants ?? [])
        .map((variant) => variant.size?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )
}

export function HomeSidebarShowcase({ product }: { product: ProductListItem | null }) {
  const { items, totalPrice, addItem, updateQuantity, removeItem } = useCart()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  const colorOptions = useMemo(() => (product ? getColorOptions(product) : []), [product])
  const sizeOptions = useMemo(() => (product ? getSizeOptions(product) : []), [product])
  const selectedVariant = product
    ? resolveVariantSelection(
        product.product_variants,
        selectedColor ?? colorOptions[0]?.name ?? null,
        selectedSize ?? sizeOptions[0] ?? null
      )
    : null

  if (!product) {
    return null
  }

  const displayPrice = Number(selectedVariant?.price ?? product.price ?? 0)
  const displayComparePrice = Number(selectedVariant?.compare_at_price ?? product.compare_at_price ?? 0)
  const displayImage = getProductPrimaryImage(product)

  return (
    <div className="space-y-5 xl:sticky xl:top-[10.5rem]">
      <aside className="rounded-[2rem] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] ring-1 ring-slate-200/80">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
          <span>Inicio</span>
          <span>{'>'}</span>
          <span>{product.category?.trim() || 'Catalogo'}</span>
          <span>{'>'}</span>
          <span className="truncate text-slate-500">{product.name}</span>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] bg-[#f3f4f6]">
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayImage} alt={product.name} className="aspect-[4/4.5] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/4.5] items-center justify-center text-sm text-slate-500">Sem imagem</div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {(product.product_images?.slice(0, 4) ?? []).map((image, index) => (
            <div key={`${image.public_url ?? 'thumb'}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-[#f3f4f6]">
              {image.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.public_url} alt={product.name} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center text-[10px] text-slate-400">Sem foto</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <h3 className="text-[1.9rem] font-semibold leading-tight text-slate-950">{product.name}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <div className="flex items-center gap-0.5 text-[#f59e0b]">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
            </div>
            <span>(128 avaliacoes)</span>
          </div>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <p className="text-[2.1rem] font-semibold leading-none text-slate-950">{formatMoney(displayPrice)}</p>
          {displayComparePrice > displayPrice ? (
            <>
              <p className="text-sm text-slate-400 line-through">{formatMoney(displayComparePrice)}</p>
              <span className="rounded-md bg-[#ff5a52] px-2 py-1 text-[11px] font-semibold text-white">-20%</span>
            </>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-600">6x de {formatMoney(displayPrice / 6)} sem juros</p>

        {colorOptions.length > 0 ? (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-900">Cor: {selectedColor ?? colorOptions[0]?.name}</p>
            <div className="mt-3 flex gap-2">
              {colorOptions.map((color, index) => {
                const isSelected = (selectedColor ?? colorOptions[0]?.name) === color.name
                return (
                  <button
                    key={`${color.name}-${color.hex}-${index}`}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`h-9 w-9 rounded-full border-2 ${isSelected ? 'border-[#2563eb]' : 'border-slate-200'}`}
                    style={{ backgroundColor: color.hex }}
                  />
                )
              })}
            </div>
          </div>
        ) : null}

        {sizeOptions.length > 0 ? (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">Tamanho:</p>
              <span className="text-xs text-[#3483fa]">Guia de tamanhos</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const isSelected = (selectedSize ?? sizeOptions[0]) === size
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm ${
                      isSelected ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() =>
            addItem({
              id: `${product.id}:${selectedVariant?.id ?? 'default'}:${selectedColor ?? colorOptions[0]?.name ?? 'sem-cor'}:${selectedSize ?? sizeOptions[0] ?? 'sem-tamanho'}`,
              productId: product.id,
              name: product.name,
              price: displayPrice,
              quantity: 1,
              image: displayImage,
              size: selectedSize ?? sizeOptions[0] ?? null,
              colorName: selectedColor ?? colorOptions[0]?.name ?? null,
              colorHex: selectedVariant?.color_hex ?? colorOptions[0]?.hex ?? null,
              sku: selectedVariant?.sku ?? product.sku ?? null,
            })
          }
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-sm font-medium text-white transition-colors hover:bg-[#111f3b]"
        >
          <ShoppingCart className="h-4 w-4" />
          Adicionar ao carrinho
        </button>
      </aside>

      <aside className="rounded-[2rem] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] ring-1 ring-slate-200/80">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[1.75rem] font-semibold text-slate-950">Seu carrinho</h3>
          <X className="h-4 w-4 text-slate-400" />
        </div>

        <div className="space-y-4">
          {items.length > 0 ? (
            items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex gap-3 border-b border-slate-100 pb-4">
                <div className="overflow-hidden rounded-xl bg-[#f3f4f6]">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-20 w-20 object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center text-[10px] text-slate-400">Sem foto</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.colorName || 'Preto'} {item.size ? `• ${item.size}` : ''}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-xl border border-slate-200">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-9 w-9 text-slate-600">
                        <Minus className="mx-auto h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium text-slate-950">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-9 w-9 text-slate-600">
                        <Plus className="mx-auto h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-lg font-semibold text-slate-950">{formatMoney(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Adicione um produto para preencher seu carrinho.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">Subtotal ({items.length} itens)</span>
          <span className="text-xl font-semibold text-slate-950">{formatMoney(totalPrice)}</span>
        </div>

        <div className="mt-4 grid gap-3">
          <Link
            href="/carrinho"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0f172a] px-4 text-sm font-medium text-white transition-colors hover:bg-[#111f3b]"
          >
            Ir para o carrinho
          </Link>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => removeItem(items[0].id)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Remover primeiro item
            </button>
          ) : null}
        </div>
      </aside>

      <aside className="rounded-[2rem] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] ring-1 ring-slate-200/80">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[1.75rem] font-semibold text-slate-950">Checkout</h3>
          <X className="h-4 w-4 text-slate-400" />
        </div>

        <div className="mb-5 flex items-center gap-2 text-xs">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-white">1</span>
          <span className="text-[#2563eb]">Identificacao</span>
          <span className="h-px flex-1 bg-slate-200" />
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">2</span>
          <span className="text-slate-400">Entrega</span>
          <span className="h-px flex-1 bg-slate-200" />
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">3</span>
          <span className="text-slate-400">Revisao</span>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm text-slate-600">
            <span>Nome completo</span>
            <input className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-slate-400" placeholder="Digite seu nome" />
          </label>
          <label className="grid gap-1.5 text-sm text-slate-600">
            <span>Telefone / WhatsApp</span>
            <input className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-slate-400" placeholder="(11) 99999-9999" />
          </label>
          <label className="grid gap-1.5 text-sm text-slate-600">
            <span>Observacao (opcional)</span>
            <textarea
              rows={4}
              className="rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-slate-400"
              placeholder="Alguma observacao para o pedido?"
            />
          </label>
          <Link
            href="/checkout"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0f172a] px-4 text-sm font-medium text-white transition-colors hover:bg-[#111f3b]"
          >
            Continuar
          </Link>
        </div>
      </aside>
    </div>
  )
}
