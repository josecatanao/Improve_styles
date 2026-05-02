'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, Loader2, Layers } from 'lucide-react'
import { saveHeaderNavigation } from '@/app/dashboard/configuracoes/actions'
import type { HeaderNavigation, HeaderNavItemId } from '@/lib/store-settings'
import { useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'

const NAV_ITEM_LABELS: Record<HeaderNavItemId, string> = {
  home: 'Inicio',
  categories: 'Categorias',
  promocoes: 'Promocoes',
  novidades: 'Novidades',
  mais_vendidos: 'Mais vendidos',
}

const NAV_ITEM_DESCRIPTIONS: Record<HeaderNavItemId, string> = {
  home: 'Link para a pagina inicial da loja. Aparece como primeiro item quando habilitado.',
  categories: 'Listagem de categorias dinamicas da loja. Exibe as categorias gerenciadas no painel.',
  promocoes: 'Link para produtos em promocao (ordenados por menor preco).',
  novidades: 'Link para produtos mais recentes (ordenados por data de publicacao).',
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

export function StoreNavigationManager({
  initialNavigation,
}: {
  initialNavigation: HeaderNavigation
}) {
  const showToast = useToast()
  const [items, setItems] = useState<HeaderNavigation>(() => {
    const existing = new Map(initialNavigation.map((item) => [item.id, item]))
    return (Object.keys(NAV_ITEM_LABELS) as HeaderNavItemId[]).map((id) => {
      const existingItem = existing.get(id)
      return existingItem ?? { id, enabled: false }
    })
  })
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await saveHeaderNavigation(
        items.filter((item) => item.enabled || item.id === 'categories')
      )
      showToast({
        variant: 'success',
        title: 'Navegacao salva',
        description: 'A navegacao do header foi atualizada.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao salvar navegacao',
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
            Controle quais itens aparecem na navegacao principal da loja, em que ordem e quais ficam ocultos.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 shrink-0 rounded-xl bg-[#2563eb] px-5 text-white hover:bg-[#1d4ed8]"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Salvar navegacao
        </Button>
      </div>

      <div className="mt-5 space-y-1">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1rem] bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span className="w-12 text-center">Ordem</span>
          <span>Item de navegacao</span>
          <span className="w-24 text-center">Visivel</span>
        </div>

        {items.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === items.length - 1
          const description = NAV_ITEM_DESCRIPTIONS[item.id]

          return (
            <div
              key={item.id}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1rem] border px-4 py-3 transition-colors ${
                item.enabled
                  ? 'border-blue-100 bg-blue-50/50'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex w-12 flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => moveItemInList(item.id, 'up')}
                  disabled={isFirst}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label={`Mover ${NAV_ITEM_LABELS[item.id]} para cima`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItemInList(item.id, 'down')}
                  disabled={isLast}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label={`Mover ${NAV_ITEM_LABELS[item.id]} para baixo`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800">
                    {NAV_ITEM_LABELS[item.id]}
                  </span>
                  <span className="truncate text-xs text-slate-400">
                    {item.id !== 'categories' ? 'Link fixo' : 'Grupo dinamico'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
              </div>

              <div className="flex w-24 justify-center">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
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
        })}
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-sm font-medium text-blue-900">Como funciona a navegacao</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-blue-700">
          <li>A ordem dos itens na lista define a ordem de exibicao no header da loja.</li>
          <li>Itens desmarcados nao aparecem na navegacao do desktop nem do menu mobile.</li>
          <li>&quot;Categorias&quot; expande dinamicamente as categorias gerenciadas no painel de produtos.</li>
          <li>Alteracoes entram em vigor imediatamente apos salvar.</li>
        </ul>
      </div>
    </section>
  )
}
