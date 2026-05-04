'use client'

import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, GripVertical, Layers, Loader2 } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { saveHeaderNavigation } from '@/app/dashboard/configuracoes/actions'
import type { HeaderNavigation, HeaderNavItemId } from '@/lib/store-settings'
import { useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'

const NAV_ITEM_LABELS: Record<HeaderNavItemId, string> = {
  home: 'Início',
  categories: 'Categorias',
  promocoes: 'Promocoes',
  novidades: 'Novidades',
  mais_vendidos: 'Mais vendidos',
}

const NAV_ITEM_DESCRIPTIONS: Record<HeaderNavItemId, string> = {
  home: 'Link para a página inicial da loja. Aparece como primeiro item quando habilitado.',
  categories: 'Listagem de categorias dinâmicas da loja. Exibe as categorias gerenciadas no painel.',
  promocoes: 'Link para produtos em promoção (ordenados por menor preço).',
  novidades: 'Link para produtos mais recentes (ordenados por data de publicação).',
  mais_vendidos: 'Link para produtos mais vendidos (ordenados por popularidade).',
}

function moveItem(items: HeaderNavigation, index: number, direction: 'up' | 'down'): HeaderNavigation {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= items.length) return items
  const result = [...items]
  const [moved] = result.splice(index, 1)
  result.splice(targetIndex, 0, moved)
  return result
}

function SortableNavItem({
  item,
  index,
  isFirst,
  isLast,
  isDragging,
  onMoveUp,
  onMoveDown,
  onToggle,
}: {
  item: { id: HeaderNavItemId; enabled: boolean }
  index: number
  isFirst: boolean
  isLast: boolean
  isDragging: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-[1rem] border px-4 py-3 transition-colors ${
        isDragging
          ? 'shadow-lg shadow-slate-300/60 ring-2 ring-sky-200 z-10 border-sky-200'
          : item.enabled
            ? 'border-blue-100 bg-blue-50/50'
            : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex w-8 items-center justify-center">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
          isDragging ? 'bg-sky-100 text-sky-700' : item.enabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {index + 1}
        </span>
      </div>

      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing"
        aria-label={`Reordenar ${NAV_ITEM_LABELS[item.id]}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">
            {NAV_ITEM_LABELS[item.id]}
          </span>
          <span className="truncate text-xs text-slate-400">
            {item.id !== 'categories' ? 'Link fixo' : 'Grupo dinâmico'}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{NAV_ITEM_DESCRIPTIONS[item.id]}</p>
      </div>

      <div className="flex w-24 items-center justify-center gap-1.5">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={`Mover ${NAV_ITEM_LABELS[item.id]} para cima`}
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={`Mover ${NAV_ITEM_LABELS[item.id]} para baixo`}
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            item.enabled ? 'bg-blue-600' : 'bg-slate-200'
          }`}
          role="switch"
          aria-checked={item.enabled}
          aria-label={`${item.enabled ? 'Desabilitar' : 'Habilitar'} ${NAV_ITEM_LABELS[item.id]}`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              item.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export function StoreNavigationManager({
  initialNavigation,
}: {
  initialNavigation: HeaderNavigation
}) {
  const showToast = useToast()
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [items, setItems] = useState<HeaderNavigation>(() => {
    const existing = new Map(initialNavigation.map((item) => [item.id, item]))
    return (Object.keys(NAV_ITEM_LABELS) as HeaderNavItemId[]).map((id) => {
      const existingItem = existing.get(id)
      return existingItem ?? { id, enabled: false }
    })
  })
  const [isSaving, setIsSaving] = useState(false)
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function persistNavigation(items: HeaderNavigation) {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current)
    }

    saveDebounceRef.current = setTimeout(async () => {
      try {
        await saveHeaderNavigation(
          items.filter((item) => item.enabled || item.id === 'categories')
        )
        showToast({
          variant: 'success',
          title: 'Navegacao salva',
          description: 'A nova ordem do header foi aplicada.',
        })
      } catch {
        showToast({
          variant: 'error',
          title: 'Erro ao salvar ordem',
          description: 'A navegação foi reordenada visualmente, mas a nova ordem não foi salva. Tente novamente.',
        })
      }
    }, 600)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || active.id === over.id) return

    setItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === String(active.id))
      const toIndex = current.findIndex((item) => item.id === String(over.id))
      if (fromIndex === -1 || toIndex === -1) return current

      const next = arrayMove(current, fromIndex, toIndex)
      persistNavigation(next)
      return next
    })
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await saveHeaderNavigation(
        items.filter((item) => item.enabled || item.id === 'categories')
      )
      showToast({
        variant: 'success',
        title: 'Navegacao salva',
        description: 'A navegação do header foi atualizada.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao salvar navegação',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function toggleItem(id: HeaderNavItemId) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    )
  }

  function moveItemInList(id: HeaderNavItemId, direction: 'up' | 'down') {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id)
      if (index === -1) return current
      return moveItem(current, index, direction)
    })
  }

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950">Navegacao do header</h2>
          <p className="text-sm text-slate-500">
            Controle quais itens aparecem na navegação principal da loja. Arraste pelo ícone de alça para reordenar ou use os botões de seta.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 shrink-0 rounded-xl bg-[#2563eb] px-5 text-white hover:bg-[#1d4ed8]"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Salvar navegação
        </Button>
      </div>

      <div className="mt-5 space-y-1">
        <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-[1rem] bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span className="w-8 text-center">#</span>
          <span className="w-8"></span>
          <span>Item de navegação</span>
          <span className="w-24 text-center">Visível</span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveDragId(String(event.active.id))}
          onDragCancel={() => setActiveDragId(null)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <SortableNavItem
                key={item.id}
                item={item}
                index={index}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                isDragging={activeDragId === item.id}
                onMoveUp={() => moveItemInList(item.id, 'up')}
                onMoveDown={() => moveItemInList(item.id, 'down')}
                onToggle={() => toggleItem(item.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-sm font-medium text-blue-900">Como funciona a navegação</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-blue-700">
          <li>A ordem dos itens na lista define a ordem de exibição no header da loja.</li>
          <li>Itens desmarcados não aparecem na navegação do desktop nem do menu mobile.</li>
          <li>&quot;Categorias&quot; expande dinamicamente as categorias gerenciadas no painel de produtos.</li>
          <li>Alterações entram em vigor imediatamente após salvar.</li>
        </ul>
      </div>
    </section>
  )
}
