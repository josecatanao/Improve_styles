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
      const currentElement = viewportRef.current
      if (!currentElement) {
        return
      }

      const maxScrollLeft = currentElement.scrollWidth - currentElement.clientWidth
      setCanScrollLeft(currentElement.scrollLeft > 8)
      setCanScrollRight(currentElement.scrollLeft < maxScrollLeft - 8)
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
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[1.08rem] font-semibold tracking-tight text-slate-950 sm:text-[1.2rem] lg:text-[1.35rem]">{title}</h2>
          {useCarousel ? <p className="text-xs text-slate-500 sm:hidden">Deslize para ver mais</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {href ? (
            <Link href={href} className="mr-2 text-xs font-medium text-[#2563eb] sm:text-sm">
              Ver todos
            </Link>
          ) : null}
        </div>
      </div>

      {useCarousel ? (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-slate-200 bg-white/95 shadow-sm md:inline-flex lg:left-3"
            onClick={() => scrollByDirection('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-slate-200 bg-white/95 shadow-sm md:inline-flex lg:right-3"
            onClick={() => scrollByDirection('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div
            ref={viewportRef}
            className="flex gap-2.5 overflow-x-auto scroll-smooth px-0.5 pb-2 snap-x snap-mandatory md:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:px-14"
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[47vw] min-w-[158px] max-w-[190px] shrink-0 snap-start sm:w-[250px] sm:min-w-0 sm:max-w-none lg:w-[264px] xl:w-[280px]"
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
