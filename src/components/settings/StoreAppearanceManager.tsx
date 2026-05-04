'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronRight, ImagePlus, Info, Loader2, ShoppingCart, Upload, X } from 'lucide-react'
import { saveStoreAppearance, uploadStoreLogoAction } from '@/app/dashboard/configuracoes/actions'
import type { DashboardTheme, StoreSettings } from '@/lib/store-settings'
import { getContrastingTextColor, getContrastRatio, getWcagStatus } from '@/lib/store-settings'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type AppearanceFormState = {
  storeName: string
  storeLogoUrl: string
  storeWhatsapp: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  storeHeaderBackgroundColor: string
  storeButtonBackgroundColor: string
  storeCardBackgroundColor: string
  storeCardBorderColor: string
  storeCartButtonColor: string
  dashboardTheme: DashboardTheme
}

export function StoreAppearanceManager({
  initialSettings,
  schemaReady,
}: {
  initialSettings: Pick<
    StoreSettings,
    | 'store_name'
    | 'store_logo_url'
    | 'store_whatsapp'
    | 'brand_primary_color'
    | 'brand_secondary_color'
    | 'store_header_background_color'
    | 'store_button_background_color'
    | 'store_card_background_color'
    | 'store_card_border_color'
    | 'store_cart_button_color'
    | 'dashboard_theme'
  >
  schemaReady: boolean
}) {
  const showToast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState<AppearanceFormState>({
    storeName: initialSettings.store_name,
    storeLogoUrl: initialSettings.store_logo_url ?? '',
    storeWhatsapp: initialSettings.store_whatsapp,
    brandPrimaryColor: initialSettings.brand_primary_color,
    brandSecondaryColor: initialSettings.brand_secondary_color,
    storeHeaderBackgroundColor: initialSettings.store_header_background_color,
    storeButtonBackgroundColor: initialSettings.store_button_background_color,
    storeCardBackgroundColor: initialSettings.store_card_background_color,
    storeCardBorderColor: initialSettings.store_card_border_color,
    storeCartButtonColor: initialSettings.store_cart_button_color,
    dashboardTheme: initialSettings.dashboard_theme,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeStep, setActiveStep] = useState<'identity' | 'components' | 'review'>('identity')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewLogoUrl, setPreviewLogoUrl] = useState(initialSettings.store_logo_url ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)

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
        title: 'Configurações salvas',
        description: 'As configurações da loja foram atualizadas.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao salvar configurações',
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
        title: 'Arquivo inválido',
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

  async function handleRemoveLogo() {
    const confirmed = await confirm({
      title: 'Remover logo?',
      description: 'Tem certeza que deseja remover a logo da loja? A logo atual será excluída após salvar as alterações.',
      confirmLabel: 'Remover logo',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

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

  const brandOnWhiteRatio = getContrastRatio(form.brandPrimaryColor, '#ffffff')
  const brandOnWhiteStatus = getWcagStatus(brandOnWhiteRatio)
  const brandContrastFail = brandOnWhiteStatus === 'fail'

  const buttonOnCardRatio = getContrastRatio(form.storeButtonBackgroundColor, form.storeCardBackgroundColor)
  const buttonOnCardStatus = getWcagStatus(buttonOnCardRatio)

  return (
    <div className="space-y-6">
      {!schemaReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          As colunas visuais ainda não existem no banco. Rode novamente <code>supabase/04_marketing_and_reviews.sql</code> para liberar nome, logo, cores, tema e customização da loja.
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-950">Personalize sua loja</h1>
            <p className="text-sm text-slate-500">Deixe sua loja com a identidade da sua marca. As alterações são salvas automaticamente quando você confirmar.</p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !schemaReady}
            className="h-11 rounded-xl bg-[#2563eb] px-5 text-white hover:bg-[#1d4ed8]"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_420px]">
          <div className="space-y-5">
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex min-w-max items-center gap-2">
                <StepPill number={1} title="Identidade" active={activeStep === 'identity'} onClick={() => setActiveStep('identity')} />
                <StepPill number={2} title="Componentes" active={activeStep === 'components'} onClick={() => setActiveStep('components')} />
                <StepPill number={3} title="Revisão" active={activeStep === 'review'} onClick={() => setActiveStep('review')} />
              </div>
            </div>

            {activeStep === 'identity' ? (
              <SectionCard
                title="Identidade da loja"
                description="Defina o nome, logo e imagem da sua marca."
              >
                <FieldGroup label="Nome da loja" hint="Esse nome será exibido para seus clientes.">
                  <Input
                    value={form.storeName}
                    onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
                    placeholder="Ex.: Improve Styles"
                  />
                </FieldGroup>

                <FieldGroup label="Logo da loja">
                  <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/80 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-white ring-1 ring-slate-200">
                          {previewLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewLogoUrl} alt="Preview da logo" className="block h-full w-full object-contain p-2" />
                          ) : (
                            <Upload className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900">Logo atual</p>
                          <p className="text-xs text-slate-500">Recomendado: PNG ou SVG</p>
                          <p className="text-xs text-slate-400">Tamanho sugerido: 512x512px</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:w-[170px]">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoSelection}
                        />
                        <Button type="button" variant="outline" className="justify-start rounded-xl" onClick={() => fileInputRef.current?.click()}>
                          <ImagePlus className="mr-2 h-4 w-4" />
                          Alterar logo
                        </Button>
                        {(logoFile || form.storeLogoUrl) ? (
                          <Button type="button" variant="ghost" className="justify-start rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleRemoveLogo}>
                            <X className="mr-2 h-4 w-4" />
                            Remover
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </FieldGroup>

                <FieldGroup label="WhatsApp da loja" hint="Número que aparecerá no botão &quot;Atendimento&quot; do cabeçalho. Ex.: 5511999999999" infoText="Digite o número completo do WhatsApp com DDD e código do país, sem espaços ou traços. Exemplo: 5511999999999.">
                  <Input
                    value={form.storeWhatsapp}
                    onChange={(event) => setForm((current) => ({ ...current, storeWhatsapp: event.target.value }))}
                    placeholder="5511999999999"
                    type="tel"
                  />
                </FieldGroup>
              </SectionCard>
            ) : null}

            {activeStep === 'components' ? (
              <SectionCard
                title="Componentes da loja"
                description="Personalize cores da marca, topo, cards e botões da vitrine."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldGroup label="Cor primária da marca" infoText="Cor principal da sua identidade visual. Aparece em botões primários, destaques e links da vitrine.">
                    <ColorField
                      value={form.brandPrimaryColor}
                      onChange={(value) => setForm((current) => ({ ...current, brandPrimaryColor: value }))}
                    />
                    {brandContrastFail ? (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Contraste baixo com texto branco ({brandOnWhiteRatio.toFixed(1)}:1). Pode dificultar a leitura.
                      </p>
                    ) : null}
                  </FieldGroup>

                  <FieldGroup label="Cor secundária da marca" infoText="Cor de apoio. Aparece em elementos secundários, tags e superfícies suaves da vitrine.">
                    <ColorField
                      value={form.brandSecondaryColor}
                      onChange={(value) => setForm((current) => ({ ...current, brandSecondaryColor: value }))}
                    />
                  </FieldGroup>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldGroup label="Fundo do menu" infoText="Altera o fundo do cabeçalho superior da loja, onde ficam logo, menu e ações principais.">
                    <ColorField
                      value={form.storeHeaderBackgroundColor}
                      onChange={(value) => setForm((current) => ({ ...current, storeHeaderBackgroundColor: value }))}
                    />
                  </FieldGroup>

                  <FieldGroup label="Botão principal" infoText="Muda os botões principais de ação da vitrine, como comprar e buscar.">
                    <ColorField
                      value={form.storeButtonBackgroundColor}
                      onChange={(value) => setForm((current) => ({ ...current, storeButtonBackgroundColor: value }))}
                    />
                    {buttonOnCardStatus === 'fail' ? (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Contraste baixo com o fundo do card ({buttonOnCardRatio.toFixed(1)}:1).
                      </p>
                    ) : null}
                  </FieldGroup>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FieldGroup label="Fundo dos cards" infoText="Define a cor de fundo dos cards de produto e de alguns blocos da loja.">
                    <ColorField
                      value={form.storeCardBackgroundColor}
                      onChange={(value) => setForm((current) => ({ ...current, storeCardBackgroundColor: value }))}
                    />
                  </FieldGroup>

                  <FieldGroup label="Borda dos cards" infoText="Controla a cor das bordas dos cards e caixas de conteúdo da loja.">
                    <ColorField
                      value={form.storeCardBorderColor}
                      onChange={(value) => setForm((current) => ({ ...current, storeCardBorderColor: value }))}
                    />
                  </FieldGroup>

                  <FieldGroup label="Botão do carrinho" infoText="Muda o botão do carrinho e os destaques ligados ao acesso rápido ao carrinho.">
                    <ColorField
                      value={form.storeCartButtonColor}
                      onChange={(value) => setForm((current) => ({ ...current, storeCartButtonColor: value }))}
                    />
                  </FieldGroup>
                </div>
              </SectionCard>
            ) : null}

            {activeStep === 'review' ? (
              <SectionCard
                title="Revisão da loja"
                description="Confira os principais itens configurados antes de salvar."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <SummaryItem label="Nome da loja" value={form.storeName || 'Não definido'} />
                  <SummaryItem label="Logo" value={previewLogoUrl ? 'Configurada' : 'Sem logo'} />
                  <SummaryItem label="WhatsApp" value={form.storeWhatsapp || 'Não definido'} />
                  <SummaryItem label="Cor primaria" value={form.brandPrimaryColor} swatch={form.brandPrimaryColor} />
                  <SummaryItem label="Cor secundaria" value={form.brandSecondaryColor} swatch={form.brandSecondaryColor} />
                  <SummaryItem label="Menu" value={form.storeHeaderBackgroundColor} swatch={form.storeHeaderBackgroundColor} />
                  <SummaryItem label="Botão principal" value={form.storeButtonBackgroundColor} swatch={form.storeButtonBackgroundColor} />
                  <SummaryItem label="Card" value={form.storeCardBackgroundColor} swatch={form.storeCardBackgroundColor} />
                  <SummaryItem label="Carrinho" value={form.storeCartButtonColor} swatch={form.storeCartButtonColor} />
                </div>
              </SectionCard>
            ) : null}

            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !schemaReady}
              className="h-11 w-full rounded-xl bg-[#2563eb] px-5 text-white hover:bg-[#1d4ed8]"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Salvar alterações
            </Button>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Visualização da loja</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeStep === 'identity' ? 'Visualize nome e logo da sua marca.' : null}
                  {activeStep === 'components' ? 'Confira topo, cards e botões da vitrine.' : null}
                  {activeStep === 'review' ? 'Revise os principais elementos antes de salvar.' : null}
                </p>
              </div>

              <div className="p-4">
                {activeStep === 'identity' ? (
                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Identidade</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50">
                          {previewLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewLogoUrl} alt="Logo da loja" className="block h-full w-full object-contain p-2" />
                          ) : (
                            <Upload className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-950">{form.storeName.trim() || 'Improve Styles'}</p>
                          <p className="text-sm text-slate-500">Como sua marca aparece no topo da loja.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 px-4 py-3">
                      <p className="text-sm font-medium text-blue-900">Essa etapa altera a assinatura visual da loja.</p>
                      <p className="mt-1 text-xs text-blue-700">Nome e logo aparecem no cabeçalho, carrinho e rodapé.</p>
                    </div>
                  </div>
                ) : null}

                {activeStep === 'components' ? (
                  <div className="space-y-4">
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">Como ler este preview</p>
                      <div className="mt-2 grid gap-2 text-xs text-slate-500">
                        <p><span className="font-semibold text-slate-700">1.</span> Faixa superior: fundo do menu.</p>
                        <p><span className="font-semibold text-slate-700">2.</span> Botão &quot;Carrinho&quot;: cor do botão do carrinho.</p>
                        <p><span className="font-semibold text-slate-700">3.</span> Card do produto: fundo e borda dos cards.</p>
                        <p><span className="font-semibold text-slate-700">4.</span> Botão &quot;Comprar&quot;: botão principal da loja.</p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                      <div
                        className="relative border-b px-4 py-3"
                        style={{
                          backgroundColor: form.storeHeaderBackgroundColor,
                          borderColor: `${getContrastingTextColor(form.storeHeaderBackgroundColor)}26`,
                          color: getContrastingTextColor(form.storeHeaderBackgroundColor),
                        }}
                      >
                        <span className="absolute left-3 top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/85 px-1 text-[10px] font-bold text-slate-900">
                          1
                        </span>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/80">
                              {previewLogoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewLogoUrl} alt="Logo da loja" className="block h-full w-full object-contain p-1.5" />
                              ) : (
                                <Upload className="h-4 w-4 opacity-70" />
                              )}
                            </div>
                            <span className="truncate text-sm font-semibold">{form.storeName.trim() || 'Improve Styles'}</span>
                          </div>
                          <button
                            type="button"
                            className="relative inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium"
                            style={{
                              backgroundColor: form.storeCartButtonColor,
                              color: getContrastingTextColor(form.storeCartButtonColor),
                            }}
                          >
                            <span className="absolute -left-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">
                              2
                            </span>
                            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                            Carrinho
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div
                          className="relative rounded-[1rem] border p-3"
                          style={{
                            backgroundColor: form.storeCardBackgroundColor,
                            borderColor: form.storeCardBorderColor,
                          }}
                        >
                          <span className="absolute left-3 top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">
                            3
                          </span>
                          <div className="aspect-[4/3] rounded-[0.75rem] bg-slate-100" />
                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Camisa Preview</p>
                              <p className="text-xs text-slate-500">Produto em destaque</p>
                            </div>
                            <button
                              type="button"
                              className="relative inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium"
                              style={{
                                backgroundColor: form.storeButtonBackgroundColor,
                                color: getContrastingTextColor(form.storeButtonBackgroundColor),
                              }}
                            >
                              <span className="absolute -left-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">
                                4
                              </span>
                              Comprar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeStep === 'review' ? (
                  <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Resumo final</p>
                      <div className="mt-4 grid gap-3">
                      <ReviewLine label="Nome da loja" value={form.storeName || 'Não definido'} />
                      <ReviewLine label="Logo" value={previewLogoUrl ? 'Configurada' : 'Sem logo'} />
                      <ReviewLine label="WhatsApp" value={form.storeWhatsapp || 'Não definido'} />
                      <ReviewLine label="Cor primaria" value={form.brandPrimaryColor} />
                        <ReviewLine label="Cor secundaria" value={form.brandSecondaryColor} />
                        <ReviewLine label="Componentes" value={`${form.storeHeaderBackgroundColor} • ${form.storeButtonBackgroundColor} • ${form.storeCardBackgroundColor}`} />
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 px-4 py-3">
                      <p className="text-sm font-medium text-blue-900">Revise e salve para publicar na loja.</p>
                      <p className="mt-1 text-xs text-blue-700">Essa etapa consolida tudo que foi configurado nos passos anteriores.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function FieldGroup({
  label,
  hint,
  infoText,
  children,
}: {
  label: string
  hint?: string
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
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
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

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

function StepPill({
  number,
  title,
  active = false,
  onClick,
}: {
  number: number
  title: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {number}
      </span>
      {title}
      <ChevronRight className={`h-4 w-4 ${active ? 'text-blue-400' : 'text-slate-300'}`} />
    </button>
  )
}

function SummaryItem({
  label,
  value,
  swatch,
}: {
  label: string
  value: string
  swatch?: string
}) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {swatch ? <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: swatch }} /> : null}
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function ReviewLine({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}
