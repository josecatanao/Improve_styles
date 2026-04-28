'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ProductListItem } from '@/lib/product-shared'
import { ProductCard } from '@/components/store/ProductCard'
import { Button } from '@/components/ui/button'

export function ProductCarouselRail({
  title,
  href,
  products,
}: {
  title: string
  href?: string
  products: ProductListItem[]
}) {
  const useCarousel = products.length > 4
  const viewportRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(products.length > 4)

  useEffect(() => {
    const element = viewportRef.current
    if (!element) {
      return
    }

    function updateScrollState() {
      const maxScrollLeft = element.scrollWidth - element.clientWidth
      setCanScrollLeft(element.scrollLeft > 8)
      setCanScrollRight(element.scrollLeft < maxScrollLeft - 8)
    }

    updateScrollState()
    element.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      element.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [products.length])

  function scrollByDirection(direction: 'left' | 'right') {
    const element = viewportRef.current
    if (!element) {
      return
    }

    const amount = Math.max(element.clientWidth * 0.82, 280)
    element.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-[1.45rem] font-semibold tracking-tight text-slate-950 sm:text-[1.65rem] lg:text-[2rem]">{title}</h2>
          {useCarousel ? <p className="text-xs text-slate-500 sm:hidden">Deslize para ver mais</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {href ? (
            <Link href={href} className="mr-2 text-sm font-medium text-[#2563eb]">
              Ver todos
            </Link>
          ) : null}
          {useCarousel ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="hidden rounded-full border-slate-200 bg-white md:inline-flex"
                onClick={() => scrollByDirection('left')}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="hidden rounded-full border-slate-200 bg-white md:inline-flex"
                onClick={() => scrollByDirection('right')}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {useCarousel ? (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#f7f8fa] to-transparent sm:w-8 lg:w-12" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#f7f8fa] to-transparent sm:w-8 lg:w-12" />

          <div
            ref={viewportRef}
            className="flex gap-3 overflow-x-auto scroll-smooth px-1 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[64vw] max-w-[210px] shrink-0 snap-start sm:w-[250px] sm:max-w-none lg:w-[264px] xl:w-[280px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
