'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, MoonStar, Palette, SunMedium, Upload, X } from 'lucide-react'
import { saveStoreAppearance, uploadStoreLogoAction } from '@/app/dashboard/configuracoes/actions'
import type { DashboardTheme, StoreSettings } from '@/lib/store-settings'
import { buildStoreBrandStyle, getContrastingTextColor } from '@/lib/store-settings'
import { useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AppearanceFormState = {
  storeName: string
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
    'store_name' | 'store_logo_url' | 'brand_primary_color' | 'brand_secondary_color' | 'dashboard_theme'
  >
  schemaReady: boolean
}) {
  const showToast = useToast()
  const [form, setForm] = useState<AppearanceFormState>({
    storeName: initialSettings.store_name,
    storeLogoUrl: initialSettings.store_logo_url ?? '',
    brandPrimaryColor: initialSettings.brand_primary_color,
    brandSecondaryColor: initialSettings.brand_secondary_color,
    dashboardTheme: initialSettings.dashboard_theme,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewLogoUrl, setPreviewLogoUrl] = useState(initialSettings.store_logo_url ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)

  const previewStyle = buildStoreBrandStyle({
    brand_primary_color: form.brandPrimaryColor,
    brand_secondary_color: form.brandSecondaryColor,
  })

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

  async function handleSave() {
    setIsSaving(true)

    try {
      let storeLogoUrl = form.storeLogoUrl

      if (logoFile) {
        const formData = new FormData()
        formData.append('file', logoFile)
        const uploadResult = await uploadStoreLogoAction(formData)
        storeLogoUrl = uploadResult.publicUrl
      }

      await saveStoreAppearance({
        ...form,
        storeLogoUrl,
      })
      setForm((current) => ({ ...current, storeLogoUrl }))
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
      setLogoFile(null)
      setPreviewLogoUrl(storeLogoUrl)
      showToast({
        variant: 'success',
        title: 'Configuracoes salvas',
        description: 'Nome, logo, cores e tema do dashboard foram atualizados.',
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

  function handleLogoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      showToast({
        variant: 'error',
        title: 'Arquivo invalido',
        description: 'Escolha uma imagem para representar a logo da loja.',
      })
      event.target.value = ''
      return
    }

    setLogoFile(file)
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
    }

    const objectUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = objectUrl
    setPreviewLogoUrl(objectUrl)
  }

  function handleRemoveLogo() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }

    setLogoFile(null)
    setForm((current) => ({ ...current, storeLogoUrl: '' }))
    setPreviewLogoUrl('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {!schemaReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          As colunas visuais ainda nao existem no banco. Rode novamente <code>supabase/04_marketing_and_reviews.sql</code> para liberar nome, logo, cores e tema.
        </div>
      ) : null}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Identidade da loja</CardTitle>
          <CardDescription>
            Escolha o nome exibido na loja e no dashboard, envie a imagem da logo e ajuste as cores principais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-5">
            <FieldGroup label="Nome da loja">
              <Input
                value={form.storeName}
                onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
                placeholder="Ex.: ImproviStyles"
              />
            </FieldGroup>

            <FieldGroup label="Logo da loja">
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-12 shrink-0 items-center justify-start overflow-hidden">
                      {previewLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewLogoUrl} alt="Preview da logo" className="block h-full w-auto max-w-[52px] object-contain object-left" />
                      ) : (
                        <Upload className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Imagem ao lado esquerdo do nome</p>
                      <p className="text-sm text-slate-500">Essa logo sera usada no dashboard e no site.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoSelection}
                    />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Enviar imagem
                    </Button>
                    {(logoFile || form.storeLogoUrl) ? (
                      <Button type="button" variant="ghost" onClick={handleRemoveLogo}>
                        <X className="mr-2 h-4 w-4" />
                        Remover logo
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
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

            <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <p className="text-sm font-semibold text-slate-900">Preview rapido</p>
              <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm" style={previewStyle}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 shrink-0 items-center justify-start overflow-hidden">
                      {previewLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewLogoUrl} alt="Logo da loja" className="block h-full w-auto max-w-[44px] object-contain object-left" />
                      ) : (
                        <Upload className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{form.storeName.trim() || 'Improve Styles'}</p>
                      <p className="text-sm text-slate-500">Logo a esquerda e nome a direita.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
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
