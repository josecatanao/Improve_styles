'use client'

import { useState } from 'react'
import type { ProductImageRecord } from '@/lib/product-shared'

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImageRecord[]
  productName: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
      <div className="hidden lg:flex lg:flex-col lg:gap-3">
        {images.map((image, index) => (
          <button
            key={`${image.public_url ?? 'placeholder'}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`overflow-hidden rounded-xl border ${selectedIndex === index ? 'border-[#3483fa]' : 'border-slate-200'}`}
          >
            {image.public_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.public_url} alt={image.alt_text || productName} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-xs text-slate-500">Sem foto</div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
          {images[selectedIndex]?.public_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[selectedIndex].public_url ?? ''}
              alt={images[selectedIndex].alt_text || productName}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">
              Sem imagem principal
            </div>
          )}
        </div>

        <div className="lg:hidden">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <div key={`${image.public_url ?? 'mobile'}-${index}`} className="min-w-full snap-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {image.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.public_url} alt={image.alt_text || productName} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">Sem imagem</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
