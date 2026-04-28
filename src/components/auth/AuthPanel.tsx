'use client'

import { useState } from 'react'
import { KeyRound, Mail, UserRound } from 'lucide-react'
import { login, signup } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AuthPanelProps = {
  allowSignup?: boolean
  error?: string | string[] | undefined
  initialView: 'login' | 'signup'
  isStoreContext: boolean
  message?: string | string[] | undefined
  next: string
}

export function AuthPanel({
  allowSignup = true,
  error,
  initialView,
  isStoreContext,
  message,
  next,
}: AuthPanelProps) {
  const [view, setView] = useState<'login' | 'signup'>(initialView)
  const isSignup = view === 'signup'
  const panelTitle = isSignup
    ? isStoreContext
      ? 'Criar conta de cliente'
      : 'Criar conta administrativa'
    : isStoreContext
      ? 'Entrar na sua conta'
      : 'Acesso administrativo'
  const panelDescription = isSignup
    ? isStoreContext
      ? 'Cadastre os dados essenciais para compra, contato e entrega.'
      : 'Use esta opcao para criar o acesso inicial do painel.'
    : isStoreContext
      ? 'Use sua conta para acessar carrinho, checkout e futuras compras.'
      : 'Faça login para gerenciar catalogo, equipe e operacao da loja.'

  return (
    <Card className="mx-auto w-full border-0 bg-white/96 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80 backdrop-blur">
      <CardHeader className="space-y-5 border-b border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.94)_100%)] px-6 py-6 sm:px-7">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setView('login')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              view === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Entrar
          </button>
          {allowSignup ? (
            <button
              type="button"
              onClick={() => setView('signup')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                view === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Criar conta
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          <CardTitle className="text-[1.85rem] font-semibold tracking-tight text-slate-950">{panelTitle}</CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-500">{panelDescription}</CardDescription>
        </div>

      </CardHeader>

      {error ? (
        <div className="px-6 pt-6 sm:px-7">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
            {message || 'Ocorreu um erro no envio.'}
          </div>
        </div>
      ) : null}

      {view === 'login' ? (
        <form>
          <CardContent className="space-y-5 px-6 py-6 sm:px-7">
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="authView" value="login" />
            <input type="hidden" name="mode" value={isStoreContext ? 'customer' : 'admin'} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={isStoreContext ? 'cliente@exemplo.com' : 'admin@exemplo.com'}
                  required
                  className="h-11 rounded-xl bg-slate-50/70 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="password" name="password" type="password" required className="h-11 rounded-xl bg-slate-50/70 pl-10" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-7">
            <Button type="submit" className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-900" formAction={login}>
              Entrar
            </Button>
          </CardFooter>
        </form>
      ) : allowSignup ? (
        <form>
          <CardContent className="grid gap-5 px-6 py-6 sm:px-7">
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="authView" value="signup" />
            <input type="hidden" name="mode" value={isStoreContext ? 'customer' : 'admin'} />

            {isStoreContext ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="fullName" name="fullName" required placeholder="Nome completo" className="h-11 rounded-xl bg-slate-50/70 pl-10" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="customerEmail" name="email" type="email" required placeholder="voce@exemplo.com" className="h-11 rounded-xl bg-slate-50/70 pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" name="whatsapp" required placeholder="(00) 00000-0000" className="h-11 rounded-xl bg-slate-50/70" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Endereco de entrega</Label>
                  <textarea
                    id="deliveryAddress"
                    name="deliveryAddress"
                    required
                    rows={4}
                    placeholder="Rua, numero, bairro, cidade e complemento"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Foto (opcional)</Label>
                  <Input id="photoUrl" name="photoUrl" placeholder="https://..." className="h-11 rounded-xl bg-slate-50/70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPassword">Senha</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="customerPassword" name="password" type="password" required className="h-11 rounded-xl bg-slate-50/70 pl-10" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="adminEmail" name="email" type="email" required placeholder="admin@exemplo.com" className="h-11 rounded-xl bg-slate-50/70 pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Senha</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="adminPassword" name="password" type="password" required className="h-11 rounded-xl bg-slate-50/70 pl-10" />
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-7">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-900"
              formAction={signup}
            >
              {isStoreContext ? 'Criar conta de cliente' : 'Criar conta admin'}
            </Button>
          </CardFooter>
        </form>
      ) : null}
    </Card>
  )
}
