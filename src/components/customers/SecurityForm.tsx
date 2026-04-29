'use client'

import { useState } from 'react'
import { Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Confirme sua senha atual para continuar.' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'A confirmação da nova senha não confere.' })
      return
    }

    setIsSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      setIsSaving(false)
      setMessage({ type: 'error', text: 'Sessão expirada. Entre novamente.' })
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setIsSaving(false)
      setMessage({ type: 'error', text: 'A senha atual informada está incorreta.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setIsSaving(false)
    if (error) {
      setMessage({ type: 'error', text: error.message || 'Não foi possível atualizar a senha.' })
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage({ type: 'success', text: 'Senha atualizada com sucesso.' })
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Segurança</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Atualize sua senha</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Mantenha sua conta protegida com uma senha forte e diferente das usadas em outros serviços.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Senha atual</span>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            placeholder="Confirme sua senha atual"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Nova senha</span>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            placeholder="Digite a nova senha"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Confirmar nova senha</span>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            placeholder="Repita a nova senha"
          />
        </label>

        {message ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            Atualizar senha
          </button>
        </div>
      </form>
    </section>
  )
}
