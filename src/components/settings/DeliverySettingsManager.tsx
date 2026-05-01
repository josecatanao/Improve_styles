'use client'

import { useState } from 'react'
import { Check, Loader2, Truck, Package as PackageIcon } from 'lucide-react'
import { saveDeliverySettings } from '@/app/dashboard/configuracoes/actions'
import { useToast } from '@/components/ui/feedback-provider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export function DeliverySettingsManager({
  initialSettings,
  schemaReady,
}: {
  initialSettings: {
    delivery_enabled: boolean
    pickup_enabled: boolean
    allow_shipping_other_states: boolean
  }
  schemaReady: boolean
}) {
  const showToast = useToast()
  const [deliveryEnabled, setDeliveryEnabled] = useState(initialSettings.delivery_enabled)
  const [pickupEnabled, setPickupEnabled] = useState(initialSettings.pickup_enabled)
  const [allowOtherStates, setAllowOtherStates] = useState(initialSettings.allow_shipping_other_states)
  const [isSaving, setIsSaving] = useState(false)

  const canSave = deliveryEnabled || pickupEnabled

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
        allowShippingOtherStates: allowOtherStates,
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

          <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <Truck className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Envio para outros estados</p>
                <p className="text-xs text-slate-500">
                  {deliveryEnabled
                    ? 'Permite frete via Correios para CEPs fora das zonas locais.'
                    : 'Disponivel apenas com Delivery ativo.'}
                </p>
              </div>
            </div>
            <Switch
              checked={deliveryEnabled && allowOtherStates}
              onCheckedChange={setAllowOtherStates}
              disabled={!schemaReady || !deliveryEnabled}
            />
          </div>

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
