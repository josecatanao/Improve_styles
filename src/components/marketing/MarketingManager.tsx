'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, ImagePlus, Loader2, Megaphone, LayoutList, CheckCircle2, ArrowUp, ArrowDown, Link2, GripVertical, Info } from 'lucide-react'
import { removeStoreBanner, toggleStoreBanner, updateStoreBannerLink, uploadStoreBannerAction, reorderStoreBanners } from '@/app/dashboard/marketing/actions'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'

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
  hidden_home_sections?: string[]
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

function SortableLayoutItem({
  item,
  index,
  label,
  description,
  isHidden,
  isDragging,
  isFirst,
  isLast,
  onMove,
  onToggleVisibility,
}: {
  item: string
  index: number
  label: string
  description: string
  isHidden: boolean
  isDragging: boolean
  isFirst: boolean
  isLast: boolean
  onMove: (index: number, direction: 'up' | 'down') => void
  onToggleVisibility: (sectionId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 shadow-sm transition-shadow ${
        isHidden ? 'bg-slate-50 opacity-60' : 'bg-white'
      } ${isDragging ? 'shadow-lg shadow-slate-300/60 ring-2 ring-sky-200' : ''}`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
        isHidden ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-600'
      }`}>
        {index + 1}
      </div>
      <button
        type="button"
        className="mt-2 shrink-0 cursor-grab text-slate-400 active:cursor-grabbing"
        aria-label={`Reordenar ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${isHidden ? 'text-slate-400' : 'text-slate-800'}`}>{label}</p>
          {isHidden ? (
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">Oculta</span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">{description}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={() => onToggleVisibility(item)}
          className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
            isHidden
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
          }`}
          aria-label={isHidden ? `Mostrar ${label}` : `Ocultar ${label}`}
          title={isHidden ? 'Tornar visivel' : 'Ocultar secao'}
        >
          {isHidden ? 'Mostrar' : 'Ocultar'}
        </button>
        <div className="flex gap-1 justify-center">
          <button
            disabled={isFirst}
            onClick={() => onMove(index, 'up')}
            className="rounded bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
            aria-label="Mover para cima"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            disabled={isLast}
            onClick={() => onMove(index, 'down')}
            className="rounded bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
            aria-label="Mover para baixo"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SortableBannerItem({
  banner,
  isDragging,
  isUpdatingBannerId,
  isRemovingBannerId,
  isSavingBannerLinkId,
  onLinkChange,
  onSaveLink,
  onToggle,
  onRemoveClick,
}: {
  banner: StoreBanner
  isDragging: boolean
  isUpdatingBannerId: string | null
  isRemovingBannerId: string | null
  isSavingBannerLinkId: string | null
  onLinkChange: (bannerId: string, value: string) => void
  onSaveLink: (bannerId: string) => void
  onToggle: (bannerId: string, checked: boolean) => void
  onRemoveClick: (bannerId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: banner.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow ${
        isDragging ? 'shadow-lg shadow-slate-300/60 ring-2 ring-sky-200' : ''
      }`}
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <button
            type="button"
            className="absolute right-3 top-3 z-10 cursor-grab rounded-xl border border-white/70 bg-white/90 p-2 text-slate-500 shadow-sm backdrop-blur active:cursor-grabbing"
            aria-label="Reordenar banner"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="relative aspect-[3/1] min-h-[120px] w-full max-h-[184px] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image_url} alt="Banner" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  Banner principal
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                  banner.is_active
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
                }`}>
                  {banner.is_active ? 'Visivel no site' : 'Oculto'}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                  banner.link_url
                    ? 'bg-sky-50 text-sky-700 ring-sky-200'
                    : 'bg-amber-50 text-amber-700 ring-amber-200'
                }`}>
                  {banner.link_url ? 'Com link' : 'Sem link'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Arraste pelo icone sobre a imagem para ajustar a ordem de exibicao.</p>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 lg:min-w-[164px] lg:justify-center">
              <Switch
                checked={banner.is_active}
                disabled={isUpdatingBannerId === banner.id || isRemovingBannerId === banner.id}
                onCheckedChange={(checked) => onToggle(banner.id, checked)}
              />
              <span>{banner.is_active ? 'Ativo' : 'Oculto'}</span>
            </div>
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
                onChange={(e) => onLinkChange(banner.id, e.target.value)}
                disabled={isSavingBannerLinkId === banner.id}
              />
              <Button
                type="button"
                onClick={() => onSaveLink(banner.id)}
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
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Ao clicar no banner da vitrine, o cliente sera enviado para este destino.
            </p>
            <Button
              variant="ghost"
              size="sm"
              disabled={isRemovingBannerId === banner.id || isUpdatingBannerId === banner.id}
              onClick={() => onRemoveClick(banner.id)}
              className="text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              {isRemovingBannerId === banner.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Remover banner
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
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
  const confirm = useConfirm()

  const [layout, setLayout] = useState<string[]>(
    initialSettings.homepage_layout?.filter((sectionId) => availableSections.some((section) => section.id === sectionId)) ||
      availableSections.map((section) => section.id)
  )
  const [hiddenSections, setHiddenSections] = useState<string[]>(initialSettings.hidden_home_sections ?? [])
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
  const [activeLayoutItemId, setActiveLayoutItemId] = useState<string | null>(null)
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveBannerOrderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const activeBannersCount = banners.filter((banner) => banner.is_active).length
  const inactiveBannersCount = banners.length - activeBannersCount
  const announcementStatusLabel = annActive ? 'Ativa' : 'Inativa'

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
          hidden_home_sections: hiddenSections,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('store_settings').insert({
          homepage_layout: layout,
          hidden_home_sections: hiddenSections,
        })
      }

      router.refresh()
      showToast({
        variant: 'success',
        title: 'Ordem e visibilidade salvas',
        description: 'A ordem e visibilidade das secoes da pagina inicial foram atualizadas.',
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

  function toggleSectionVisibility(sectionId: string) {
    setHiddenSections((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
    )
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

  function handleLayoutDragEnd(event: DragEndEvent) {
    const { active, over } = event

    setActiveLayoutItemId(null)

    if (!over || active.id === over.id) {
      return
    }

    setLayout((current) => {
      const fromIndex = current.indexOf(String(active.id))
      const toIndex = current.indexOf(String(over.id))
      if (fromIndex === -1 || toIndex === -1) return current

      return arrayMove(current, fromIndex, toIndex)
    })
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

  async function handleConfirmRemoveBanner(bannerId: string) {
    const confirmed = await confirm({
      title: 'Remover banner?',
      description: 'Tem certeza que deseja remover este banner? Esta acao nao pode ser desfeita.',
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

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

  function scheduleBannerReorder(nextBanners: StoreBanner[]) {
    if (saveBannerOrderTimeoutRef.current) {
      clearTimeout(saveBannerOrderTimeoutRef.current)
    }

    saveBannerOrderTimeoutRef.current = setTimeout(async () => {
      try {
        await reorderStoreBanners(nextBanners.map((banner) => banner.id))
        router.refresh()
        showToast({
          variant: 'success',
          title: 'Ordem dos banners salva',
          description: 'A nova ordem de exibicao dos banners foi aplicada.',
        })
      } catch {
        showToast({
          variant: 'error',
          title: 'Erro ao salvar ordem dos banners',
          description: 'Os banners foram reordenados visualmente, mas a nova ordem nao foi salva. Tente novamente.',
        })
      }
    }, 600)
  }

  function handleBannerDragEnd(event: DragEndEvent) {
    const { active, over } = event

    setActiveBannerId(null)

    if (!over || active.id === over.id) {
      return
    }

    setBanners((current) => {
      const fromIndex = current.findIndex((banner) => banner.id === String(active.id))
      const toIndex = current.findIndex((banner) => banner.id === String(over.id))
      if (fromIndex === -1 || toIndex === -1) return current

      const next = arrayMove(current, fromIndex, toIndex)
      scheduleBannerReorder(next)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-sky-50 p-2.5 text-sky-600">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">Barra de Anuncios</CardTitle>
                  <CardDescription>
                    Controle a faixa fixa do topo para divulgar campanhas, frete, cupons ou recados importantes.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${annActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                  {announcementStatusLabel}
                </span>
                {annLink ? (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                    Com link configurado
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    Sem link
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Exibir no site</p>
                      <p className="text-xs text-slate-500">Ative quando a mensagem estiver pronta para publicacao.</p>
                    </div>
                    <Switch checked={annActive} onCheckedChange={setAnnActive} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Texto principal</label>
                    <Input
                      placeholder="Ex: Frete Gratis nas compras acima de R$ 200"
                      value={annText}
                      onChange={(e) => setAnnText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Link de redirecionamento</label>
                    <p className="text-[13px] text-slate-500">
                      Opcional. Use quando a barra precisar levar o cliente para uma categoria, promocao ou produto.
                    </p>
                    <Input
                      placeholder="Ex: /loja/promocao ou /produto/123"
                      value={annLink}
                      onChange={(e) => setAnnLink(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Cor e pre-visualizacao</label>
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
                    <p className="text-xs leading-5 text-slate-500">
                      Essa simulacao mostra o tom da faixa e ajuda a validar contraste antes de publicar.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement} className="w-full bg-[#3483fa] hover:bg-[#2968c8] sm:w-auto">
                {isSavingAnnouncement ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Salvar Barra de Anuncios
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                  <LayoutList className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">Ordem e Visibilidade das Secoes</CardTitle>
                  <CardDescription>
                    Defina a sequencia em que cada bloco aparece na vitrine e escolha quais secoes ficam visiveis. Arraste para reordenar ou use os controles laterais.
                  </CardDescription>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                O topo da lista aparece primeiro na home. Secoes marcadas como &quot;Oculta&quot; nao sao renderizadas na vitrine. Use o botao &quot;Ocultar&quot; para desativar uma secao sem remove-la da lista.
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => setActiveLayoutItemId(String(event.active.id))}
                onDragCancel={() => setActiveLayoutItemId(null)}
                onDragEnd={handleLayoutDragEnd}
              >
                <SortableContext items={layout} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2.5">
                    {layout.map((item, index) => (
                      <SortableLayoutItem
                        key={item}
                        item={item}
                        index={index}
                        label={availableSections.find((section) => section.id === item)?.label || SECTION_CONTENT[item]?.title || item}
                        description={
                          availableSections.find((section) => section.id === item)?.description ||
                          SECTION_CONTENT[item]?.description ||
                          'Sessao personalizada da pagina inicial.'
                        }
                        isHidden={hiddenSections.includes(item)}
                        isDragging={activeLayoutItemId === item}
                        isFirst={index === 0}
                        isLast={index === layout.length - 1}
                        onMove={moveLayoutItem}
                        onToggleVisibility={toggleSectionVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button onClick={handleSaveLayout} disabled={isSavingLayout} className="w-full bg-[#3483fa] hover:bg-[#2968c8] sm:w-auto">
                {isSavingLayout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Salvar Ordem e Visibilidade
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-600">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl">Banners Principais</CardTitle>
                      <CardDescription>
                        Gerencie o carrossel principal logo abaixo do cabecalho com foco em ordem, visibilidade e destino de clique.
                      </CardDescription>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Info className="h-3 w-3" />
                    Tamanho recomendado: 1200x400px. Formatos aceitos: JPG, PNG, WebP.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {activeBannersCount} ativo(s)
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {inactiveBannersCount} oculto(s)
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Biblioteca de banners</p>
                  <p className="text-xs text-slate-500">Adicione novas imagens e depois ajuste a ordem de exibicao pela alca de arraste.</p>
                </div>
                <div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleBannerUpload} />
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Adicionar Banner{isUploading ? 's' : ''}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {banners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Nenhum banner cadastrado ainda.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(event) => setActiveBannerId(String(event.active.id))}
                  onDragCancel={() => setActiveBannerId(null)}
                  onDragEnd={handleBannerDragEnd}
                >
                  <SortableContext items={banners.map((banner) => banner.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {banners.map((banner) => (
                        <SortableBannerItem
                          key={banner.id}
                          banner={banner}
                          isDragging={activeBannerId === banner.id}
                          isUpdatingBannerId={isUpdatingBannerId}
                          isRemovingBannerId={isRemovingBannerId}
                          isSavingBannerLinkId={isSavingBannerLinkId}
                          onLinkChange={(bannerId, value) =>
                            setBanners((current) =>
                              current.map((currentBanner) =>
                                currentBanner.id === bannerId
                                  ? { ...currentBanner, link_url: value }
                                  : currentBanner
                              )
                            )
                          }
                          onSaveLink={handleSaveBannerLink}
                          onToggle={handleToggleBanner}
                          onRemoveClick={handleConfirmRemoveBanner}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
