'use client'

import { useMemo } from 'react'
import type { ProductDetail } from '@/lib/product-shared'
import { AddToCartPanel } from '@/components/store/AddToCartPanel'
import { ProductGallery } from '@/components/store/ProductGallery'
import {
  getProductGallery,
} from '@/lib/storefront'

export function ProductDetailClient({
  product,
  isAuthenticated,
}: {
  product: ProductDetail
  isAuthenticated: boolean
}) {
  const gallery = useMemo(() => getProductGallery(product), [product])

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:gap-6">
      <ProductGallery images={gallery} productName={product.name} />

      <div className="space-y-5">
        <AddToCartPanel product={product} isAuthenticated={isAuthenticated} />
      </div>
    </section>
  )
}
