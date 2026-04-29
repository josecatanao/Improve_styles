import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/store/CartProvider'
import { FeedbackProvider } from '@/components/ui/feedback-provider'

export const metadata: Metadata = {
  title: 'Improve Style',
  description: 'Loja online e painel administrativo para operacao de catalogos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <FeedbackProvider>
          <CartProvider>{children}</CartProvider>
        </FeedbackProvider>
      </body>
    </html>
  )
}
