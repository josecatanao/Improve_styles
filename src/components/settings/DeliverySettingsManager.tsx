'use client'

import { useState } from 'react'
import { Check, Loader2, MapPin, Search, Truck, Package as PackageIcon } from 'lucide-react'
import { saveDeliverySettings } from '@/app/dashboard/configuracoes/actions'
import { lookupCep } from '@/app/dashboard/configuracoes/cep-actions'
import { useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { StoreLocationMap } from '@/components/settings/StoreLocationMap'

export function DeliverySettingsManager({
  initialSettings,
  schemaReady,
}: {
  initialSettings: {
    delivery_enabled: boolean
    pickup_enabled: boolean
    store_address: string
    store_address_lat: number | null
    store_address_lng: number | null
  }
  schemaReady: boolean
}) {
  const showToast = useToast()
  const [deliveryEnabled, setDeliveryEnabled] = useState(initialSettings.delivery_enabled)
  const [pickupEnabled, setPickupEnabled] = useState(initialSettings.pickup_enabled)

  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [mapLat, setMapLat] = useState(initialSettings.store_address_lat ?? -23.5505)
  const [mapLng, setMapLng] = useState(initialSettings.store_address_lng ?? -46.6333)

  const [isLookingUpCep, setIsLookingUpCep] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const canSave = deliveryEnabled || pickupEnabled

  function buildDisplayAddress() {
    const parts: string[] = []
    if (logradouro) {
      parts.push(numero ? `${logradouro}, ${numero}` : logradouro)
      if (complemento) parts.push(complemento)
    }
    if (bairro) parts.push(bairro)
    if (cidade && estado) parts.push(`${cidade}/${estado}`)
    else if (cidade) parts.push(cidade)
    return parts.join(' - ') || initialSettings.store_address
  }

  async function handleLookupCep() {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) {
      setCepError('Digite um CEP valido com 8 digitos.')
      return
    }

    setIsLookingUpCep(true)
    setCepError(null)

    try {
      const result = await lookupCep(digits)
      if (!result) {
        setCepError('CEP nao encontrado. Verifique e tente novamente.')
        return
      }

      setLogradouro(result.logradouro)
      setBairro(result.bairro)
      setCidade(result.cidade)
      setEstado(result.estado)

      if (result.logradouro && result.cidade && result.estado) {
        try {
          const query = encodeURIComponent(`${result.logradouro}, ${result.cidade}, ${result.estado}, Brasil`)
          const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
          const geoData = await geoResponse.json()
          if (geoData.length > 0) {
            setMapLat(Number.parseFloat(geoData[0].lat))
            setMapLng(Number.parseFloat(geoData[0].lon))
          }
        } catch {
          // geocoding is best-effort
        }
      }

      showToast({
        variant: 'success',
        title: 'CEP encontrado',
        description: 'Endereco preenchido automaticamente.',
      })
    } catch {
      setCepError('Erro ao consultar o CEP. Tente novamente.')
    } finally {
      setIsLookingUpCep(false)
    }
  }

  async function handleSave() {
    if (!canSave) {
      showToast({
        variant: 'error',
        title: 'Configuracao invalida',
        description: 'Ative ao menos uma opcao de entrega.',
      })
      return
    }

    setIsSaving(true)

    try {
      await saveDeliverySettings({
        deliveryEnabled,
        pickupEnabled,
        storeAddress: buildDisplayAddress(),
        storeAddressLat: mapLat,
        storeAddressLng: mapLng,
      })

      showToast({
        variant: 'success',
        title: 'Salvo',
        description: 'Opcoes de entrega atualizadas.',
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Falha ao salvar',
        description: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {!schemaReady ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          As colunas de entrega ainda nao existem no banco. Rode novamente <code>supabase/04_marketing_and_reviews.sql</code> no Supabase.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-950">Opcoes de entrega</h1>
          <p className="text-sm text-slate-500">Ative ou desative os metodos disponiveis no checkout.</p>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !schemaReady || !canSave}
          className="h-11 rounded-xl bg-[#2563eb] px-5 text-white hover:bg-[#1d4ed8]"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="divide-y divide-slate-100">

          <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <Truck className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Delivery (Entrega)</p>
                <p className="text-xs text-slate-500">Cliente informa endereco e calcula frete por CEP.</p>
              </div>
            </div>
            <Switch
              checked={deliveryEnabled}
              onCheckedChange={setDeliveryEnabled}
              disabled={!schemaReady}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <PackageIcon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Retirada na Loja</p>
                <p className="text-xs text-slate-500">Cliente retira o pedido sem informar endereco.</p>
              </div>
            </div>
            <Switch
              checked={pickupEnabled}
              onCheckedChange={setPickupEnabled}
              disabled={!schemaReady}
            />
          </div>

          {pickupEnabled ? (
            <div className="py-5 first:pt-0 last:pb-0 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <MapPin className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Endereco da loja para retirada</p>
                  <p className="text-xs text-slate-500">Busque pelo CEP para preencher automaticamente.</p>
                </div>
              </div>

              <div className="pl-[52px] space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">CEP</label>
                  <div className="flex gap-2">
                    <Input
                      value={cep}
                      onChange={(e) => { setCep(e.target.value); setCepError(null) }}
                      placeholder="00000-000"
                      className="h-11 w-44 rounded-xl"
                      maxLength={9}
                    />
                    <Button
                      type="button"
                      onClick={handleLookupCep}
                      disabled={isLookingUpCep}
                      className="h-11 rounded-xl bg-[#2563eb] px-4 text-white hover:bg-[#1d4ed8]"
                    >
                      {isLookingUpCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Buscar</span>
                    </Button>
                  </div>
                  {cepError ? (
                    <p className="mt-1 text-xs text-red-500">{cepError}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Logradouro</label>
                    <Input
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="Rua / Avenida"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Numero</label>
                    <Input
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Complemento</label>
                    <Input
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      placeholder="Sala / Loja / Lote"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Bairro</label>
                    <Input
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Centro"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Cidade</label>
                    <Input
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Sao Paulo"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
                    <Input
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className="h-11 w-20 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Localizacao no mapa
                    <span className="ml-1 font-normal text-slate-400">(clique no mapa ou arraste o marcador)</span>
                  </label>
                  <StoreLocationMap
                    lat={mapLat}
                    lng={mapLng}
                    onChange={(lat, lng) => { setMapLat(lat); setMapLng(lng) }}
                  />
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <Input
                      value={mapLat.toFixed(6)}
                      onChange={(e) => setMapLat(Number(e.target.value) || mapLat)}
                      className="h-10 rounded-xl text-xs"
                      placeholder="Latitude"
                      type="text"
                      inputMode="decimal"
                    />
                    <Input
                      value={mapLng.toFixed(6)}
                      onChange={(e) => setMapLng(Number(e.target.value) || mapLng)}
                      className="h-10 rounded-xl text-xs"
                      placeholder="Longitude"
                      type="text"
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </section>

      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          {deliveryEnabled && pickupEnabled
            ? 'O cliente podera escolher entre Delivery e Retirada no checkout.'
            : deliveryEnabled
              ? 'Apenas Delivery disponivel. O cliente nao vera opcao de retirada.'
              : pickupEnabled
                ? 'Apenas Retirada na Loja disponivel. O cliente nao vera opcao de delivery.'
                : 'Ative ao menos uma opcao de entrega para liberar o checkout.'}
        </p>
      </div>
    </div>
  )
}
