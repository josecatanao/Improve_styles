'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Loader2, Plus, Search, TicketPercent, Trash2, X } from 'lucide-react'
import {
  createCoupon,
  deleteCoupon,
  getCouponDetails,
  getProductsForCoupon,
  searchProductsForCoupon,
  searchCategoriesForCoupon,
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
  discount_type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
  discount_value: '',
  min_order_value: '',
  max_uses: '',
  expires_at: '',
  product_ids: '',
  categories: '',
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado'
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
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

  async function startEdit(coupon: StoreCoupon) {
    const details = await getCouponDetails(coupon.id)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_value: String(coupon.min_order_value || ''),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
      product_ids: details.productIds.join(', '),
      categories: details.categories.join(', '),
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
      formData.append('product_ids', form.product_ids)
      formData.append('categories', form.categories)
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
      formData.append('product_ids', form.product_ids)
      formData.append('categories', form.categories)
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
        <Card className="overflow-visible border-0 shadow-sm ring-1 ring-slate-200">
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
                      discount_type: e.target.value as 'percentage' | 'fixed' | 'free_shipping',
                    }))
                  }
                  className="h-11 w-full rounded-none border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                  <option value="free_shipping">Frete gratis</option>
                </select>
              </div>
              {form.discount_type !== 'free_shipping' ? (
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
              ) : null}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Produtos</label>
                <ProductPicker
                  selectedIds={form.product_ids.split(',').map((value) => value.trim()).filter(Boolean)}
                  onChange={(ids) => setForm((f) => ({ ...f, product_ids: ids.join(',') }))}
                />
                <p className="text-xs text-slate-400">Deixe vazio para aplicar o cupom a todos os produtos.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Categorias</label>
                <CategoryPicker
                  selected={form.categories.split(',').map((value) => value.trim()).filter(Boolean)}
                  onChange={(cats) => setForm((f) => ({ ...f, categories: cats.join(',') }))}
                />
                <p className="text-xs text-slate-400">Deixe vazio para aplicar o cupom a todas as categorias.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={isCreating || !!busyId || !form.code.trim() || (form.discount_type !== 'free_shipping' && !form.discount_value)}
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
                        {coupon.discount_type === 'percentage'
                          ? 'Percentual'
                          : coupon.discount_type === 'free_shipping'
                            ? 'Frete gratis'
                            : 'Valor fixo'}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : coupon.discount_type === 'free_shipping'
                            ? '—'
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

function ProductPicker({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProducts, setSelectedProducts] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selectedIdsKey = selectedIds.join(',')

  useEffect(() => {
    let isCancelled = false
    const ids = selectedIdsKey ? selectedIdsKey.split(',').filter(Boolean) : []
    if (ids.length > 0) {
      getProductsForCoupon(ids).then((data) => {
        if (!isCancelled) {
          setSelectedProducts(data)
        }
      })
    }
    return () => {
      isCancelled = true
    }
  }, [selectedIdsKey])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open || search.length < 1) {
      if (open && search.length === 0) {
        searchProductsForCoupon('').then(setProducts)
      }
      return
    }
    const timer = setTimeout(() => {
      setLoading(true)
      searchProductsForCoupon(search).then((data) => {
        setProducts(data)
        setLoading(false)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, open])

  function toggleProduct(product: { id: string; name: string }) {
    const exists = selectedIds.includes(product.id)
    const newIds = exists ? selectedIds.filter((id) => id !== product.id) : [...selectedIds, product.id]
    const newSelected = exists
      ? selectedProducts.filter((p) => p.id !== product.id)
      : [...selectedProducts, product]
    setSelectedProducts(newSelected)
    onChange(newIds)
  }

  function removeProduct(id: string) {
    onChange(selectedIds.filter((pid) => pid !== id))
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-none border border-slate-200 bg-white px-3 text-sm text-slate-900 transition-colors hover:bg-slate-50 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        <span className={selectedIds.length > 0 ? '' : 'text-slate-400'}>
          {selectedIds.length > 0 ? `${selectedIds.length} produto(s) selecionado(s)` : 'Selecionar produtos...'}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-none border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {products.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">Nenhum produto encontrado.</p>
            ) : (
              products.map((product) => {
                const isSelected = selectedIds.includes(product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                      {isSelected ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="truncate">{product.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedProducts.length === 0 && selectedIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {id.slice(0, 8)}...
              <button type="button" onClick={() => removeProduct(id)} className="text-slate-400 hover:text-slate-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedProducts.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
              {p.name}
              <button type="button" onClick={() => removeProduct(p.id)} className="text-blue-400 hover:text-blue-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CategoryPicker({ selected, onChange }: { selected: string[]; onChange: (cats: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      searchCategoriesForCoupon().then(setCategories)
    }
  }, [open])

  function toggleCategory(cat: string) {
    const exists = selected.includes(cat)
    onChange(exists ? selected.filter((c) => c !== cat) : [...selected, cat])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-none border border-slate-200 bg-white px-3 text-sm text-slate-900 transition-colors hover:bg-slate-50 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        <span className={selected.length > 0 ? '' : 'text-slate-400'}>
          {selected.length > 0 ? `${selected.length} categoria(s) selecionada(s)` : 'Selecionar categorias...'}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-none border border-slate-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">Nenhuma categoria encontrada.</p>
            ) : (
              categories.map((cat) => {
                const isSelected = selected.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                      {isSelected ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="truncate">{cat}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
      {selected.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {selected.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
              {cat}
              <button type="button" onClick={() => toggleCategory(cat)} className="text-blue-400 hover:text-blue-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
