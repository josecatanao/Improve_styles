'use client'

import { useMemo, useState } from 'react'
import type { ProductDetail } from '@/lib/product-shared'
import { AddToCartPanel } from '@/components/store/AddToCartPanel'
import { ProductGallery } from '@/components/store/ProductGallery'
import { useCart } from '@/components/store/CartProvider'
import {
  getProductGallery,
  getFirstAvailableVariantSelection,
  hasRealVariants,
} from '@/lib/storefront'

export function ProductDetailClient({
  product,
  isAuthenticated,
  deliverySettings,
}: {
  product: ProductDetail
  isAuthenticated: boolean
  deliverySettings: { delivery_enabled: boolean; pickup_enabled: boolean }
}) {
  const { addItem } = useCart()
  const hasVariants = hasRealVariants(product)
  const initialSelection = useMemo(() => getFirstAvailableVariantSelection(product), [product])
  const [selectedColor, setSelectedColor] = useState<string | null>(initialSelection.colorName)
  const colorHex = useMemo(() => {
    if (!selectedColor) return null
    const color = (product.colors || []).find(c => c.name === selectedColor)
    return color?.hex ?? null
  }, [selectedColor, product.colors])
  const gallery = useMemo(() => getProductGallery(product), [product])

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:gap-6">
      <ProductGallery images={gallery} productName={product.name} selectedColor={selectedColor} colorHex={colorHex} />

      <div className="space-y-5">
        <AddToCartPanel product={product} isAuthenticated={isAuthenticated} selectedColor={selectedColor} onColorChange={setSelectedColor} deliverySettings={deliverySettings} />
      </div>
    </section>
  )
}
