'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  createStoreCategory,
  moveStoreCategory,
  removeStoreCategory,
  toggleStoreCategory,
  updateStoreCategory,
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
              <label className="text-sm font-medium text-slate-700">Nome</label>
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Ex.: Camisas"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Imagem da categoria (opcional)</label>
              <Input
                value={newCategoryImageUrl}
                onChange={(event) => setNewCategoryImageUrl(event.target.value)}
                placeholder="https://..."
              />
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
            sortedCategories.map((category, index) => {
              const isBusy = busyId === category.id

              return (
                <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="space-y-4">
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nome da categoria</label>
                        <Input
                          value={category.name}
                          onChange={(event) =>
                            setCategories((current) =>
                              current.map((item) =>
                                item.id === category.id ? { ...item, name: event.target.value } : item
                              )
                            )
                          }
                          disabled={isBusy}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Imagem da categoria (opcional)</label>
                        <Input
                          value={category.image_url || ''}
                          onChange={(event) =>
                            setCategories((current) =>
                              current.map((item) =>
                                item.id === category.id ? { ...item, image_url: event.target.value } : item
                              )
                            )
                          }
                          disabled={isBusy}
                          placeholder="https://..."
                        />
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
                              onClick={() =>
                                setCategories((current) =>
                                  current.map((item) =>
                                    item.id === category.id ? { ...item, icon_name: option.name } : item
                                  )
                                )
                              }
                              disabled={isBusy}
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

                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <CategoryPreview
                        name={category.name}
                        iconName={category.icon_name || CATEGORY_ICON_OPTIONS[0].name}
                        imageUrl={category.image_url || null}
                      />
                      <p className="text-xs text-slate-500">Slug da vitrine: <code>{category.slug}</code></p>
                      <div className="ml-auto flex items-center gap-3">
                        <span className="text-sm text-slate-600">Ativa</span>
                        <Switch
                          checked={category.is_active}
                          disabled={isBusy}
                          onCheckedChange={(checked) => handleToggle(category.id, checked)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isBusy || index === 0}
                        onClick={() => handleMove(category.id, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isBusy || index === sortedCategories.length - 1}
                        onClick={() => handleMove(category.id, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSave(category.id, category)}
                        disabled={isBusy || !category.name.trim()}
                        className="bg-[#3483fa] hover:bg-[#2968c8]"
                      >
                        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isBusy}
                        onClick={() => handleRemove(category.id, category.name)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
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
