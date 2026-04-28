import Link from 'next/link'
import { CreditCard, LockKeyhole, RefreshCcw, Truck } from 'lucide-react'
import { Header } from '@/components/store/Header'

const footerColumns = [
  {
    title: 'Institucional',
    links: ['Sobre nos', 'Politica de privacidade', 'Termos de uso', 'Trocas e devolucoes'],
  },
  {
    title: 'Ajuda',
    links: ['Central de atendimento', 'Como comprar', 'Prazos de entrega', 'Formas de pagamento'],
  },
  {
    title: 'Categorias',
    links: ['Camisetas', 'Calcados', 'Acessorios', 'Ver todas'],
  },
]

export function StoreShell({
  categories,
  query,
  children,
}: {
  categories: Array<{ label: string; href: string }>
  query?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header categories={categories} query={query} />
      {children}

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-4 sm:gap-4 sm:rounded-[2rem] sm:p-5 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Parcele em ate 6x</p>
                <p className="text-sm text-slate-500">Sem juros no cartao</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
            <div>
              <Link href="/" className="text-[1.7rem] font-bold tracking-tight text-slate-950 sm:text-[2rem]">
                Style<span className="text-[#3483fa]">Store</span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
                Sua loja de moda com os melhores produtos e precos de mercado.
              </p>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-slate-950">{column.title}</p>
                <div className="mt-4 flex flex-col gap-3">
                  {column.links.map((item) => (
                    <span key={item} className="text-sm text-slate-500">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm text-slate-400 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2024 StyleStore. Todos os direitos reservados.</p>
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
