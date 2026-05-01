'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/storefront'
import type { StoreOrder } from '@/lib/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/feedback-provider'
import { updateOrderStatus } from '@/app/dashboard/pedidos/actions'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  MessageCircleMore,
  Printer,
  ShoppingCart,
  Truck,
  UserRound,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Em preparacao' },
  { value: 'shipped', label: 'Saiu para entrega' },
  { value: 'completed', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
] as const

const STATUS_STEPS = [
  { value: 'pending', label: 'Confirmar pagamento', icon: CheckCircle2 },
  { value: 'processing', label: 'Em preparacao', icon: ClipboardList },
  { value: 'shipped', label: 'Saiu para entrega', icon: Truck },
  { value: 'completed', label: 'Marcar como entregue', icon: CheckCircle2 },
] as const

const WHATSAPP_TEMPLATES = [
  { key: 'pending', label: 'WhatsApp: Pedido recebido' },
  { key: 'processing', label: 'WhatsApp: Em preparo' },
  { key: 'shipped', label: 'WhatsApp: Saiu para entrega' },
  { key: 'completed', label: 'WhatsApp: Entregue' },
] as const

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getOrderCode(orderId: string) {
  return orderId.split('-')[0].toUpperCase()
}

function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700'
    case 'processing':
      return 'bg-blue-50 text-blue-700'
    case 'shipped':
      return 'bg-indigo-50 text-indigo-700'
    case 'completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'cancelled':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function getDeliveryLabel(order: StoreOrder) {
  return order.delivery_method === 'pickup' ? 'Retirada no local' : 'Entrega'
}

function getPaymentLabel(order: StoreOrder) {
  if (order.payment_method === 'pix') {
    return 'Pix'
  }

  if (order.payment_method === 'cash') {
    return 'Dinheiro'
  }

  return `Cartao ${order.installments}x`
}

function normalizeWhatsAppPhone(phone: string | null) {
  const digits = (phone || '').replace(/\D/g, '')

  if (!digits) {
    return null
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return digits
}

function buildWhatsAppMessage(order: StoreOrder, template: string) {
  const customerName = order.customer_name.trim() || 'cliente'
  const orderCode = getOrderCode(order.id)

  switch (template) {
    case 'processing':
      return `Ola, ${customerName}! Seu pedido ${orderCode} esta em preparacao.`
    case 'shipped':
      return `Ola, ${customerName}! Seu pedido ${orderCode} saiu para entrega.`
    case 'completed':
      return `Ola, ${customerName}! Seu pedido ${orderCode} foi entregue. Obrigado pela compra.`
    case 'pending':
    default:
      return `Ola, ${customerName}! Recebemos seu pedido ${orderCode} e ja estamos acompanhando tudo por aqui.`
  }
}

function getStatusTemplateKey(status: string) {
  if (status === 'processing') {
    return 'processing'
  }

  if (status === 'shipped') {
    return 'shipped'
  }

  if (status === 'completed') {
    return 'completed'
  }

  return 'pending'
}

export function OrderDetailView({ order }: { order: StoreOrder }) {
  const router = useRouter()
  const showToast = useToast()
  const [status, setStatus] = useState(order.status)
  const [isPending, startTransition] = useTransition()
  const [messageDraft, setMessageDraft] = useState(buildWhatsAppMessage(order, order.status))

  const orderCode = getOrderCode(order.id)
  const subtotal = useMemo(
    () => order.store_order_items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [order.store_order_items]
  )
  const shippingCost = Number(order.shipping_cost || 0)
  const discount = Math.max(0, subtotal + shippingCost - Number(order.total_price))
  const currentWhatsAppTemplateKey = getStatusTemplateKey(status)
  const currentWhatsAppTemplate = WHATSAPP_TEMPLATES.find((template) => template.key === currentWhatsAppTemplateKey)

  function handleStatusUpdate(nextStatus: string) {
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, nextStatus)
        setStatus(nextStatus)
        setMessageDraft(buildWhatsAppMessage(order, nextStatus))
        showToast({ variant: 'success', title: 'Status do pedido atualizado' })
        router.refresh()
      } catch (error) {
        showToast({
          variant: 'error',
          title: 'Falha ao atualizar o pedido',
          description: error instanceof Error ? error.message : 'Erro inesperado.',
        })
      }
    })
  }

  function openWhatsApp(customMessage?: string) {
    const phone = normalizeWhatsAppPhone(order.customer_phone)
    const message = (customMessage || messageDraft).trim()

    if (!phone) {
      showToast({
        variant: 'error',
        title: 'WhatsApp indisponivel',
        description: 'Esse pedido nao possui telefone para contato.',
      })
      return
    }

    if (!message) {
      showToast({
        variant: 'error',
        title: 'Mensagem vazia',
        description: 'Escreva ou gere uma mensagem antes de abrir o WhatsApp.',
      })
      return
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  async function copyOrderCode() {
    try {
      await navigator.clipboard.writeText(orderCode)
      showToast({ variant: 'success', title: 'Numero do pedido copiado' })
    } catch {
      showToast({ variant: 'error', title: 'Falha ao copiar' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pedido #{orderCode}</h1>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClasses(status)}`}>
              {getStatusLabel(status)}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Criado em {formatDate(order.created_at)} {' • '} Atualizado em {formatDate(order.updated_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/pedidos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar para pedidos
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            onClick={() => openWhatsApp(buildWhatsAppMessage(order, currentWhatsAppTemplateKey))}
          >
            <MessageCircleMore className="h-4 w-4" />
            {currentWhatsAppTemplate?.label || 'WhatsApp'}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
        <CardContent className="px-4 py-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon
                const currentIndex = STATUS_STEPS.findIndex((item) => item.value === status)
                const stepIndex = STATUS_STEPS.findIndex((item) => item.value === step.value)
                const isCurrent = status === step.value
                const isCompleted = currentIndex >= stepIndex

                return (
                  <div key={step.value} className="flex flex-1 items-center gap-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleStatusUpdate(step.value)}
                      className={cn(
                        'flex min-h-14 flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                        isCurrent || isCompleted
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                          isCurrent || isCompleted
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-400'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{step.label}</p>
                        {isCurrent ? <p className="text-xs text-emerald-700">Etapa atual</p> : null}
                      </div>
                    </button>
                    {index < STATUS_STEPS.length - 1 ? (
                      <div className="hidden h-px flex-1 bg-slate-200 xl:block" />
                    ) : null}
                  </div>
                )
              })}
            </div>

            {currentWhatsAppTemplate ? (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-emerald-800">Mensagem da etapa atual</p>
                  <p className="text-sm text-emerald-700">
                    Envie ao cliente a mensagem padrao de {getStatusLabel(status).toLowerCase()}.
                  </p>
                  <div className="rounded-lg border border-emerald-100 bg-white/70 px-3 py-2 text-sm leading-6 text-emerald-900">
                    {buildWhatsAppMessage(order, currentWhatsAppTemplate.key)}
                  </div>
                </div>
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => openWhatsApp(buildWhatsAppMessage(order, currentWhatsAppTemplate.key))}
                >
                  <MessageCircleMore className="h-4 w-4" />
                  Enviar mensagem
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <InfoCard title="Dados do cliente" icon={<UserRound className="h-5 w-5 text-[#3483fa]" />}>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900">{order.customer_name}</p>
            <p className="text-sm text-slate-600">{order.customer_phone || 'Sem telefone informado.'}</p>
            <p className="text-sm text-slate-600">{order.customer_email || 'Sem e-mail informado.'}</p>
          </div>
        </InfoCard>

        <InfoCard title="Entrega" icon={<Truck className="h-5 w-5 text-[#3483fa]" />}>
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {getDeliveryLabel(order)}
            </span>
            <p className="text-sm leading-6 text-slate-600">
              {order.delivery_address || 'Endereco nao informado.'}
            </p>
            {order.delivery_lat && order.delivery_lng ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#3483fa] hover:underline"
              >
                <MapPin className="h-4 w-4" />
                Abrir no Google Maps
              </a>
            ) : null}
          </div>
        </InfoCard>

        <InfoCard title="Resumo do pedido" icon={<ClipboardList className="h-5 w-5 text-[#3483fa]" />}>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Numero do pedido</span>
              <button type="button" className="inline-flex items-center gap-2 font-semibold text-slate-900" onClick={copyOrderCode}>
                {orderCode}
                <Copy className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Status</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClasses(status)}`}>{getStatusLabel(status)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Criado em</span>
              <span className="font-medium text-slate-900">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Atualizado em</span>
              <span className="font-medium text-slate-900">{formatDate(order.updated_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Pagamento</span>
              <span className="font-medium text-slate-900">{getPaymentLabel(order)}</span>
            </div>
          </div>
        </InfoCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#3483fa]" />
              Itens do pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Produto</span>
                <span>Variacao</span>
                <span>Qtd</span>
                <span className="text-right">Subtotal</span>
              </div>
              {order.store_order_items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">R$ {item.price.toFixed(2).replace('.', ',')} cada</p>
                  </div>
                  <span className="text-slate-600">{item.size || item.color_name || item.sku || '-'}</span>
                  <span className="text-slate-600">{item.quantity}</span>
                  <span className="text-right font-medium text-slate-900">{formatMoney(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="ml-auto max-w-sm space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Taxa de entrega</span>
                <span>{formatMoney(shippingCost)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Desconto</span>
                  <span>- {formatMoney(discount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-lg font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatMoney(order.total_price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <InfoCard title="Linha do tempo" icon={<CalendarDays className="h-5 w-5 text-[#3483fa]" />}>
            <div className="space-y-4">
              {STATUS_STEPS.map((step) => {
                const activeIndex = STATUS_STEPS.findIndex((item) => item.value === status)
                const stepIndex = STATUS_STEPS.findIndex((item) => item.value === step.value)
                const done = activeIndex >= stepIndex
                return (
                  <div key={step.value} className="flex items-start gap-3">
                    <span className={`mt-1 h-3.5 w-3.5 rounded-full ring-4 ${done ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-200 ring-slate-100'}`} />
                    <div>
                      <p className="font-medium text-slate-900">{step.label}</p>
                      <p className="text-sm text-slate-500">{done ? 'Etapa concluida ou atual.' : 'Etapa aguardando andamento.'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </InfoCard>

          <InfoCard title="Pagamento" icon={<CreditCard className="h-5 w-5 text-[#3483fa]" />}>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Forma de pagamento</span>
                <span className="font-medium text-slate-900">{getPaymentLabel(order)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Status</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {status === 'completed' ? 'Pago' : 'Pendente'}
                </span>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Observacoes" icon={<ClipboardList className="h-5 w-5 text-[#3483fa]" />}>
            <p className="text-sm leading-6 text-slate-600">
              {order.notes?.trim() || 'Nenhuma observacao enviada pelo cliente.'}
            </p>
          </InfoCard>

          <InfoCard title="Acoes rapidas" icon={<MessageCircleMore className="h-5 w-5 text-[#3483fa]" />}>
            <div className="grid gap-2">
                {WHATSAPP_TEMPLATES.map((template) => (
                  <Button
                    key={template.key}
                    type="button"
                    variant="outline"
                    className="justify-start"
                    disabled={template.key === currentWhatsAppTemplateKey}
                    onClick={() => openWhatsApp(buildWhatsAppMessage(order, template.key))}
                  >
                    <MessageCircleMore className="h-4 w-4 text-emerald-600" />
                    {template.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="destructive"
                  className="justify-start"
                  onClick={() => handleStatusUpdate('cancelled')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Cancelar pedido
                </Button>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
