import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartProvider } from '@/components/store/CartProvider'
import { FeedbackProvider } from '@/components/ui/feedback-provider'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { getPublicStoreSettings } from '@/lib/store-branding'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicStoreSettings()
  const storeName = settings.store_name || 'Improve Style'
  const logoUrl = settings.store_logo_url?.trim() || null
  const faviconUrl =
    logoUrl && settings.updated_at
      ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(settings.updated_at)}`
      : logoUrl

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: 'Loja online de moda e estilo. Encontre os melhores produtos com os melhores precos.',
    icons: faviconUrl
      ? {
          icon: faviconUrl,
          shortcut: faviconUrl,
          apple: faviconUrl,
        }
      : undefined,
    openGraph: {
      title: storeName,
      description: 'Loja online de moda e estilo.',
      type: 'website',
      locale: 'pt_BR',
      ...(logoUrl ? { images: [logoUrl] } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <FeedbackProvider>
          <CartProvider>{children}</CartProvider>
        </FeedbackProvider>
      </body>
    </html>
  )
}
