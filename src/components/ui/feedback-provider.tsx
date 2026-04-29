'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ToastVariant = 'success' | 'error' | 'info'

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastItem = ToastInput & {
  id: string
  variant: ToastVariant
}

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

type ConfirmState = (ConfirmOptions & {
  resolve: (value: boolean) => void
}) | null

type FeedbackContextValue = {
  toast: (input: ToastInput) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

const toastStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-white text-slate-900 shadow-[0_24px_70px_-34px_rgba(16,185,129,0.45)]',
  error: 'border-red-200 bg-white text-slate-900 shadow-[0_24px_70px_-34px_rgba(239,68,68,0.4)]',
  info: 'border-slate-200 bg-white text-slate-900 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.28)]',
}

const toastIconStyles: Record<ToastVariant, string> = {
  success: 'bg-emerald-50 text-emerald-600',
  error: 'bg-red-50 text-red-600',
  info: 'bg-slate-100 text-slate-700',
}

function getToastIcon(variant: ToastVariant) {
  if (variant === 'success') return CheckCircle2
  if (variant === 'error') return AlertTriangle
  return Info
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const pendingConfirmRef = useRef<ConfirmState>(null)

  const dismissToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID()
    const duration = input.duration ?? 3200
    const nextToast: ToastItem = {
      ...input,
      id,
      variant: input.variant ?? 'info',
    }

    setToasts((current) => [...current, nextToast])

    window.setTimeout(() => {
      setToasts((current) => current.filter((toastItem) => toastItem.id !== id))
    }, duration)
  }, [])

  const closeConfirm = useCallback((value: boolean) => {
    const current = pendingConfirmRef.current
    pendingConfirmRef.current = null
    setConfirmState(null)
    current?.resolve(value)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const nextState = { ...options, resolve }
      pendingConfirmRef.current = nextState
      setConfirmState(nextState)
    })
  }, [])

  useEffect(() => {
    if (!confirmState) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeConfirm(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [closeConfirm, confirmState])

  const value = useMemo<FeedbackContextValue>(
    () => ({
      toast,
      confirm,
    }),
    [confirm, toast]
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end sm:px-6">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toastItem) => {
            const Icon = getToastIcon(toastItem.variant)

            return (
              <div
                key={toastItem.id}
                className={cn(
                  'pointer-events-auto overflow-hidden rounded-[1.4rem] border p-4 backdrop-blur-sm',
                  toastStyles[toastItem.variant]
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                      toastIconStyles[toastItem.variant]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{toastItem.title}</p>
                    {toastItem.description ? (
                      <p className="mt-1 text-sm leading-6 text-slate-500">{toastItem.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(toastItem.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Fechar notificacao"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {confirmState ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Fechar confirmacao"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => closeConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.6)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-950">{confirmState.title}</h2>
                {confirmState.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">{confirmState.description}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => closeConfirm(false)}>
                {confirmState.cancelLabel ?? 'Cancelar'}
              </Button>
              <Button
                type="button"
                variant={confirmState.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  )
}

function useFeedback() {
  const context = useContext(FeedbackContext)

  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider.')
  }

  return context
}

export function useToast() {
  return useFeedback().toast
}

export function useConfirm() {
  return useFeedback().confirm
}
