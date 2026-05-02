import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ExternalLink, Headphones, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { StoreBrandMark } from '@/components/store/StoreBrandMark'
import { getPublicStoreSettings } from '@/lib/store-branding'
import { getStoreCustomerSession } from '@/lib/customer-session'
import { getStoreSearchIndex } from '@/lib/products'
import { buildStorefrontThemeStyle, buildWhatsappUrl, getContrastingTextColor, DEFAULT_STORE_SETTINGS } from '@/lib/store-settings'
import type { HeaderNavigation } from '@/lib/store-settings'

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
  const storeWhatsapp = settingsResponse?.store_whatsapp ?? null
  const whatsappUrl = buildWhatsappUrl(storeWhatsapp)

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
        storeWhatsapp={storeWhatsapp}
      />
      {children}

      <footer className="mt-10 border-t border-slate-200 bg-white sm:mt-12">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <StoreBrandMark
              logoUrl={resolvedBranding.logoUrl}
              storeName={storeName}
              tagline="Vitrine oficial"
            />

            <div>
              <p className="text-sm font-semibold text-slate-950">Atendimento</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {whatsappUrl ? (
                  <Link
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <Headphones className="h-4 w-4" />
                    WhatsApp da loja
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </Link>
                ) : null}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Acesso administrativo
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
            © {new Date().getFullYear()} {storeName}
          </div>
        </div>
      </footer>
    </div>
  )
}
