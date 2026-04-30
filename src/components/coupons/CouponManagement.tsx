'use client'

import { useState } from 'react'
import { Loader2, Plus, TicketPercent, Trash2 } from 'lucide-react'
import {
  createCoupon,
  deleteCoupon,
  toggleCoupon,
  updateCoupon,
} from '@/app/dashboard/cupons/actions'
import type { StoreCoupon } from '@/lib/store-coupons'
import { formatMoney } from '@/lib/storefront'
import { useConfirm, useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const EMPTY_FORM = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_value: '',
  max_uses: '',
  expires_at: '',
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado'
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

export function CouponManagement({ initialCoupons }: { initialCoupons: StoreCoupon[] }) {
  const showToast = useToast()
  const confirm = useConfirm()
  const [coupons, setCoupons] = useState<StoreCoupon[]>(initialCoupons)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(coupon: StoreCoupon) {
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_value: String(coupon.min_order_value || ''),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
    })
    setEditingId(coupon.id)
    setShowForm(true)
  }

  async function handleCreate() {
    setIsCreating(true)
    try {
      const formData = new FormData()
      formData.append('code', form.code)
      formData.append('description', form.description)
      formData.append('discount_type', form.discount_type)
      formData.append('discount_value', form.discount_value)
      formData.append('min_order_value', form.min_order_value)
      formData.append('max_uses', form.max_uses)
      formData.append('expires_at', form.expires_at)
      const created = await createCoupon(formData)
      setCoupons((current) => [created, ...current])
      resetForm()
      showToast({ variant: 'success', title: 'Cupom criado' })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao criar cupom',
        description: getErrorMessage(actionError),
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleUpdate() {
    if (!editingId) return
    setBusyId(editingId)
    try {
      const formData = new FormData()
      formData.append('id', editingId)
      formData.append('code', form.code)
      formData.append('description', form.description)
      formData.append('discount_type', form.discount_type)
      formData.append('discount_value', form.discount_value)
      formData.append('min_order_value', form.min_order_value)
      formData.append('max_uses', form.max_uses)
      formData.append('expires_at', form.expires_at)
      const updated = await updateCoupon(formData)
      setCoupons((current) => current.map((c) => (c.id === editingId ? updated : c)))
      resetForm()
      showToast({ variant: 'success', title: 'Cupom atualizado' })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar cupom',
        description: getErrorMessage(actionError),
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggle(couponId: string, checked: boolean) {
    setBusyId(couponId)
    try {
      const updated = await toggleCoupon(couponId, checked)
      setCoupons((current) => current.map((c) => (c.id === couponId ? updated : c)))
      showToast({
        variant: 'success',
        title: checked ? 'Cupom ativado' : 'Cupom desativado',
      })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao atualizar cupom',
        description: getErrorMessage(actionError),
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(couponId: string, couponCode: string) {
    const confirmedDelete = await confirm({
      title: 'Excluir cupom?',
      description: `O cupom "${couponCode}" sera removido permanentemente.`,
      confirmLabel: 'Excluir cupom',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })
    if (!confirmedDelete) return
    setBusyId(couponId)
    try {
      await deleteCoupon(couponId)
      setCoupons((current) => current.filter((c) => c.id !== couponId))
      showToast({ variant: 'success', title: 'Cupom removido' })
    } catch (actionError) {
      showToast({
        variant: 'error',
        title: 'Falha ao remover cupom',
        description: getErrorMessage(actionError),
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cupons</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Crie e gerencie cupons de desconto para os clientes usarem no checkout.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="bg-[#3483fa] hover:bg-[#2968c8]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo cupom
        </Button>
      </div>

      {showForm ? (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">{editingId ? 'Editar cupom' : 'Novo cupom'}</CardTitle>
            <CardDescription>
              {editingId
                ? 'Altere os dados do cupom e salve.'
                : 'Preencha os dados para criar um novo cupom de desconto.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Codigo do cupom</label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="Ex.: BOASVINDAS20"
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Descricao (opcional)</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex.: Cupom de boas-vindas"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tipo de desconto</label>
                <select
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_type: e.target.value as 'percentage' | 'fixed',
                    }))
                  }
                  className="h-11 w-full rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {form.discount_type === 'percentage' ? 'Percentual de desconto' : 'Valor do desconto (R$)'}
                </label>
                <Input
                  type="number"
                  step={form.discount_type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={form.discount_type === 'percentage' ? '100' : undefined}
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'percentage' ? '20' : '50.00'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Valor minimo do pedido (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_order_value}
                  onChange={(e) => setForm((f) => ({ ...f, min_order_value: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Limite de usos (opcional)</label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Sem limite"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Validade (opcional)</label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={isCreating || !!busyId || !form.code.trim() || !form.discount_value}
                className="bg-[#3483fa] hover:bg-[#2968c8]"
              >
                {isCreating || busyId ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TicketPercent className="mr-2 h-4 w-4" />
                )}
                {editingId ? 'Salvar alteracoes' : 'Criar cupom'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Cupons cadastrados</CardTitle>
          <CardDescription>
            Gerencie os cupons de desconto disponiveis para os clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhum cupom cadastrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <th className="px-3 py-3">Codigo</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Valor</th>
                    <th className="px-3 py-3">Uso</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Validade</th>
                    <th className="px-3 py-3">Criado</th>
                    <th className="px-3 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {coupon.discount_type === 'percentage' ? 'Percentual' : 'Valor fixo'}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : formatMoney(coupon.discount_value)}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {coupon.max_uses
                          ? `${coupon.current_uses}/${coupon.max_uses}`
                          : `${coupon.current_uses} / ilimitado`}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={coupon.is_active}
                            disabled={busyId === coupon.id}
                            onCheckedChange={(checked) => handleToggle(coupon.id, checked)}
                          />
                          <span className={`text-xs font-medium ${coupon.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {coupon.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {coupon.expires_at ? (
                          <span className={new Date(coupon.expires_at) < new Date() ? 'text-red-500' : ''}>
                            {formatDate(coupon.expires_at)}
                          </span>
                        ) : (
                          'Sem validade'
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-500">{formatDate(coupon.created_at)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busyId === coupon.id}
                            onClick={() => startEdit(coupon)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={busyId === coupon.id}
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
