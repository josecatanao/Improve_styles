import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { StoreBrandMark } from '@/components/store/StoreBrandMark'

type Branding = {
  logoUrl?: string | null
  storeName?: string | null
}

type AuthPageShellProps = {
  children: React.ReactNode
  isStoreContext?: boolean
  title?: string
  subtitle?: string
  branding?: Branding
  brandStyle?: CSSProperties
}

export function AuthPageShell({
  children,
  isStoreContext = true,
  title,
  subtitle,
  branding,
  brandStyle,
}: AuthPageShellProps) {
  const backHref = isStoreContext ? '/' : '/dashboard'
  const backLabel = isStoreContext ? 'Voltar para a loja' : 'Voltar para o painel'

  const headerBg = brandStyle?.['--store-header-bg'] as string | undefined
  const headerFg = brandStyle?.['--store-header-fg'] as string | undefined
  const headerBorder = brandStyle?.['--store-header-border'] as string | undefined
  const primaryColor = brandStyle?.['--primary'] as string | undefined

  const resolvedHeaderBg = headerBg || '#ffffff'
  const resolvedHeaderFg = headerFg || '#0f172a'
  const resolvedHeaderBorder = headerBorder || 'rgba(15,23,42,0.06)'

  return (
    <div
      className="min-h-screen"
      style={{
        background: primaryColor
          ? `radial-gradient(circle at top left, ${primaryColor}1A, transparent 26%), radial-gradient(circle at top right, ${primaryColor}14, transparent 22%), linear-gradient(180deg, #f8fafc 0%, ${primaryColor}08 100%)`
          : undefined,
      }}
    >
      <header
        className="border-b backdrop-blur"
        style={{
          backgroundColor: resolvedHeaderBg,
          borderColor: resolvedHeaderBorder,
          color: resolvedHeaderFg,
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <StoreBrandMark
            logoUrl={branding?.logoUrl}
            storeName={branding?.storeName}
          />

          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{
              borderColor: resolvedHeaderBorder,
              color: resolvedHeaderFg,
              backgroundColor: 'transparent',
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6">
          {title ? (
            <div className="w-full text-center">
              <h1 className="text-[1.85rem] font-semibold tracking-tight text-slate-950">{title}</h1>
              {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
            </div>
          ) : null}
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  )
}
