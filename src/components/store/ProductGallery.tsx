'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { ProductImageRecord } from '@/lib/product-shared'

export function ProductGallery({
  images,
  productName,
  selectedColor,
  colorHex,
}: {
  images: ProductImageRecord[]
  productName: string
  selectedColor?: string | null
  colorHex?: string | null
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }, [])
  const normalizedImages = useMemo(
    () =>
      images.length > 0
        ? images
        : [{ public_url: null, alt_text: productName, assigned_color_hex: null, assigned_color_name: null }],
    [images, productName]
  )
  const filteredImages = useMemo(() => {
    if (!selectedColor) return normalizedImages
    return normalizedImages.filter(img =>
      !img.public_url ||
      img.assigned_color_name === selectedColor ||
      img.assigned_color_hex === colorHex ||
      (!img.assigned_color_name && !img.assigned_color_hex)
    )
  }, [normalizedImages, selectedColor, colorHex])
  const activeIndex = Math.min(selectedIndex, filteredImages.length - 1)
  const activeImage = filteredImages[activeIndex] ?? filteredImages[0]

  function selectImage(index: number) {
    setSelectedIndex(index)
  }

  function showPreviousImage() {
    setSelectedIndex((current) => (current - 1 + filteredImages.length) % filteredImages.length)
  }

  function showNextImage() {
    setSelectedIndex((current) => (current + 1) % filteredImages.length)
  }

  return (
    <>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
        <div className="hidden max-h-[760px] lg:flex lg:flex-col lg:gap-3 lg:overflow-y-auto lg:pr-1">
        {filteredImages.map((image, index) => (
          <button
            key={`${image.public_url ?? 'placeholder'}-${index}`}
            type="button"
            onClick={() => selectImage(index)}
            className={`relative w-full aspect-square overflow-hidden rounded-md border ${activeIndex === index ? 'border-[color:var(--store-button-bg)]' : 'border-slate-200'}`}
          >
            {image.public_url ? (
              <img src={image.public_url} alt={image.alt_text || productName} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-xs text-slate-500">Sem foto</div>
            )}
          </button>
        ))}
        </div>

        <div className="space-y-3">
          <div className="hidden lg:block">
            <div
              ref={imageContainerRef}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={handleMouseMove}
              className={`group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white cursor-zoom-in ${
                isHovering ? 'z-10' : ''
              }`}
            >
              {activeImage?.public_url ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/92 text-slate-700 shadow-sm transition-colors hover:bg-white"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <img
                    src={activeImage.public_url}
                    alt={activeImage.alt_text || productName}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-200 ease-out"
                    style={
                      isHovering
                        ? {
                            transform: 'scale(2.2)',
                            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                          }
                        : undefined
                    }
                  />
                </>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">
                  Sem imagem principal
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filteredImages.map((image, index) => (
                <button
                  key={`${image.public_url ?? 'mobile'}-${index}`}
                  type="button"
                  onClick={() => {
                    selectImage(index)
                    setIsZoomOpen(true)
                  }}
                  className="relative min-w-full snap-center overflow-hidden rounded-md border border-slate-200 bg-white"
                >
                  {image.public_url ? (
                    <div className="relative aspect-square w-full">
                      <img src={image.public_url} alt={image.alt_text || productName} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">Sem imagem</div>
                  )}
                </button>
              ))}
            </div>
            {filteredImages.length > 1 ? (
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                {filteredImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectImage(index)}
                    aria-label={`Imagem ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      activeIndex === index ? 'w-5 bg-slate-800' : 'w-2 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isZoomOpen ? (
        <div className="fixed inset-0 z-[95] bg-black/82 p-3 sm:p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/85">Zoom do produto</p>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                Fechar
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[96px_minmax(0,1fr)]">
              <div className="hidden gap-3 overflow-y-auto lg:flex lg:flex-col">
                {filteredImages.map((image, index) => (
                  <button
                    key={`zoom-${image.public_url ?? 'placeholder'}-${index}`}
                    type="button"
                    onClick={() => selectImage(index)}
                    className={`relative w-full aspect-square overflow-hidden rounded-md border ${
                      activeIndex === index ? 'border-white' : 'border-white/15'
                    }`}
                  >
                    {image.public_url ? (
                      <img src={image.public_url} alt={image.alt_text || productName} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-white/10 text-xs text-white/70">Sem foto</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-white/6">
                {filteredImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/15 sm:left-4 sm:h-11 sm:w-11"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/15 sm:right-4 sm:h-11 sm:w-11"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}

                {activeImage?.public_url ? (
                  <img
                    src={activeImage.public_url}
                    alt={activeImage.alt_text || productName}
                    className="absolute inset-0 w-full h-full object-contain"
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
