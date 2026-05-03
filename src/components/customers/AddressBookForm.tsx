'use client'

import { useRef, useState, useCallback } from 'react'
import { CheckCircle2, Loader2, MapPin, Navigation2, Plus, Save, Star, Trash2, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { lookupCep } from '@/app/dashboard/configuracoes/cep-actions'
import type { CustomerAddress } from '@/lib/customer-addresses-shared'
import {
  createCustomerAddress,
  deleteCustomerAddress,
  setPrimaryAddress,
} from '@/lib/customer-addresses'
import { useConfirm } from '@/components/ui/feedback-provider'

function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatGpsDate(value: string | null) {
  if (!value)     return 'Ainda não capturada'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AddressBookForm({ initialAddresses }: { initialAddresses: CustomerAddress[] }) {
  const confirm = useConfirm()
  const formRef = useRef<HTMLDivElement>(null)
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isLookingUpCep, setIsLookingUpCep] = useState(false)
  const [cepLookedUp, setCepLookedUp] = useState(false)

  const [address, setAddress] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [city, setCity] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [reference, setReference] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [gpsCapturedAt, setGpsCapturedAt] = useState<string | null>(null)

  const supabase = createClient()

  function resetForm() {
    setAddress('')
    setHouseNumber('')
    setComplement('')
    setNeighborhood('')
    setZipCode('')
    setCity('')
    setStateCode('')
    setReference('')
    setLatitude(null)
    setLongitude(null)
    setGpsCapturedAt(null)
    setCepLookedUp(false)
    setMessage(null)
  }

  const handleCepLookup = useCallback(async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsLookingUpCep(true)
    try {
      const result = await lookupCep(digits)
      if (result && !result.erro) {
        if (!address) setAddress(result.logradouro)
        if (!neighborhood) setNeighborhood(result.bairro)
        if (!city) setCity(result.cidade)
        if (!stateCode) setStateCode(result.estado)
        setCepLookedUp(true)
      }
    } catch {
      // lookup failed silently; user can fill manually
    } finally {
      setIsLookingUpCep(false)
    }
  }, [address, neighborhood, city, stateCode])

  function handleZipCodeChange(value: string) {
    const formatted = formatZipCode(value)
    setZipCode(formatted)
    setCepLookedUp(false)
    const digits = formatted.replace(/\D/g, '')
    if (digits.length === 8) {
      handleCepLookup(digits)
    }
  }

  function handleAddNewAddress() {
    resetForm()
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function handleCancelForm() {
    resetForm()
    setShowForm(false)
  }

  async function handleLocate() {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocalização não suportada neste navegador.' })
      return
    }

    setIsLocating(true)
    setMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setGpsCapturedAt(new Date().toISOString())
        setIsLocating(false)
        setMessage({
          type: 'success',
          text: 'Localização capturada com sucesso. Agora revise os dados e salve.',
        })
      },
      () => {
        setIsLocating(false)
        setMessage({ type: 'error', text: 'Não foi possível capturar sua localização.' })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setIsSaving(false)
      setMessage({ type: 'error', text: 'Sessão expirada. Entre novamente.' })
      return
    }

    const shouldBePrimary = addresses.length === 0

    const result = await createCustomerAddress(authData.user.id, {
      street: address,
      number: houseNumber || null,
      complement: complement || null,
      neighborhood: neighborhood || null,
      city: city || null,
      state: stateCode || null,
      zip_code: zipCode || null,
      reference: reference || null,
      latitude,
      longitude,
      gps_captured_at: gpsCapturedAt,
      is_primary: shouldBePrimary,
    })

    setIsSaving(false)

    if (result.success && result.address) {
      setAddresses((prev) => [...prev, result.address!])
      resetForm()
      setShowForm(false)
      setMessage({ type: 'success', text: 'Endereço salvo com sucesso.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Não foi possível salvar o endereço.' })
    }
  }

  async function handleDelete(addressId: string) {
    if (deletingId) return

    const confirmed = await confirm({
      title: 'Excluir endereco?',
      description: 'Tem certeza que deseja excluir este endereco? Esta acao nao pode ser desfeita.',
      confirmLabel: 'Excluir endereco',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

    setDeletingId(addressId)
    setMessage(null)

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setDeletingId(null)
      setMessage({ type: 'error', text: 'Sessão expirada.' })
      return
    }

    const result = await deleteCustomerAddress(addressId, authData.user.id)

    if (result.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== addressId))
      setMessage({ type: 'success', text: 'Endereço excluído com sucesso.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Não foi possível excluir o endereço.' })
    }

    setDeletingId(null)
  }

  async function handleSetPrimary(addressId: string) {
    if (settingPrimaryId) return
    setSettingPrimaryId(addressId)
    setMessage(null)

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setSettingPrimaryId(null)
      setMessage({ type: 'error', text: 'Sessão expirada.' })
      return
    }

    const result = await setPrimaryAddress(addressId, authData.user.id)

    if (result.success) {
      setAddresses((prev) =>
        prev
          .map((a) => ({ ...a, is_primary: a.id === addressId }))
          .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      )
    } else {
      setMessage({ type: 'error', text: result.error || 'Não foi possível definir endereço principal.' })
    }

    setSettingPrimaryId(null)
  }

  const hasMap = latitude !== null && longitude !== null

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Endereços</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Meus endereços</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Gerencie seus endereços para facilitar o checkout e a entrega dos seus pedidos.
          </p>
        </div>

        {!showForm ? (
          <button
            type="button"
            onClick={handleAddNewAddress}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b2f6f] px-4 text-sm font-semibold text-white shadow-[0_18px_32px_-22px_rgba(11,47,111,0.85)] transition-colors hover:bg-[#0a285f]"
          >
            <Plus className="h-4 w-4" />
            Adicionar novo endereço
          </button>
        ) : null}
      </div>

      {message ? (
        <div
          className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {/* Address list */}
      {addresses.length > 0 ? (
        <div className="mt-6 space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-[1.25rem] border p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.18)] sm:p-5 ${
                addr.is_primary
                  ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {addr.is_primary ? (
                <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  <Star className="h-3 w-3 fill-white" />
                  Principal
                </span>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] lg:items-center">
                <div>
                  <h3 className="text-[1.1rem] font-semibold tracking-tight text-slate-950">
                    {addr.label || 'Endereço'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                    <p className="font-medium text-slate-800">
                      {addr.street}{addr.number ? `, ${addr.number}` : ''}
                    </p>
                    {addr.complement ? <p>{addr.complement}</p> : null}
                    <p>{[addr.neighborhood, addr.city, addr.state].filter(Boolean).join(', ')}</p>
                    {addr.zip_code ? <p>CEP {addr.zip_code}</p> : null}
                    {addr.reference ? <p>Ref.: {addr.reference}</p> : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {addr.latitude != null && addr.longitude != null ? (
                    <div className="flex items-center gap-3 rounded-[1rem] bg-slate-50 px-4 py-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0b2f6f] shadow-sm">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-900">Localização capturada</p>
                        <p className="mt-1 text-sm text-slate-500">{formatGpsDate(addr.gps_captured_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-[1rem] bg-slate-50 px-4 py-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <p className="text-sm text-slate-400">Sem localização GPS</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!addr.is_primary ? (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(addr.id)}
                        disabled={settingPrimaryId === addr.id}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {settingPrimaryId === addr.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Star className="h-3.5 w-3.5" />
                        )}
                        Definir como principal
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60 ${
                        addr.is_primary ? 'flex-1' : 'flex-1'
                      }`}
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : showForm ? null : (
        <div className="mt-6 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-500">Nenhum endereço cadastrado ainda.</p>
          <p className="mt-1 text-sm text-slate-400">Adicione seu primeiro endereço para facilitar o checkout.</p>
        </div>
      )}

      {/* Add new address form */}
      {showForm ? (
        <form onSubmit={handleSave} className="mt-6">
          <div
            ref={formRef}
            className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.18)] sm:p-5"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-[1.35rem] font-semibold tracking-tight text-slate-950">Novo endereço</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Preencha as informações do novo endereço.</p>
              </div>
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3.5">
              <label className="grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">CEP</span>
                  {isLookingUpCep ? (
                    <span className="inline-flex items-center gap-1 text-xs text-sky-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Buscando...
                    </span>
                  ) : cepLookedUp ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Endereco encontrado
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(event) => handleZipCodeChange(event.target.value)}
                  placeholder="58400-000"
                  maxLength={9}
                  className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Rua / Avenida</span>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Rua das Flores"
                  className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                />
              </label>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Número</span>
                  <input
                    required
                    type="text"
                    value={houseNumber}
                    onChange={(event) => setHouseNumber(event.target.value)}
                    placeholder="123"
                    className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Complemento</span>
                  <input
                    type="text"
                    value={complement}
                    onChange={(event) => setComplement(event.target.value)}
                    placeholder="Apartamento, bloco B"
                    className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Bairro</span>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(event) => setNeighborhood(event.target.value)}
                  placeholder="Centro"
                  className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                />
              </label>

              <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_120px]">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Cidade</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Campina Grande"
                    className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Estado</span>
                  <select
                    value={stateCode}
                    onChange={(event) => setStateCode(event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                  >
                    <option value="">UF</option>
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Referência (opcional)</span>
                <input
                  type="text"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Proximo ao mercado central"
                  className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                />
              </label>

              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Localização GPS (opcional)</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {hasMap
                        ? `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`
                        : 'Use o GPS para marcar o ponto exato da entrega.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLocate}
                    disabled={isLocating}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0b2f6f] transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation2 className="h-4 w-4" />}
                    Capturar localização
                  </button>
                </div>
              </div>

              {hasMap ? (
                <div className="overflow-hidden rounded-[1rem] border border-slate-200">
                  <iframe
                    title="Mapa do endereço"
                    width="100%"
                    height="220"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=pt-BR&z=16&output=embed`}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b2f6f] px-6 text-sm font-semibold text-white shadow-[0_18px_32px_-22px_rgba(11,47,111,0.85)] transition-colors hover:bg-[#0a285f] disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar endereço
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  )
}
