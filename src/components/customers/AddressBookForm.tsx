'use client'

import { useRef, useState } from 'react'
import { Info, Loader2, MapPin, Navigation2, Plus, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { AccountProfile } from '@/lib/account'

function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatGpsDate(value: string | null) {
  if (!value) return 'Ainda não capturada'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function buildLegacyAddress(params: {
  address: string
  houseNumber: string
  complement: string
  neighborhood: string
  zipCode: string
  city: string
  stateCode: string
  reference: string
}) {
  const line1 = [params.address.trim(), params.houseNumber.trim()].filter(Boolean).join(', ')
  const line2 = [params.complement.trim(), params.neighborhood.trim()].filter(Boolean).join(' - ')
  const line3 = [params.city.trim(), params.stateCode.trim(), params.zipCode.trim()].filter(Boolean).join(' • ')
  const line4 = params.reference.trim() ? `Referência: ${params.reference.trim()}` : ''

  return [line1, line2, line3, line4].filter(Boolean).join('\n')
}

export function AddressBookForm({ initialProfile }: { initialProfile: AccountProfile | null }) {
  const formRef = useRef<HTMLDivElement>(null)
  const [address, setAddress] = useState(initialProfile?.delivery_address ?? '')
  const [houseNumber, setHouseNumber] = useState(initialProfile?.delivery_house_number ?? '')
  const [complement, setComplement] = useState(initialProfile?.delivery_complement ?? '')
  const [neighborhood, setNeighborhood] = useState(initialProfile?.delivery_neighborhood ?? '')
  const [zipCode, setZipCode] = useState(initialProfile?.delivery_zip_code ?? '')
  const [city, setCity] = useState(initialProfile?.delivery_city ?? '')
  const [stateCode, setStateCode] = useState(initialProfile?.delivery_state ?? '')
  const [reference, setReference] = useState(initialProfile?.delivery_reference ?? '')
  const [latitude, setLatitude] = useState<number | null>(initialProfile?.delivery_lat ?? null)
  const [longitude, setLongitude] = useState<number | null>(initialProfile?.delivery_lng ?? null)
  const [gpsCapturedAt, setGpsCapturedAt] = useState(initialProfile?.delivery_gps_captured_at ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const hasMap = latitude !== null && longitude !== null
  const hasAddress = Boolean(address.trim() || houseNumber.trim() || neighborhood.trim() || city.trim())

  function handleAddNewAddress() {
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
    setMessage(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

    const fullPayload = {
      delivery_address: address.trim() || null,
      delivery_house_number: houseNumber.trim() || null,
      delivery_complement: complement.trim() || null,
      delivery_neighborhood: neighborhood.trim() || null,
      delivery_zip_code: zipCode.trim() || null,
      delivery_city: city.trim() || null,
      delivery_state: stateCode.trim() || null,
      delivery_reference: reference.trim() || null,
      delivery_gps_captured_at: gpsCapturedAt,
      delivery_lat: latitude,
      delivery_lng: longitude,
    }

    const { error: fullError } = await supabase
      .from('customer_profiles')
      .update(fullPayload)
      .eq('id', authData.user.id)

    if (!fullError) {
      setIsSaving(false)
      setMessage({ type: 'success', text: 'Endereço salvo com sucesso.' })
      return
    }

    const legacyAddress = buildLegacyAddress({
      address,
      houseNumber,
      complement,
      neighborhood,
      zipCode,
      city,
      stateCode,
      reference,
    })

    const { error: fallbackError } = await supabase
      .from('customer_profiles')
      .update({
        delivery_address: legacyAddress || null,
        delivery_lat: latitude,
        delivery_lng: longitude,
      })
      .eq('id', authData.user.id)

    setIsSaving(false)

    if (fallbackError) {
      setMessage({ type: 'error', text: 'Não foi possível salvar o endereço.' })
      return
    }

    setMessage({
      type: 'success',
      text: 'Endereço salvo. Os campos extras serão persistidos integralmente após atualizar o banco.',
    })
  }

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

        <button
          type="button"
          onClick={handleAddNewAddress}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b2f6f] px-4 text-sm font-semibold text-white shadow-[0_18px_32px_-22px_rgba(11,47,111,0.85)] transition-colors hover:bg-[#0a285f]"
        >
          <Plus className="h-4 w-4" />
          Adicionar novo endereço
        </button>
      </div>

      {hasAddress ? (
        <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.18)] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">Endereço padrão</h3>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Padrão
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-800">{`${address}${houseNumber ? `, ${houseNumber}` : ''}`}</p>
                <p>{[neighborhood, city, stateCode].filter(Boolean).join(', ')}</p>
                {zipCode ? <p>CEP {zipCode}</p> : null}
                {reference ? <p>Referência: {reference}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1rem] bg-slate-50 px-4 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0b2f6f] shadow-sm">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">Localização atual</p>
                <p className="mt-1 text-sm text-slate-500">{formatGpsDate(gpsCapturedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSave} className="mt-6">
        <div ref={formRef} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.18)] sm:p-5">
          <div className="mb-5">
            <h3 className="text-[1.35rem] font-semibold tracking-tight text-slate-950">Dados do endereço</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Preencha ou edite as informações do seu endereço.</p>
          </div>

          <div className="grid gap-3.5">
            <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Localização atual</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasMap
                      ? `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`
                      : 'Use o GPS para preencher a posição da entrega.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={isLocating}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0b2f6f] transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation2 className="h-4 w-4" />}
                  Capturar localização atual
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

            <div className="grid gap-3.5 sm:grid-cols-2">
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

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">CEP</span>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(event) => setZipCode(formatZipCode(event.target.value))}
                  placeholder="58400-000"
                  maxLength={9}
                  className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                />
              </label>
            </div>

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
                placeholder="Próximo ao mercado central"
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
              />
            </label>
          </div>

          {message ? (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <div className="mt-4 rounded-[1rem] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p>O GPS serve só para marcar o ponto da entrega. Os dados escritos continuam sendo o endereço principal.</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b2f6f] px-6 text-sm font-semibold text-white shadow-[0_18px_32px_-22px_rgba(11,47,111,0.85)] transition-colors hover:bg-[#0a285f] disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar endereço
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
