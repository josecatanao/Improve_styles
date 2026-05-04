import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { buildStoreBrandStyle, normalizeStoreSettings } from '@/lib/store-settings'

export default async function NotFound() {
  const settings = await getPublicStoreSettings()
  const normalized = normalizeStoreSettings(settings)
  const brandStyle = buildStoreBrandStyle(normalized)
  const storeName = normalized.store_name
  const logoUrl = normalized.store_logo_url
  const primaryColor = normalized.brand_primary_color
  const primaryForeground = brandStyle['--primary-foreground'] as string

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-white" style={brandStyle}>
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          className="group mb-10 inline-flex items-center justify-center gap-3 no-underline"
        >
          {logoUrl ? (
            <span className="relative h-14 w-14 shrink-0 overflow-hidden">
              <Image
                src={logoUrl}
                alt={`Logo da ${storeName}`}
                fill
                className="object-contain object-left"
                sizes="56px"
              />
            </span>
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">
              {storeName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[var(--primary)] transition-colors">
            {storeName}
          </span>
        </Link>

        <p className="select-none text-[7rem] font-black leading-none tracking-tighter text-slate-50 sm:text-[9rem]">
          404
        </p>

        <h1 className="-mt-6 text-2xl font-bold text-slate-900">
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          A página que você procura não existe ou foi movida para outro local.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all hover:brightness-110 hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: primaryColor,
            color: primaryForeground,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>
      </div>
    </div>
  )
}
