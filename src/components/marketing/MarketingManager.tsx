'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, ImagePlus, Loader2, Megaphone, LayoutList, CheckCircle2, ArrowUp, ArrowDown, Link2, GripVertical, Info } from 'lucide-react'
import { removeStoreBanner, toggleStoreBanner, updateStoreBannerLink, uploadStoreBannerAction, reorderStoreBanners } from '@/app/dashboard/marketing/actions'
import { useToast } from '@/components/ui/feedback-provider'

const SECTION_CONTENT: Record<string, { title: string; description: string }> = {
  banners: {
    title: 'Banners principais',
    description: 'Carrossel grande no topo da home, usado para campanhas, destaques e comunicados visuais.',
  },
  promotions: {
    title: 'Ofertas especiais',
    description: 'Bloco com produtos em promocao ou com desconto para chamar atencao logo na entrada.',
  },
  featured: {
    title: 'Produtos em destaque',
    description: 'Area para mostrar os produtos mais importantes, mais vendidos ou que voce quer empurrar primeiro.',
  },
  'category-nav': {
    title: 'Atalhos de categorias',
    description: 'Lista visual de categorias para o cliente navegar rapido pelas principais areas da loja.',
  },
}

type StoreBanner = {
  id: string
  image_url: string
  link_url: string | null
  order_index: number
  is_active: boolean
}

type StoreSettings = {
  homepage_layout?: string[]
  announcement_active?: boolean
  announcement_text?: string | null
  announcement_link?: string | null
  announcement_background_color?: string | null
}

type AvailableSection = {
  id: string
  label: string
  description?: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado'
}

export function MarketingManager({
  initialSettings,
  initialBanners,
  availableSections,
}: {
  initialSettings: StoreSettings
  initialBanners: StoreBanner[]
  availableSections: AvailableSection[]
}) {
  const router = useRouter()
  const showToast = useToast()
  const [activeTab, setActiveTab] = useState<'announcement' | 'layout' | 'banners'>('announcement')

  const [layout, setLayout] = useState<string[]>(
    initialSettings.homepage_layout?.filter((sectionId) => availableSections.some((section) => section.id === sectionId)) ||
      availableSections.map((section) => section.id)
  )
  const [annActive, setAnnActive] = useState(initialSettings.announcement_active || false)
  const [annText, setAnnText] = useState(initialSettings.announcement_text || '')
  const [annLink, setAnnLink] = useState(initialSettings.announcement_link || '')
  const [annBackgroundColor, setAnnBackgroundColor] = useState(initialSettings.announcement_background_color || '#3483fa')
  const [banners, setBanners] = useState<StoreBanner[]>(initialBanners)

  const [isSavingLayout, setIsSavingLayout] = useState(false)
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdatingBannerId, setIsUpdatingBannerId] = useState<string | null>(null)
  const [isRemovingBannerId, setIsRemovingBannerId] = useState<string | null>(null)
  const [isSavingBannerLinkId, setIsSavingBannerLinkId] = useState<string | null>(null)
  const [confirmDeleteBannerId, setConfirmDeleteBannerId] = useState<string | null>(null)
  const [draggedLayoutItem, setDraggedLayoutItem] = useState<string | null>(null)
  const [draggedBannerId, setDraggedBannerId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveBannerOrderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleSaveAnnouncement() {
    setIsSavingAnnouncement(true)
    try {
      const supabase = (await import('@/utils/supabase/client')).createClient()

      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .limit(1)
        .maybeSingle()

      if (existing) {
        await supabase.from('store_settings').update({
          announcement_active: annActive,
          announcement_text: annText || null,
          announcement_link: annLink || null,
          announcement_background_color: annBackgroundColor || '#3483fa',
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('store_settings').insert({
          announcement_active: annActive,
          announcement_text: annText || null,
          announcement_link: annLink || null,
          announcement_background_color: annBackgroundColor || '#3483fa',
        })
      }

      router.refresh()
      showToast({
        variant: 'success',
        title: 'Anuncio salvo',
        description: 'A barra de anuncios foi atualizada.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Erro ao salvar anuncio',
        description: getErrorMessage(error),
      })
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  async function handleSaveLayout() {
    setIsSavingLayout(true)
    try {
      const supabase = (await import('@/utils/supabase/client')).createClient()

      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .limit(1)
        .maybeSingle()

      if (existing) {
        await supabase.from('store_settings').update({
          homepage_layout: layout,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('store_settings').insert({
          homepage_layout: layout,
        })
      }

      router.refresh()
      showToast({
        variant: 'success',
        title: 'Ordem salva',
        description: 'A ordem das secoes da pagina inicial foi atualizada.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Erro ao salvar ordem',
        description: getErrorMessage(error),
      })
    } finally {
      setIsSavingLayout(false)
    }
  }

  function moveLayoutItem(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === layout.length - 1) return

    const newLayout = [...layout]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newLayout[index]
    newLayout[index] = newLayout[swapIndex]
    newLayout[swapIndex] = temp

    setLayout(newLayout)
  }

  function onDragStartLayout(itemId: string, event: React.DragEvent) {
    setDraggedLayoutItem(itemId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function onDragOverLayout(event: React.DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function onDropLayout(targetId: string) {
    if (!draggedLayoutItem || draggedLayoutItem === targetId) {
      setDraggedLayoutItem(null)
      return
    }

    setLayout((current) => {
      const fromIndex = current.indexOf(draggedLayoutItem)
      const toIndex = current.indexOf(targetId)
      if (fromIndex === -1 || toIndex === -1) return current

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setDraggedLayoutItem(null)
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setIsUploading(true)
    const failedFiles: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/')) {
          failedFiles.push(`${file.name} (tipo invalido)`)
          continue
        }

        try {
          const optimized = await imageCompression(file, {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 2200,
            useWebWorker: true,
          })

          const formData = new FormData()
          formData.append('file', optimized, optimized.name || file.name)
          formData.append('orderIndex', String(banners.length + i))

          const result = await uploadStoreBannerAction(formData)
          if (result.banner) {
            setBanners((current) => [...current, result.banner])
          }
        } catch {
          failedFiles.push(file.name)
        }
      }

      router.refresh()

      if (failedFiles.length > 0 && failedFiles.length < files.length) {
        showToast({
          variant: 'success',
          title: 'Banners adicionados parcialmente',
          description: `${files.length - failedFiles.length} de ${files.length} banners foram salvos. Falhas: ${failedFiles.join(', ')}`,
        })
      } else if (failedFiles.length === files.length) {
        showToast({
          variant: 'error',
          title: 'Falha no upload dos banners',
          description: 'Nenhum banner pode ser enviado.',
        })
      } else {
        showToast({
          variant: 'success',
          title: 'Banners adicionados',
          description: `${files.length} banner(s) salvo(s) na vitrine.`,
        })
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha no upload dos banners',
        description: getErrorMessage(error),
      })
    } finally {
      setIsUploading(false)
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  async function handleToggleBanner(bannerId: string, checked: boolean) {
    setIsUpdatingBannerId(bannerId)
    try {
      const result = await toggleStoreBanner(bannerId, checked)
      if (result.banner) {
        setBanners((current) =>
          current.map((banner) => (banner.id === bannerId ? { ...banner, is_active: result.banner.is_active } : banner))
        )
      }
      router.refresh()
      showToast({
        variant: 'success',
        title: checked ? 'Banner ativado' : 'Banner desativado',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar banner',
        description: getErrorMessage(error),
      })
    } finally {
      setIsUpdatingBannerId(null)
    }
  }

  async function handleRemoveBanner(bannerId: string) {
    setIsRemovingBannerId(bannerId)
    try {
      await removeStoreBanner(bannerId)
      setBanners((current) => current.filter((banner) => banner.id !== bannerId))
      router.refresh()
      showToast({
        variant: 'success',
        title: 'Banner removido',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao remover banner',
        description: getErrorMessage(error),
      })
    } finally {
      setIsRemovingBannerId(null)
      setConfirmDeleteBannerId(null)
    }
  }

  async function handleSaveBannerLink(bannerId: string) {
    const currentBanner = banners.find((banner) => banner.id === bannerId)
    if (!currentBanner) return

    setIsSavingBannerLinkId(bannerId)
    try {
      const result = await updateStoreBannerLink(bannerId, currentBanner.link_url || '')
      if (result.banner) {
        setBanners((current) => current.map((banner) => (banner.id === bannerId ? result.banner : banner)))
      }
      router.refresh()
      showToast({
        variant: 'success',
        title: 'Link do banner salvo',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao salvar link do banner',
        description: getErrorMessage(error),
      })
    } finally {
      setIsSavingBannerLinkId(null)
    }
  }

  function onDragStartBanner(bannerId: string, event: React.DragEvent) {
    setDraggedBannerId(bannerId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function onDragOverBanner(event: React.DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  async function onDropBanner(targetId: string) {
    if (!draggedBannerId || draggedBannerId === targetId) {
      setDraggedBannerId(null)
      return
    }

    setBanners((current) => {
      const fromIndex = current.findIndex((b) => b.id === draggedBannerId)
      const toIndex = current.findIndex((b) => b.id === targetId)
      if (fromIndex === -1 || toIndex === -1) return current

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })

    setDraggedBannerId(null)

    if (saveBannerOrderTimeoutRef.current) {
      clearTimeout(saveBannerOrderTimeoutRef.current)
    }

    saveBannerOrderTimeoutRef.current = setTimeout(async () => {
      try {
        const orderedIds = banners.map((b) => b.id)
        await reorderStoreBanners(orderedIds)
        router.refresh()
      } catch {
        // silent failure on reorder
      }
    }, 600)
  }

  return (
    <div className="space-y-6">

      {/* Menu de Abas */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'announcement'
              ? 'border-[#3483fa] text-[#3483fa]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Barra de Anuncios
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'layout'
              ? 'border-[#3483fa] text-[#3483fa]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutList className="h-4 w-4" />
          Ordem das Secoes
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'banners'
              ? 'border-[#3483fa] text-[#3483fa]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ImagePlus className="h-4 w-4" />
          Banners Principais
        </button>
      </div>

      <div className="max-w-2xl">
        {/* ABA 1: BARRA DE ANUNCIOS */}
        {activeTab === 'announcement' && (
          <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Barra de Anuncios</CardTitle>
              <CardDescription>
                Aquela faixa colorida que fica fixa no topo do site para dar avisos, destacar uma promocao ou cupom.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <span className="text-sm font-medium text-slate-700">Ativar Barra de Anuncios no site</span>
                <Switch checked={annActive} onCheckedChange={setAnnActive} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Texto principal da barra</label>
                <Input
                  placeholder="Ex: Frete Gratis nas compras acima de R$ 200"
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Link de Redirecionamento (Opcional)
                </label>
                <p className="text-[13px] text-slate-500">
                  Se o cliente clicar na barra, para onde ele deve ser levado? (Deixe em branco caso nao queira um link).
                </p>
                <Input
                  placeholder="Ex: /loja/promocao ou /produto/123"
                  value={annLink}
                  onChange={(e) => setAnnLink(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Cor da barra</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={annBackgroundColor}
                    onChange={(e) => setAnnBackgroundColor(e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    aria-label="Selecionar cor da barra de anuncios"
                  />
                  <Input
                    value={annBackgroundColor}
                    onChange={(e) => setAnnBackgroundColor(e.target.value)}
                    placeholder="#3483fa"
                  />
                </div>
                <div
                  className="rounded-xl px-4 py-3 text-center text-sm font-medium text-white"
                  style={{ backgroundColor: annBackgroundColor || '#3483fa' }}
                >
                  {annText || 'Pre-visualizacao da barra de anuncios'}
                </div>
              </div>
              <Button onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement} className="w-full bg-[#3483fa] hover:bg-[#2968c8]">
                {isSavingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Salvar Barra de Anuncios
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ABA 2: LAYOUT */}
        {activeTab === 'layout' && (
          <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Ordem das Secoes da Pagina Inicial</CardTitle>
              <CardDescription>
                Arraste para reordenar ou use as setinhas. A ordem que voce definir sera como os clientes verao sua vitrine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {layout.map((item, index) => (
                  <div
                    key={item}
                    draggable
                    onDragStart={(e) => onDragStartLayout(item, e)}
                    onDragOver={onDragOverLayout}
                    onDrop={() => onDropLayout(item)}
                    onDragEnd={() => setDraggedLayoutItem(null)}
                    className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow ${
                      draggedLayoutItem === item ? 'shadow-lg shadow-slate-300/60' : ''
                    }`}
                  >
                    <div className="cursor-grab text-slate-400 active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {availableSections.find((section) => section.id === item)?.label || SECTION_CONTENT[item]?.title || item}
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-slate-500">
                        {availableSections.find((section) => section.id === item)?.description ||
                          SECTION_CONTENT[item]?.description ||
                          'Sessao personalizada da pagina inicial.'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        disabled={index === 0}
                        onClick={() => moveLayoutItem(index, 'up')}
                        className="rounded bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                        aria-label="Mover para cima"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        disabled={index === layout.length - 1}
                        onClick={() => moveLayoutItem(index, 'down')}
                        className="rounded bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                        aria-label="Mover para baixo"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveLayout} disabled={isSavingLayout} className="mt-4 w-full bg-[#3483fa] hover:bg-[#2968c8]">
                {isSavingLayout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Salvar Ordem
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ABA 3: BANNERS */}
        {activeTab === 'banners' && (
          <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl">Banners Principais</CardTitle>
                <CardDescription>
                  Sao as imagens grandes do carrossel principal (logo abaixo do cabecalho).
                </CardDescription>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Info className="h-3 w-3" />
                  Tamanho recomendado: 1200x400px. Formatos aceitos: JPG, PNG, WebP.
                </p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleBannerUpload} />
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Adicionar Banner{isUploading ? 's' : ''}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {banners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Nenhum banner cadastrado ainda.
                </div>
              ) : (
                banners.map((banner) => (
                  <div
                    key={banner.id}
                    draggable
                    onDragStart={(e) => onDragStartBanner(banner.id, e)}
                    onDragOver={onDragOverBanner}
                    onDrop={() => onDropBanner(banner.id)}
                    onDragEnd={() => setDraggedBannerId(null)}
                    className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow ${
                      draggedBannerId === banner.id ? 'shadow-lg shadow-slate-300/60' : ''
                    }`}
                  >
                    <div className="aspect-[3/1] w-full bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={banner.image_url} alt="Banner" className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <GripVertical className="h-3.5 w-3.5" />
                        Arraste para reordenar
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Link2 className="h-4 w-4" />
                          Link do banner
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            placeholder="Ex: /produto/123 ou /loja/promocoes"
                            value={banner.link_url || ''}
                            onChange={(e) =>
                              setBanners((current) =>
                                current.map((currentBanner) =>
                                  currentBanner.id === banner.id
                                    ? { ...currentBanner, link_url: e.target.value }
                                    : currentBanner
                                )
                              )
                            }
                            disabled={isSavingBannerLinkId === banner.id}
                          />
                          <Button
                            type="button"
                            onClick={() => handleSaveBannerLink(banner.id)}
                            disabled={isSavingBannerLinkId === banner.id}
                            className="bg-[#3483fa] hover:bg-[#2968c8]"
                          >
                            {isSavingBannerLinkId === banner.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Salvar link
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Ao clicar no banner da vitrine, o cliente sera enviado para este destino.
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Switch
                            checked={banner.is_active}
                            disabled={isUpdatingBannerId === banner.id || isRemovingBannerId === banner.id}
                            onCheckedChange={(checked) => handleToggleBanner(banner.id, checked)}
                          />
                          <span>{banner.is_active ? 'Visivel no site' : 'Oculto'}</span>
                        </div>

                        {confirmDeleteBannerId === banner.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600">Remover?</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isRemovingBannerId === banner.id}
                              onClick={() => handleRemoveBanner(banner.id)}
                            >
                              {isRemovingBannerId === banner.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sim'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDeleteBannerId(null)}
                            >
                              Nao
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isRemovingBannerId === banner.id || isUpdatingBannerId === banner.id}
                            onClick={() => setConfirmDeleteBannerId(banner.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {isRemovingBannerId === banner.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
