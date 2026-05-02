import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Header } from '@/components/store/Header'
import { StoreBrandMark } from '@/components/store/StoreBrandMark'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { getStoreCustomerSession } from '@/lib/customer-session'
import { getStoreSearchIndex } from '@/lib/products'
import { buildStorefrontThemeStyle, getContrastingTextColor, DEFAULT_STORE_SETTINGS } from '@/lib/store-settings'
import type { HeaderNavigation } from '@/lib/store-settings'

const footerColumns = [
  {
    title: 'Institucional',
    links: [
      { label: 'Sobre nos', href: '#institucional' },
      { label: 'Privacidade', href: '#institucional' },
      { label: 'Termos de uso', href: '#institucional' },
      { label: 'Trocas e devolucoes', href: '#entrega' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { label: 'Central de atendimento', href: '#atendimento' },
      { label: 'Como comprar', href: '/carrinho' },
      { label: 'Prazos de entrega', href: '#entrega' },
      { label: 'Formas de pagamento', href: '#pagamento' },
    ],
  },
]

export async function StoreShell({
  categories,
  query,
  branding,
  brandStyle,
  announcement,
  children,
}: {
  categories: Array<{ label: string; href: string }>
  query?: string
  branding?: {
    logoUrl?: string | null
    storeName?: string | null
  }
  brandStyle?: CSSProperties
  announcement?: {
    active: boolean
    text: string
    link: string
    backgroundColor?: string
  } | null
  children: React.ReactNode
}) {
  const [customerSession, settingsResponse, searchSuggestions] = await Promise.all([
    getStoreCustomerSession(),
    getPublicStoreSettings(),
    getStoreSearchIndex(),
  ])

  const resolvedBranding = {
    logoUrl: branding?.logoUrl ?? settingsResponse?.store_logo_url ?? null,
    storeName: branding?.storeName ?? settingsResponse?.store_name ?? 'Improve Styles',
  }
  const resolvedBrandStyle = brandStyle ?? (settingsResponse ? buildStorefrontThemeStyle(settingsResponse) : undefined)
  const resolvedAnnouncement =
    announcement ??
    (settingsResponse?.announcement_active && settingsResponse.announcement_text
      ? {
          active: settingsResponse.announcement_active,
          text: settingsResponse.announcement_text,
          link: settingsResponse.announcement_link,
          backgroundColor: settingsResponse.announcement_background_color,
        }
      : null)

  const announcementBackgroundColor = resolvedAnnouncement?.backgroundColor || '#3483fa'
  const announcementTextColor = getContrastingTextColor(announcementBackgroundColor)
  const storeName = resolvedBranding.storeName?.trim() || 'Improve Styles'
  const headerNavigation: HeaderNavigation =
    settingsResponse?.header_navigation ?? DEFAULT_STORE_SETTINGS.header_navigation

  return (
    <div className="min-h-screen bg-[#f7f8fa]" style={resolvedBrandStyle}>
      {resolvedAnnouncement?.active && resolvedAnnouncement.text ? (
        <div
          className="px-4 py-2 text-center text-sm font-medium"
          style={{ backgroundColor: announcementBackgroundColor, color: announcementTextColor }}
        >
          {resolvedAnnouncement.link ? (
            <Link href={resolvedAnnouncement.link} className="hover:underline">
              {resolvedAnnouncement.text}
            </Link>
          ) : (
            <span>{resolvedAnnouncement.text}</span>
          )}
        </div>
      ) : null}
      <Header
        branding={resolvedBranding}
        categories={categories}
        query={query}
        customerSession={customerSession}
        searchSuggestions={searchSuggestions}
        headerNavigation={headerNavigation}
      />
      {children}

      <footer className="mt-10 border-t border-slate-200 bg-white sm:mt-12">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-7 sm:gap-8 lg:mt-2 lg:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
            <div id="institucional">
              <StoreBrandMark
                logoUrl={resolvedBranding.logoUrl}
                storeName={storeName}
                tagline="Identidade oficial da vitrine"
              />
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
                Catalogo online com vitrine organizada, produtos reais e experiencia de compra objetiva.
              </p>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-slate-950">{column.title}</p>
                <div className="mt-4 flex flex-col gap-3">
                  {column.links.map((item) => (
                    <Link key={item.label} href={item.href} className="text-sm text-slate-500 transition-colors hover:text-slate-900">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div id="atendimento">
              <p className="text-sm font-semibold text-slate-950">Atendimento</p>
              <div className="mt-4 space-y-3 text-sm text-slate-500">
                <p>Use sua conta para acompanhar os dados do pedido e finalize o checkout para salvar a solicitacao neste navegador.</p>
                <Link href="/conta" className="inline-flex rounded-md border border-slate-200 px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50">
                  Abrir minha conta
                </Link>
              </div>
            </div>
          </div>

          <div
            id="pagamento"
            className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm text-slate-400 sm:mt-10 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>© 2024 {storeName}. Todos os direitos reservados.</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-500">VISA</span>
              <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-500">Mastercard</span>
              <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-500">PIX</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
