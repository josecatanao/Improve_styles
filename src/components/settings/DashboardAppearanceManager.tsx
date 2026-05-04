'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { Loader2, MoonStar, SunMedium } from 'lucide-react'
import { saveDashboardAppearance } from '@/app/dashboard/configuracoes/actions'
import type { DashboardTheme } from '@/lib/store-settings'
import { getContrastingTextColor, normalizeHexColor } from '@/lib/store-settings'
import { useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DashboardAppearanceManager({
  initialTheme,
  initialBrandPrimaryColor,
  initialBrandSecondaryColor,
  schemaReady,
}: {
  initialTheme: DashboardTheme
  initialBrandPrimaryColor: string
  initialBrandSecondaryColor: string
  schemaReady: boolean
}) {
  const showToast = useToast()
  const [theme, setTheme] = useState<DashboardTheme>(initialTheme)
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(() => normalizeHexColor(initialBrandPrimaryColor, '#0f172a'))
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(() => normalizeHexColor(initialBrandSecondaryColor, '#e2e8f0'))
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)

    try {
      await saveDashboardAppearance({
        dashboardTheme: theme,
        brandPrimaryColor,
        brandSecondaryColor,
      })
      showToast({
        variant: 'success',
        title: 'Tema do dashboard salvo',
        description: 'A aparência do painel administrativo foi atualizada.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao salvar tema do dashboard',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {!schemaReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          As colunas visuais ainda não existem no banco. Rode novamente <code>supabase/04_marketing_and_reviews.sql</code> para liberar o tema do dashboard.
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-[1.8rem] font-semibold tracking-tight text-slate-950">Configurações do dashboard</h1>
            <p className="text-sm text-slate-500">Esse painel altera apenas a aparência do dashboard administrativo.</p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !schemaReady}
            className="h-11 rounded-xl bg-[#2563eb] px-5 text-white hover:bg-[#1d4ed8]"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar alterações
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-950">Cores do dashboard</h2>
              <p className="text-sm text-slate-500">Essas cores fazem parte do painel administrativo, não da loja pública.</p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FieldGroup label="Cor primária" infoText="É a cor principal do dashboard. Aparece em destaques, botões principais e elementos de foco do painel.">
                <ColorField value={brandPrimaryColor} onChange={setBrandPrimaryColor} />
              </FieldGroup>
              <FieldGroup label="Cor secundária" infoText="É a cor de apoio do dashboard. Aparece em superfícies suaves, estados leves e contraste complementar.">
                <ColorField value={brandSecondaryColor} onChange={setBrandSecondaryColor} />
              </FieldGroup>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-950">Tema do dashboard</h2>
              <p className="text-sm text-slate-500">Escolha como o painel administrativo deve aparecer para a equipe.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ThemeCard
                active={theme === 'light'}
                title="Claro"
                description="Superfície clara e leitura tradicional."
                icon={<SunMedium className="h-4 w-4" />}
                onClick={() => setTheme('light')}
              />
              <ThemeCard
                active={theme === 'dark'}
                title="Escuro"
                description="Painel com menor brilho e contraste mais forte."
                icon={<MoonStar className="h-4 w-4" />}
                onClick={() => setTheme('dark')}
              />
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Preview do dashboard</h2>
              <p className="mt-1 text-sm text-slate-500">Visualize rapidamente a diferença antes de salvar.</p>
            </div>

            <div className={`p-4 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <div className={`rounded-[1.25rem] border p-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Visão geral</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Resumo administrativo</p>
                  </div>
                  <span
                    className="rounded-full px-2 py-1 text-[11px] font-medium"
                    style={{
                      backgroundColor: brandSecondaryColor,
                      color: getContrastingTextColor(brandSecondaryColor),
                    }}
                  >
                    {theme === 'dark' ? 'Escuro' : 'Claro'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className={`h-20 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/80' : 'border-slate-200 bg-slate-50'}`} />
                  <div className="h-20 rounded-xl border" style={{ backgroundColor: brandPrimaryColor, borderColor: brandPrimaryColor }} />
                  <div className={`h-20 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-800/80' : 'border-slate-200 bg-slate-50'}`} />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function FieldGroup({
  label,
  infoText,
  children,
}: {
  label: string
  infoText?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {infoText ? (
          <details className="group relative">
            <summary className="list-none cursor-pointer text-slate-400 transition-colors hover:text-slate-700">
              <Info className="h-4 w-4" />
            </summary>
            <div className="absolute left-0 top-[calc(100%+0.45rem)] z-10 w-64 rounded-[1rem] border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">
              {infoText}
            </div>
          </details>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function ColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-10 w-12 rounded-lg border-0 bg-transparent p-0"
      />
      <Input value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="border-0 px-0 shadow-none focus-visible:ring-0" />
    </div>
  )
}

function ThemeCard({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${
        active
          ? 'border-blue-200 bg-blue-50 text-slate-950 shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </span>
      <span className="mt-2 block text-sm leading-6 text-slate-500">{description}</span>
    </button>
  )
}
