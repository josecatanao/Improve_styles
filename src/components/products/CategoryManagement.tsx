'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, GripVertical, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  createStoreCategory,
  moveStoreCategory,
  removeStoreCategory,
  reorderStoreCategories,
  toggleStoreCategory,
  updateStoreCategory,
  uploadStoreCategoryImageAction,
} from '@/app/dashboard/produtos/categorias/actions'
import { CATEGORY_ICON_OPTIONS } from '@/lib/category-visuals'
import type { StoreCategory } from '@/lib/store-categories'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado'
}

export function CategoryManagement({ initialCategories }: { initialCategories: StoreCategory[] }) {
  const showToast = useToast()
  const confirm = useConfirm()
  const [categories, setCategories] = useState<StoreCategory[]>(initialCategories)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIconName, setNewCategoryIconName] = useState<string>(CATEGORY_ICON_OPTIONS[0].name)
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false)
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(null)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(initialCategories[0]?.id ?? null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const newImageInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const editImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a.sort_order === b.sort_order ? a.name.localeCompare(b.name) : a.sort_order - b.sort_order
      ),
    [categories]
  )

  async function handleCreateCategory() {
    setIsCreating(true)

    try {
      const created = await createStoreCategory({
        name: newCategoryName,
        iconName: newCategoryIconName,
        imageUrl: newCategoryImageUrl,
      })
      setCategories((current) => [...current, created])
      setNewCategoryName('')
      setNewCategoryIconName(CATEGORY_ICON_OPTIONS[0].name)
      setNewCategoryImageUrl('')
      showToast({
        variant: 'success',
        title: 'Categoria criada',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao criar categoria',
        description: getErrorMessage(actionError),
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleUploadNewCategoryImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsUploadingNewImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadStoreCategoryImageAction(formData)
      setNewCategoryImageUrl(result.publicUrl)
      showToast({
        variant: 'success',
        title: 'Imagem enviada',
        description: 'A imagem da nova categoria foi carregada.',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha no upload da imagem',
        description: getErrorMessage(actionError),
      })
    } finally {
      setIsUploadingNewImage(false)
      event.target.value = ''
    }
  }

  async function handleUploadExistingCategoryImage(categoryId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploadingCategoryId(categoryId)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadStoreCategoryImageAction(formData)
      setCategories((current) =>
        current.map((item) => (item.id === categoryId ? { ...item, image_url: result.publicUrl } : item))
      )
      showToast({
        variant: 'success',
        title: 'Imagem enviada',
        description: 'A imagem da categoria foi carregada. Salve para aplicar.',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha no upload da imagem',
        description: getErrorMessage(actionError),
      })
    } finally {
      setUploadingCategoryId(null)
      event.target.value = ''
    }
  }

  async function handleToggle(categoryId: string, checked: boolean) {
    setBusyId(categoryId)

    try {
      const updated = await toggleStoreCategory(categoryId, checked)
      setCategories((current) => current.map((category) => (category.id === categoryId ? updated : category)))
      showToast({
        variant: 'success',
        title: checked ? 'Categoria ativada' : 'Categoria ocultada da vitrine',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar categoria',
        description: getErrorMessage(actionError),
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleSave(categoryId: string, category: StoreCategory) {
    setBusyId(categoryId)

    try {
      const updated = await updateStoreCategory(categoryId, {
        name: category.name,
        iconName: category.icon_name,
        imageUrl: category.image_url,
      })
      setCategories((current) => current.map((item) => (item.id === categoryId ? updated : item)))
      showToast({
        variant: 'success',
        title: 'Categoria atualizada',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar categoria',
        description: getErrorMessage(actionError),
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(categoryId: string, direction: 'up' | 'down') {
    setBusyId(categoryId)

    try {
      await moveStoreCategory(categoryId, direction)
      setCategories((current) => {
        const next = [...current]
        const currentIndex = next.findIndex((category) => category.id === categoryId)
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

        if (currentIndex === -1 || targetIndex < 0 || targetIndex >= next.length) {
          return current
        }

        const currentSortOrder = next[currentIndex].sort_order
        next[currentIndex] = { ...next[currentIndex], sort_order: next[targetIndex].sort_order }
        next[targetIndex] = { ...next[targetIndex], sort_order: currentSortOrder }
        return next
      })
      showToast({
        variant: 'success',
        title: 'Ordem das categorias atualizada',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao reordenar categorias',
        description: getErrorMessage(actionError),
      })
    } finally {
      setBusyId(null)
    }
  }

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || active.id === over.id) return

    const fromIndex = sortedCategories.findIndex((c) => c.id === String(active.id))
    const toIndex = sortedCategories.findIndex((c) => c.id === String(over.id))
    if (fromIndex === -1 || toIndex === -1) return

    const reordered = arrayMove([...sortedCategories], fromIndex, toIndex)
    const idOrder = reordered.map((c) => c.id)

    setCategories((current) =>
      current.map((category) => {
        const newIndex = idOrder.indexOf(category.id)
        if (newIndex === -1 || category.sort_order === newIndex) return category
        return { ...category, sort_order: newIndex }
      })
    )

    reorderStoreCategories(idOrder)
      .then(() => {
        showToast({ variant: 'success', title: 'Ordem salva', description: 'A nova ordem das categorias foi aplicada.' })
      })
      .catch(() => {
        showToast({ variant: 'error', title: 'Erro ao salvar ordem', description: 'As categorias foram reordenadas visualmente, mas a nova ordem nao foi salva. Tente novamente.' })
      })
  }

  async function handleRemove(categoryId: string, categoryName: string) {
    const confirmed = await confirm({
      title: 'Excluir categoria?',
      description: `A categoria "${categoryName}" sera removida e os produtos vinculados ficarao sem categoria.`,
      confirmLabel: 'Excluir categoria',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) {
      return
    }

    setBusyId(categoryId)

    try {
      await removeStoreCategory(categoryId)
      setCategories((current) => current.filter((category) => category.id !== categoryId))
      showToast({
        variant: 'success',
        title: 'Categoria removida',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao remover categoria',
        description: getErrorMessage(actionError),
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Criar categoria</CardTitle>
          <CardDescription>
            Cadastre as categorias oficiais da loja, escolha um icone padrao e, se quiser, associe uma imagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Nome</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setNewCategoryName('Feminino'); setNewCategoryIconName('heart') }}
                    className="rounded-lg border border-pink-200 bg-pink-50 px-2.5 py-1 text-[11px] font-medium text-pink-700 transition-colors hover:bg-pink-100"
                  >
                    Feminino
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewCategoryName('Masculino'); setNewCategoryIconName('shirt') }}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewCategoryName('Infantil'); setNewCategoryIconName('baby') }}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    Infantil
                  </button>
                </div>
              </div>
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Ex.: Camisas"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Imagem da categoria (opcional)</label>
              <div className="space-y-2">
                <Input
                  value={newCategoryImageUrl}
                  onChange={(event) => setNewCategoryImageUrl(event.target.value)}
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={newImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadNewCategoryImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => newImageInputRef.current?.click()}
                    disabled={isUploadingNewImage}
                  >
                    {isUploadingNewImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                    Enviar da galeria
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Biblioteca de icones</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICON_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = newCategoryIconName === option.name

                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => setNewCategoryIconName(option.name)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'border-[#3483fa] bg-blue-50 text-[#1d4ed8]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <CategoryPreview
              name={newCategoryName || 'Nova categoria'}
              iconName={newCategoryIconName}
              imageUrl={newCategoryImageUrl}
            />
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={isCreating || !newCategoryName.trim()}
              className="ml-auto bg-[#3483fa] hover:bg-[#2968c8]"
            >
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Adicionar categoria
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Categorias da loja</CardTitle>
          <CardDescription>
            Ative, renomeie, escolha o icone, adicione imagem e reordene as categorias da vitrine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedCategories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhuma categoria cadastrada ainda.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => setActiveDragId(String(event.active.id))}
              onDragCancel={() => setActiveDragId(null)}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {sortedCategories.map((category, index) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      index={index}
                      totalCount={sortedCategories.length}
                      isBusy={busyId === category.id}
                      isOpen={openCategoryId === category.id}
                      isDragging={activeDragId === category.id}
                      isUploadingImage={uploadingCategoryId === category.id}
                      onToggleOpen={() => setOpenCategoryId((current) => (current === category.id ? null : category.id))}
                      onToggle={handleToggle}
                      onMove={handleMove}
                      onSave={handleSave}
                      onRemove={handleRemove}
                      onNameChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: value } : item))}
                      onImageChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, image_url: value } : item))}
                      onIconChange={(name) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, icon_name: name } : item))}
                      onUploadImage={(event) => handleUploadExistingCategoryImage(category.id, event)}
                      editImageInputRef={editImageInputRefs}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SortableCategoryItem({
  category,
  index,
  totalCount,
  isBusy,
  isOpen,
  isDragging,
  isUploadingImage,
  onToggleOpen,
  onToggle,
  onMove,
  onSave,
  onRemove,
  onNameChange,
  onImageChange,
  onIconChange,
  onUploadImage,
  editImageInputRef,
}: {
  category: StoreCategory
  index: number
  totalCount: number
  isBusy: boolean
  isOpen: boolean
  isDragging: boolean
  isUploadingImage: boolean
  onToggleOpen: () => void
  onToggle: (categoryId: string, checked: boolean) => void
  onMove: (categoryId: string, direction: 'up' | 'down') => void
  onSave: (categoryId: string, category: StoreCategory) => void
  onRemove: (categoryId: string, categoryName: string) => void
  onNameChange: (value: string) => void
  onImageChange: (value: string) => void
  onIconChange: (name: string) => void
  onUploadImage: (event: React.ChangeEvent<HTMLInputElement>) => void
  editImageInputRef: React.MutableRefObject<Record<string, HTMLInputElement | null>>
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border bg-white shadow-sm transition-shadow ${
        isDragging ? 'shadow-lg shadow-slate-300/60 ring-2 ring-sky-200 z-10 border-sky-200' : 'border-slate-200'
      }`}
    >
      <div
        className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 cursor-pointer"
        onClick={onToggleOpen}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
          {index + 1}
        </div>
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing"
          aria-label={`Reordenar ${category.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <CategoryPreview
          name={category.name}
          iconName={category.icon_name || CATEGORY_ICON_OPTIONS[0].name}
          imageUrl={category.image_url || null}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{category.name}</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${category.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {category.is_active ? 'Ativa' : 'Oculta'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Slug da vitrine: <code>{category.slug}</code>
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen ? (
        <div className="space-y-4 border-t border-slate-200 bg-slate-50/60 px-4 py-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nome da categoria</label>
              <Input value={category.name} onChange={(event) => onNameChange(event.target.value)} disabled={isBusy} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Imagem da categoria (opcional)</label>
              <div className="space-y-2">
                <Input value={category.image_url || ''} onChange={(event) => onImageChange(event.target.value)} disabled={isBusy} placeholder="https://..." />
                <div className="flex items-center gap-2">
                  <input ref={(node) => { editImageInputRef.current[category.id] = node }} type="file" accept="image/*" className="hidden" onChange={onUploadImage} />
                  <Button type="button" variant="outline" disabled={isBusy || isUploadingImage} onClick={() => editImageInputRef.current[category.id]?.click()}>
                    {isUploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                    Enviar da galeria
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Biblioteca de icones</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICON_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = category.icon_name === option.name
                return (
                  <button
                    key={`${category.id}-${option.name}`}
                    type="button"
                    onClick={() => onIconChange(option.name)}
                    disabled={isBusy}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      isSelected ? 'border-[#3483fa] bg-blue-50 text-[#1d4ed8]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <CategoryPreview name={category.name} iconName={category.icon_name || CATEGORY_ICON_OPTIONS[0].name} imageUrl={category.image_url || null} />
            <p className="text-xs text-slate-500">Slug da vitrine: <code>{category.slug}</code></p>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-slate-600">Ativa</span>
              <Switch checked={category.is_active} disabled={isBusy} onCheckedChange={(checked) => onToggle(category.id, checked)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" disabled={isBusy || index === 0} onClick={() => onMove(category.id, 'up')}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" disabled={isBusy || index === totalCount - 1} onClick={() => onMove(category.id, 'down')}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" onClick={() => onSave(category.id, category)} disabled={isBusy || !category.name.trim()} className="bg-[#3483fa] hover:bg-[#2968c8]">
              {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={isBusy} onClick={() => onRemove(category.id, category.name)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CategoryPreview({
  name,
  iconName,
  imageUrl,
}: {
  name: string
  iconName: string
  imageUrl?: string | null
}) {
  return (
    <>
      <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          renderCategoryIcon(iconName)
        )}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">Preview da vitrine</p>
      </div>
    </>
  )
}

function renderCategoryIcon(iconName: string) {
  const match = CATEGORY_ICON_OPTIONS.find((option) => option.name === iconName) ?? CATEGORY_ICON_OPTIONS[0]
  const StaticIcon = match.icon

  return <StaticIcon className="h-5 w-5 text-slate-700" />
}
