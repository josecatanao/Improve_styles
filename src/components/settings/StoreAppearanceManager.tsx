'use client'

import { useState } from 'react'
import { Loader2, MoonStar, Palette, SunMedium, Upload } from 'lucide-react'
import { saveStoreAppearance } from '@/app/dashboard/configuracoes/actions'
import type { DashboardTheme, StoreSettings } from '@/lib/store-settings'
import { buildStoreBrandStyle, getContrastingTextColor } from '@/lib/store-settings'
import { useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AppearanceFormState = {
  storeLogoUrl: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  dashboardTheme: DashboardTheme
}

export function StoreAppearanceManager({
  initialSettings,
  schemaReady,
}: {
  initialSettings: Pick<
    StoreSettings,
    'store_logo_url' | 'brand_primary_color' | 'brand_secondary_color' | 'dashboard_theme'
  >
  schemaReady: boolean
}) {
  const showToast = useToast()
  const [form, setForm] = useState<AppearanceFormState>({
    storeLogoUrl: initialSettings.store_logo_url ?? '',
    brandPrimaryColor: initialSettings.brand_primary_color,
    brandSecondaryColor: initialSettings.brand_secondary_color,
    dashboardTheme: initialSettings.dashboard_theme,
  })
  const [isSaving, setIsSaving] = useState(false)

  const previewStyle = buildStoreBrandStyle({
    brand_primary_color: form.brandPrimaryColor,
    brand_secondary_color: form.brandSecondaryColor,
  })

  async function handleSave() {
    setIsSaving(true)

    try {
      await saveStoreAppearance(form)
      showToast({
        variant: 'success',
        title: 'Configuracoes salvas',
        description: 'Logo, cores e tema do dashboard foram atualizados.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao salvar configuracoes',
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
          As colunas visuais ainda nao existem no banco. Rode novamente <code>supabase/04_marketing_and_reviews.sql</code> para liberar logo, cores e tema.
        </div>
      ) : null}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Identidade da loja</CardTitle>
          <CardDescription>
            Defina a logo por URL e as cores principais usadas nos botoes de maior e menor destaque.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_280px]">
            <div className="space-y-5">
              <FieldGroup label="Logo da loja">
                <Input
                  value={form.storeLogoUrl}
                  onChange={(event) => setForm((current) => ({ ...current, storeLogoUrl: event.target.value }))}
                  placeholder="https://sua-loja.com/logo.png"
                />
              </FieldGroup>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup label="Cor principal">
                  <ColorField
                    value={form.brandPrimaryColor}
                    onChange={(value) => setForm((current) => ({ ...current, brandPrimaryColor: value }))}
                  />
                </FieldGroup>

                <FieldGroup label="Cor secundaria">
                  <ColorField
                    value={form.brandSecondaryColor}
                    onChange={(value) => setForm((current) => ({ ...current, brandSecondaryColor: value }))}
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="Tema do dashboard">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ThemeCard
                    active={form.dashboardTheme === 'light'}
                    title="Claro"
                    description="Superficie clara e contraste tradicional."
                    icon={<SunMedium className="h-4 w-4" />}
                    onClick={() => setForm((current) => ({ ...current, dashboardTheme: 'light' }))}
                  />
                  <ThemeCard
                    active={form.dashboardTheme === 'dark'}
                    title="Escuro"
                    description="Painel com fundos escuros e menor brilho."
                    icon={<MoonStar className="h-4 w-4" />}
                    onClick={() => setForm((current) => ({ ...current, dashboardTheme: 'dark' }))}
                  />
                </div>
              </FieldGroup>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <p className="text-sm font-semibold text-slate-900">Preview rapido</p>
              <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm" style={previewStyle}>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {form.storeLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.storeLogoUrl} alt="Logo da loja" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sua marca</p>
                    <p className="text-sm text-slate-500">Como os botoes vao reagir</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2.5 text-sm font-medium"
                    style={{
                      backgroundColor: form.brandPrimaryColor,
                      color: getContrastingTextColor(form.brandPrimaryColor),
                    }}
                  >
                    Botao principal
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2.5 text-sm font-medium"
                    style={{
                      backgroundColor: form.brandSecondaryColor,
                      color: getContrastingTextColor(form.brandSecondaryColor),
                    }}
                  >
                    Botao secundario
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Palette className="h-4 w-4" />
                    Tema do painel: {form.dashboardTheme === 'dark' ? 'Escuro' : 'Claro'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={isSaving || !schemaReady}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar configuracoes visuais
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FieldGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
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
          ? 'border-primary bg-secondary text-slate-950 shadow-sm'
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
