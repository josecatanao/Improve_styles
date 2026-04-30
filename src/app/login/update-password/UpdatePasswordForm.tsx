'use client'

import { KeyRound } from 'lucide-react'
import { updatePassword } from '@/app/login/actions'

export function UpdatePasswordForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Nova senha
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Minimo 6 caracteres"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>
      <button
        type="submit"
        formAction={updatePassword}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Atualizar senha
      </button>
    </form>
  )
}
