'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Autoplay from 'embla-carousel-autoplay'
import { StoreImage } from '@/components/store/StoreImage'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
  type CarouselApi,
} from '@/components/ui/carousel'

type Slide = {
  id: string
  href: string
  image: string | null
  alt: string
}

type Props = {
  banners: { id: string; image_url: string; link_url: string | null }[]
}

function BannerControls({ slides }: { slides: Slide[] }) {
  const { scrollPrev, scrollNext, api } = useCarousel()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    setIndex(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  return (
    <>
      <button
        type="button"
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/96 text-slate-700 shadow-sm transition-colors hover:bg-white sm:left-5 sm:h-12 sm:w-12"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/96 text-slate-700 shadow-sm transition-colors hover:bg-white sm:right-5 sm:h-12 sm:w-12"
        aria-label="Proximo slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2 sm:bottom-5 sm:gap-3">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              api?.scrollTo(i)
            }}
            className={
                i === index
                  ? 'h-2 w-8 rounded-full bg-white shadow-sm sm:w-10'
                  : 'h-2 w-2 rounded-full bg-white/70 sm:h-2.5 sm:w-2.5'
            }
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </>
  )
}

export function HomeHeroCarousel({ banners }: Props) {
  const slides = useMemo<Slide[]>(
    () =>
      banners.map((banner) => ({
        id: banner.id,
        href: banner.link_url || '#',
        image: banner.image_url,
        alt: 'Banner da loja',
      })),
    [banners],
  )

  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: false }))

  if (slides.length === 0) {
    return null
  }

  if (slides.length === 1) {
    return (
      <section className="relative overflow-hidden rounded-none bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)]">
        <Link href={slides[0].href} className="block relative">
          <StoreImage
            src={slides[0].image}
            alt={slides[0].alt}
            className="aspect-[16/8.8] w-full object-cover sm:aspect-[16/6.8] lg:aspect-[16/5.1]"
            fallbackClassName="flex aspect-[16/8.8] w-full items-center justify-center bg-[linear-gradient(120deg,#eef2ff_0%,#f8fafc_100%)] text-sm text-slate-500 sm:aspect-[16/6.8] lg:aspect-[16/5.1]"
            fallbackLabel="Banner da loja"
          />
        </Link>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-none bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)]">
      <Carousel
        opts={{ loop: true }}
        plugins={[plugin.current]}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <Link href={slide.href} className="block relative" draggable={false}>
                <StoreImage
                  src={slide.image}
                  alt={slide.alt}
                  className="aspect-[16/8.8] w-full object-cover sm:aspect-[16/6.8] lg:aspect-[16/5.1]"
                  fallbackClassName="flex aspect-[16/8.8] w-full items-center justify-center bg-[linear-gradient(120deg,#eef2ff_0%,#f8fafc_100%)] text-sm text-slate-500 sm:aspect-[16/6.8] lg:aspect-[16/5.1]"
                  fallbackLabel="Banner da loja"
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        <BannerControls slides={slides} />
      </Carousel>
    </section>
  )
}
