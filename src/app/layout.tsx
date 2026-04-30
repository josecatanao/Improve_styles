import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/store/CartProvider'
import { FeedbackProvider } from '@/components/ui/feedback-provider'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

export const metadata: Metadata = {
  title: {
    default: 'Improve Style',
    template: '%s | Improve Style',
  },
  description: 'Loja online de moda e estilo. Encontre os melhores produtos com os melhores preços.',
  openGraph: {
    title: 'Improve Style',
    description: 'Loja online de moda e estilo.',
    type: 'website',
    locale: 'pt_BR',
  },
  robots: {
    index: true,
    follow: true,
  },
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
