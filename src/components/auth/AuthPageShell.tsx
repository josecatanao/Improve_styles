import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type AuthPageShellProps = {
  children: React.ReactNode
  isStoreContext: boolean
}

export function AuthPageShell({ children, isStoreContext }: AuthPageShellProps) {
  const backHref = isStoreContext ? '/' : '/dashboard'
  const backLabel = isStoreContext ? 'Voltar para a loja' : 'Voltar para o painel'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(52,131,250,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[1.45rem] font-bold tracking-tight text-slate-950 sm:text-[1.8rem]">
              Improve Styles
            </span>
          </Link>

          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto flex max-w-xl items-center justify-center">
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  )
}
