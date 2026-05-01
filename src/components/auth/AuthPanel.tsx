'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { ArrowLeft, KeyRound, Mail, UserRound } from 'lucide-react'
import { forgotPassword, login, signup } from '@/app/login/actions'
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
  success?: string | string[] | undefined
  brandStyle?: CSSProperties
}

export function AuthPanel({
  allowSignup = true,
  error,
  initialView,
  isStoreContext,
  message,
  next,
  success,
  brandStyle,
}: AuthPanelProps) {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>(initialView)
  const isForgotPassword = view === 'forgotPassword'
  const isSignup = view === 'signup'
  const panelTitle = isForgotPassword
    ? 'Recuperar senha'
    : isSignup
      ? isStoreContext
        ? 'Criar conta de cliente'
        : 'Criar conta administrativa'
      : isStoreContext
        ? 'Entrar na sua conta'
        : 'Acesso administrativo'
  const panelDescription = isForgotPassword
    ? 'Informe seu email e enviaremos um link para redefinir sua senha.'
    : isSignup
      ? isStoreContext
        ? 'Cadastre os dados essenciais para compra, contato e entrega.'
        : 'Use esta opcao para criar o acesso inicial do painel.'
      : isStoreContext
        ? 'Use sua conta para acessar carrinho, checkout e futuras compras.'
        : 'Faca login para gerenciar catalogo, equipe e operacao da loja.'

  const hasBrand = isStoreContext && brandStyle

  const primaryColor = brandStyle?.['--primary'] as string | undefined
  const buttonBg = brandStyle?.['--store-button-bg'] as string | undefined
  const buttonFg = brandStyle?.['--store-button-fg'] as string | undefined
  const cardBg = brandStyle?.['--store-card-bg'] as string | undefined
  const cardBorder = brandStyle?.['--store-card-border'] as string | undefined

  const resolvedPrimary = primaryColor || '#0f172a'
  const resolvedButtonBg = buttonBg || '#0f172a'
  const resolvedButtonFg = buttonFg || '#ffffff'
  const resolvedCardBg = cardBg || '#ffffff'

  const btnClass = hasBrand
    ? 'h-12 w-full rounded-xl font-medium transition-opacity hover:opacity-90'
    : 'h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-900'

  const toggleActiveClass = hasBrand
    ? 'rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm'
    : 'rounded-xl px-4 py-2 text-sm font-medium transition-colors bg-white text-slate-950 shadow-sm'

  const toggleInactiveClass = hasBrand
    ? 'rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:opacity-90'
    : 'rounded-xl px-4 py-2 text-sm font-medium transition-colors text-slate-500 hover:text-slate-900'

  const toggleContainerClass = hasBrand
    ? 'inline-flex items-center rounded-2xl p-1'
    : 'inline-flex items-center rounded-2xl bg-slate-100 p-1'

  const footerClass = hasBrand
    ? 'flex-col gap-3 px-6 py-5 sm:px-7'
    : 'flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-7'

  const headerClass = hasBrand
    ? 'space-y-5 px-6 py-6 sm:px-7'
    : 'space-y-5 border-b border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.94)_100%)] px-6 py-6 sm:px-7'

  const linkClass = hasBrand
    ? 'text-sm text-slate-500 transition-colors hover:opacity-90'
    : 'text-sm text-slate-500 transition-colors hover:text-slate-900'

  return (
    <Card
      className="mx-auto w-full border-0 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.45)] ring-1 backdrop-blur"
      style={{
        backgroundColor: resolvedCardBg,
        borderColor: cardBorder || undefined,
        borderTopWidth: hasBrand ? 3 : 0,
        borderTopColor: hasBrand ? resolvedPrimary : undefined,
        borderTopStyle: hasBrand ? 'solid' : undefined,
        ...((!hasBrand) ? { ringColor: 'rgb(226 232 240 / 0.8)' } : {}),
      }}
    >
      <CardHeader
        className={headerClass}
        style={
          hasBrand
            ? {
                borderBottom: cardBorder ? `1px solid ${cardBorder}` : undefined,
                background: `linear-gradient(180deg, ${resolvedCardBg} 0%, ${resolvedPrimary}08 100%)`,
              }
            : undefined
        }
      >
        <div
          className={toggleContainerClass}
          style={
            hasBrand
              ? { backgroundColor: `${resolvedPrimary}14` }
              : undefined
          }
        >
          {isForgotPassword ? (
            <button
              type="button"
              onClick={() => setView('login')}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView('login')}
                className={view === 'login' ? toggleActiveClass : toggleInactiveClass}
                style={
                  hasBrand && view === 'login'
                    ? { backgroundColor: resolvedButtonBg, color: resolvedButtonFg }
                    : hasBrand
                      ? { color: resolvedPrimary }
                      : undefined
                }
              >
                Entrar
              </button>
              {allowSignup ? (
                <button
                  type="button"
                  onClick={() => setView('signup')}
                  className={view === 'signup' ? toggleActiveClass : toggleInactiveClass}
                  style={
                    hasBrand && view === 'signup'
                      ? { backgroundColor: resolvedButtonBg, color: resolvedButtonFg }
                      : hasBrand
                        ? { color: resolvedPrimary }
                        : undefined
                  }
                >
                  Criar conta
                </button>
              ) : null}
            </>
          )}
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

      {success ? (
        <div className="px-6 pt-6 sm:px-7">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {message || 'Operacao realizada com sucesso.'}
          </div>
        </div>
      ) : null}

      {view === 'forgotPassword' ? (
        <form>
          <CardContent
            className="space-y-5 px-6 py-6 sm:px-7"
            style={
              hasBrand
                ? { borderTop: cardBorder ? `1px solid ${cardBorder}` : undefined }
                : undefined
            }
          >
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="authView" value="login" />
            <input type="hidden" name="mode" value={isStoreContext ? 'customer' : 'admin'} />
            <div className="space-y-2">
              <Label htmlFor="recoverEmail">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="recoverEmail"
                  name="email"
                  type="email"
                  placeholder={isStoreContext ? 'cliente@exemplo.com' : 'admin@exemplo.com'}
                  required
                  className="h-11 rounded-xl bg-slate-50/70 pl-10"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter
            className={footerClass}
            style={
              hasBrand
                ? { borderTop: cardBorder ? `1px solid ${cardBorder}` : undefined, background: `${resolvedPrimary}08` }
                : undefined
            }
          >
            <Button type="submit" className={btnClass} style={hasBrand ? { backgroundColor: resolvedButtonBg, color: resolvedButtonFg } : undefined} formAction={forgotPassword}>
              Enviar link de recuperacao
            </Button>
            <button
              type="button"
              onClick={() => setView('login')}
              className={linkClass}
              style={hasBrand ? { color: resolvedPrimary } : undefined}
            >
              Voltar para o login
            </button>
          </CardFooter>
        </form>
      ) : view === 'login' ? (
        <form>
          <CardContent
            className="space-y-5 px-6 py-6 sm:px-7"
            style={
              hasBrand
                ? { borderTop: cardBorder ? `1px solid ${cardBorder}` : undefined }
                : undefined
            }
          >
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
          <CardFooter
            className={footerClass}
            style={
              hasBrand
                ? { borderTop: cardBorder ? `1px solid ${cardBorder}` : undefined, background: `${resolvedPrimary}08` }
                : undefined
            }
          >
            <Button type="submit" className={btnClass} style={hasBrand ? { backgroundColor: resolvedButtonBg, color: resolvedButtonFg } : undefined} formAction={login}>
              Entrar
            </Button>
            <button
              type="button"
              onClick={() => setView('forgotPassword')}
              className={linkClass}
              style={hasBrand ? { color: resolvedPrimary } : undefined}
            >
              Esqueceu a senha?
            </button>
          </CardFooter>
        </form>
      ) : allowSignup ? (
        <form>
          <CardContent
            className="grid gap-5 px-6 py-6 sm:px-7"
            style={
              hasBrand
                ? { borderTop: cardBorder ? `1px solid ${cardBorder}` : undefined }
                : undefined
            }
          >
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
                    <Input id="whatsapp" name="whatsapp" required placeholder="(00) 00000-0000" className="h-11 rounded-xl bg-slate-50/70 pl-10" />
                  </div>
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
          <CardFooter
            className={footerClass}
            style={
              hasBrand
                ? { borderTop: cardBorder ? `1px solid ${cardBorder}` : undefined, background: `${resolvedPrimary}08` }
                : undefined
            }
          >
            <Button
              type="submit"
              className={btnClass}
              style={hasBrand ? { backgroundColor: resolvedButtonBg, color: resolvedButtonFg } : undefined}
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
