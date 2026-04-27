import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type ProductWorkspaceHeaderProps = {
  title: string
  description: string
}

export function ProductWorkspaceHeader({
  title,
  description,
}: ProductWorkspaceHeaderProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o dashboard
        </Link>
      </div>
    </div>
  )
}
