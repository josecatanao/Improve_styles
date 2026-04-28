'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { ProductImageRecord } from '@/lib/product-shared'

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImageRecord[]
  productName: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const normalizedImages = useMemo(
    () =>
      images.length > 0
        ? images
        : [{ public_url: null, alt_text: productName, assigned_color_hex: null, assigned_color_name: null }],
    [images, productName]
  )
  const activeIndex = Math.min(selectedIndex, normalizedImages.length - 1)
  const activeImage = normalizedImages[activeIndex] ?? normalizedImages[0]

  function selectImage(index: number) {
    setSelectedIndex(index)
  }

  function showPreviousImage() {
    setSelectedIndex((current) => (current - 1 + normalizedImages.length) % normalizedImages.length)
  }

  function showNextImage() {
    setSelectedIndex((current) => (current + 1) % normalizedImages.length)
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
        <div className="hidden max-h-[760px] lg:flex lg:flex-col lg:gap-3 lg:overflow-y-auto lg:pr-1">
        {normalizedImages.map((image, index) => (
          <button
            key={`${image.public_url ?? 'placeholder'}-${index}`}
            type="button"
            onClick={() => selectImage(index)}
            className={`overflow-hidden rounded-xl border ${activeIndex === index ? 'border-[#3483fa]' : 'border-slate-200'}`}
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
          <div className="group relative hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
            {activeImage?.public_url ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-sm transition-colors hover:bg-white"
                >
                  <Search className="h-4 w-4" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage.public_url ?? ''}
                  alt={activeImage.alt_text || productName}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                />
              </>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">
                Sem imagem principal
              </div>
            )}
          </div>

          <div className="lg:hidden">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
              {normalizedImages.map((image, index) => (
                <button
                  key={`${image.public_url ?? 'mobile'}-${index}`}
                  type="button"
                  onClick={() => {
                    selectImage(index)
                    setIsZoomOpen(true)
                  }}
                  className="min-w-full snap-center overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  {image.public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.public_url} alt={image.alt_text || productName} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">Sem imagem</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isZoomOpen ? (
        <div className="fixed inset-0 z-50 bg-black/82 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/85">Zoom do produto</p>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                Fechar
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[96px_minmax(0,1fr)]">
              <div className="hidden gap-3 overflow-y-auto lg:flex lg:flex-col">
                {normalizedImages.map((image, index) => (
                  <button
                    key={`zoom-${image.public_url ?? 'placeholder'}-${index}`}
                    type="button"
                    onClick={() => selectImage(index)}
                    className={`overflow-hidden rounded-xl border ${
                      activeIndex === index ? 'border-white' : 'border-white/15'
                    }`}
                  >
                    {image.public_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.public_url} alt={image.alt_text || productName} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-white/10 text-xs text-white/70">Sem foto</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[2rem] bg-white/6">
                {normalizedImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}

                {activeImage?.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeImage.public_url}
                    alt={activeImage.alt_text || productName}
                    className="max-h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full min-h-[320px] w-full items-center justify-center text-sm text-white/70">
                    Sem imagem principal
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
