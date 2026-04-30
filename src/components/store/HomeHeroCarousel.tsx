'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StoreImage } from '@/components/store/StoreImage'

type Slide = {
  id: string
  href: string
  image: string | null
  alt: string
}

export function HomeHeroCarousel({ banners }: { banners: { id: string; image_url: string; link_url: string | null }[] }) {
  const slides = useMemo<Slide[]>(
    () =>
      banners.map((banner) => ({
        id: banner.id,
        href: banner.link_url || '#',
        image: banner.image_url,
        alt: 'Banner da loja',
      })),
    [banners]
  )
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [slides.length])

  if (slides.length === 0) {
    return null
  }

  const activeSlide = slides[activeIndex]

  function goTo(index: number) {
    setActiveIndex(index)
  }

  function goBy(step: number) {
    setActiveIndex((current) => (current + step + slides.length) % slides.length)
  }

  return (
    <section className="relative overflow-hidden rounded-none bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)]">
      <Link href={activeSlide.href} className="block relative">
        <StoreImage
          src={activeSlide.image}
          alt={activeSlide.alt}
          className="aspect-[16/8.8] w-full object-cover sm:aspect-[16/6.8] lg:aspect-[16/5.1]"
          fallbackClassName="flex aspect-[16/8.8] w-full items-center justify-center bg-[linear-gradient(120deg,#eef2ff_0%,#f8fafc_100%)] text-sm text-slate-500 sm:aspect-[16/6.8] lg:aspect-[16/5.1]"
          fallbackLabel="Banner da loja"
        />
      </Link>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goBy(-1)}
            className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-none bg-white/96 text-slate-700 shadow-sm transition-colors hover:bg-white sm:left-5 sm:h-12 sm:w-12"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goBy(1)}
            className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-none bg-white/96 text-slate-700 shadow-sm transition-colors hover:bg-white sm:right-5 sm:h-12 sm:w-12"
            aria-label="Proximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 sm:bottom-5 sm:gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(index)}
                className={
                  index === activeIndex
                    ? 'h-2 w-8 rounded-none bg-white shadow-sm sm:w-10'
                    : 'h-2 w-2 rounded-none bg-white/70 sm:h-2.5 sm:w-2.5'
                }
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
