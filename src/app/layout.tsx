import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Social Commerce Hub',
  description: 'Painel administrativo para operacao de lojas e catalogos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
