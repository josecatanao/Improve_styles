import Link from 'next/link'
import { LockKeyhole, RefreshCcw, Truck } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { getStoreCustomerSession } from '@/lib/customer-session'

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
  children,
}: {
  categories: Array<{ label: string; href: string }>
  query?: string
  children: React.ReactNode
}) {
  const customerSession = await getStoreCustomerSession()

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header categories={categories} query={query} customerSession={customerSession} />
      {children}

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div
            id="entrega"
            className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-4 sm:gap-4 sm:rounded-[2rem] sm:p-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm sm:h-11 sm:w-11">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Frete gratis</p>
                <p className="text-sm text-slate-500">Acima de R$199</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Troca facil</p>
                <p className="text-sm text-slate-500">Ate 7 dias para trocar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Compra segura</p>
                <p className="text-sm text-slate-500">Seus dados protegidos</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
            <div id="institucional">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-[1.7rem] font-bold tracking-tight text-slate-950 sm:text-[2rem]">
                  Improve Styles
                </span>
              </Link>
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
                <Link href="/conta" className="inline-flex rounded-xl border border-slate-200 px-3 py-2 text-slate-700 transition-colors hover:bg-slate-50">
                  Abrir minha conta
                </Link>
              </div>
            </div>
          </div>

          <div
            id="pagamento"
            className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm text-slate-400 sm:mt-10 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>© 2024 Improve Styles. Todos os direitos reservados.</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-500">VISA</span>
              <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-500">Mastercard</span>
              <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-500">PIX</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
