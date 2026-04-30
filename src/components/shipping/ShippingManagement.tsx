'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import {
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  toggleShippingZone,
} from '@/app/dashboard/entrega/actions'
import type { ShippingZone } from '@/lib/shipping'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado'
}

type ShippingManagementProps = {
  initialZones: ShippingZone[]
}

export function ShippingManagement({ initialZones }: ShippingManagementProps) {
  const router = useRouter()
  const showToast = useToast()
  const confirm = useConfirm()
  const [zones, setZones] = useState<ShippingZone[]>(initialZones)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editZoneId, setEditZoneId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  function resetForm() {
    setEditZoneId(null)
    setShowNewForm(false)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createShippingZone(formData)
      e.currentTarget.reset()
      resetForm()
      router.refresh()
      showToast({ variant: 'success', title: 'Zona de entrega criada' })
    } catch (error) {
      showToast({ variant: 'error', title: 'Falha ao criar zona', description: getErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editZoneId) return
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      await updateShippingZone(editZoneId, formData)
      e.currentTarget.reset()
      resetForm()
      router.refresh()
      showToast({ variant: 'success', title: 'Zona de entrega atualizada' })
    } catch (error) {
      showToast({ variant: 'error', title: 'Falha ao atualizar zona', description: getErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(zoneId: string) {
    const confirmed = await confirm({
      title: 'Excluir zona de entrega?',
      description: 'Essa exclusao e definitiva e nao pode ser desfeita.',
      confirmLabel: 'Excluir zona',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })
    if (!confirmed) return

    setDeletingId(zoneId)
    try {
      await deleteShippingZone(zoneId)
      router.refresh()
      showToast({ variant: 'success', title: 'Zona de entrega excluida' })
    } catch (error) {
      showToast({ variant: 'error', title: 'Falha ao excluir zona', description: getErrorMessage(error) })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggle(zoneId: string, isActive: boolean) {
    setTogglingId(zoneId)
    try {
      await toggleShippingZone(zoneId, !isActive)
      setZones((current) =>
        current.map((z) => (z.id === zoneId ? { ...z, is_active: !isActive } : z))
      )
      router.refresh()
      showToast({
        variant: 'success',
        title: isActive ? 'Zona desativada' : 'Zona ativada',
      })
    } catch (error) {
      showToast({ variant: 'error', title: 'Falha ao alterar zona', description: getErrorMessage(error) })
    } finally {
      setTogglingId(null)
    }
  }

  const editingZone = editZoneId ? zones.find((z) => z.id === editZoneId) : null

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Zonas de entrega</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada zona define uma faixa de CEP, o preco base do frete e o prazo estimado.
            </p>
          </div>
          {!showNewForm ? (
            <button
              type="button"
              onClick={() => { setShowNewForm(true); setEditZoneId(null) }}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--store-button-bg)] px-4 py-2.5 text-sm font-medium text-[var(--store-button-fg)] transition-colors hover:opacity-90"
              style={{ backgroundColor: '#3483fa', color: '#fff' }}
            >
              <Plus className="h-4 w-4" />
              Nova zona
            </button>
          ) : null}
        </div>

        {(showNewForm || editZoneId) ? (
          <form
            onSubmit={editZoneId ? handleUpdate : handleCreate}
            className="border-b border-slate-100 bg-slate-50 px-6 py-5"
          >
            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              {editZoneId ? 'Editar zona de entrega' : 'Nova zona de entrega'}
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">Nome da zona</span>
                <input
                  name="name"
                  required
                  defaultValue={editingZone?.name || ''}
                  placeholder="Ex: Regiao Central"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">CEP inicial</span>
                <input
                  name="zip_code_start"
                  required
                  defaultValue={editingZone?.zip_code_start || ''}
                  placeholder="01000-000"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">CEP final</span>
                <input
                  name="zip_code_end"
                  required
                  defaultValue={editingZone?.zip_code_end || ''}
                  placeholder="19999-999"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">Preco base (R$)</span>
                <input
                  name="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={editingZone?.base_price || 0}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">Preco por km (R$)</span>
                <input
                  name="price_per_km"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingZone?.price_per_km || ''}
                  placeholder="Opcional"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">Prazo estimado (dias)</span>
                <input
                  name="estimated_days"
                  type="number"
                  min="1"
                  required
                  defaultValue={editingZone?.estimated_days || 7}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-slate-600">Frete gratis acima de (R$)</span>
                <input
                  name="free_shipping_threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingZone?.free_shipping_threshold || ''}
                  placeholder="Opcional"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3483fa] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2968c8] disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editZoneId ? 'Salvar alteracoes' : 'Criar zona'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {zones.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Nenhuma zona de entrega cadastrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Faixa de CEP</th>
                  <th className="px-6 py-3">Preco base</th>
                  <th className="px-6 py-3">Prazo</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zones.map((zone) => (
                  <tr key={zone.id} className="align-top">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{zone.name}</p>
                      {zone.free_shipping_threshold ? (
                        <p className="mt-1 text-xs text-emerald-600">
                          Frete gratis a partir de {formatCurrency(zone.free_shipping_threshold)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {zone.zip_code_start} ate {zone.zip_code_end}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {formatCurrency(zone.base_price)}
                      {zone.price_per_km ? (
                        <span className="block text-xs font-normal text-slate-500">
                          + {formatCurrency(zone.price_per_km)}/km
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {zone.estimated_days} dias uteis
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggle(zone.id, zone.is_active)}
                        disabled={togglingId === zone.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          zone.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {togglingId === zone.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : zone.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {zone.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditZoneId(zone.id); setShowNewForm(false) }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Editar zona"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(zone.id)}
                          disabled={deletingId === zone.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Excluir zona"
                        >
                          {deletingId === zone.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
