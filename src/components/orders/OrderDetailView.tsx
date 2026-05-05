'use client'

import Link from 'next/link'
import { Fragment, useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/storefront'
import type { StoreOrder } from '@/lib/orders'
import type { OrderPDFSettings } from '@/components/orders/pedido-pdf'
import { useOrderPDF } from '@/hooks/use-order-pdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/feedback-provider'
import { updateOrderPaymentStatus, updateOrderStatus } from '@/app/dashboard/pedidos/actions'
import {
  getPaymentStatusBadgeClasses,
  getPaymentStatusLabel,
  getStatusBadgeClasses,
  getStatusLabel,
  isPickup,
  normalizePaymentStatus,
  type PaymentStatus,
} from '@/lib/order-statuses'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Copy,
  CreditCard,
  Download,
  FileText,
  MapPin,
  MessageCircleMore,
  PackageCheck,
  PencilLine,
  ShoppingCart,
  Truck,
  UserRound,
} from 'lucide-react'

type WorkflowStep = {
  key: string
  label: string
  note: string
  icon: typeof CheckCircle2
  clickable: boolean
  onClick?: () => void
  state: 'done' | 'current' | 'upcoming'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getOrderCode(orderId: string) {
  return orderId.split('-')[0].toUpperCase()
}

function getDeliveryLabel(order: StoreOrder) {
  return order.delivery_method === 'pickup' ? 'Retirada na loja' : 'Entrega'
}

function getPaymentLabel(order: StoreOrder) {
  if (order.payment_method === 'pix') {
    return 'Pix'
  }

  if (order.payment_method === 'cash') {
    return 'Dinheiro'
  }

  return `Cartão ${order.installments}x`
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
  const itemLabel = `${order.total_items} ${order.total_items === 1 ? 'item' : 'itens'}`
  const totalLabel = formatMoney(order.total_price)
  const productNames = Array.from(new Set(order.store_order_items.map((item) => item.name.trim()).filter(Boolean))).join(', ')
  const productsText = productNames ? ` Produtos do pedido: ${productNames}.` : ''
  const pickup = isPickup(order.delivery_method)

  switch (template) {
    case 'processing':
      return pickup
        ? `Olá, ${customerName}! Seu pedido ${orderCode} está aguardando retirada na loja.${productsText} Assim que estiver disponível para retirada, avisamos você por aqui.`
        : `Olá, ${customerName}! Seu pedido ${orderCode} está em preparação neste momento.${productsText} Já conferimos os ${itemLabel} e vamos seguir com as próximas etapas do envio.`
    case 'shipped':
      return `Olá, ${customerName}! Seu pedido ${orderCode} saiu para entrega.${productsText} Qualquer atualização de rota ou finalização, avisamos você por aqui.`
    case 'completed':
      return pickup
        ? `Olá, ${customerName}! Seu pedido ${orderCode} foi retirado com sucesso.${productsText} Obrigado pela compra. Se precisar de suporte no pós-venda, estamos por aqui.`
        : `Olá, ${customerName}! Seu pedido ${orderCode} foi concluído e marcado como entregue.${productsText} Obrigado pela compra. Se precisar de suporte no pós-venda, estamos por aqui.`
    case 'pending':
    default:
      return `Olá, ${customerName}! Recebemos seu pedido ${orderCode} com ${itemLabel}, no valor total de ${totalLabel}.${productsText} Já registramos tudo por aqui e vamos continuar com as próximas etapas do envio.`
  }
}

function getStepCardClasses(state: WorkflowStep['state']) {
  if (state === 'current') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_20px_40px_-28px_rgba(16,185,129,0.5)]'
  }

  if (state === 'done') {
    return 'border-emerald-100 bg-white text-slate-900'
  }

  return 'border-slate-200 bg-white text-slate-500'
}

function buildWorkflowSteps(
  order: StoreOrder,
  paymentStatus: PaymentStatus,
  orderStatus: string,
  onStatusChange: (nextStatus: string) => void,
  onPaymentStatusChange: (nextStatus: PaymentStatus) => void
): WorkflowStep[] {
  const pickup = isPickup(order.delivery_method)
  const paymentDone = paymentStatus === 'paid'

  if (pickup) {
    const pickupStepState: WorkflowStep['state'] =
      !paymentDone ? 'upcoming' : orderStatus === 'completed' ? 'done' : 'current'

    return [
      {
        key: 'payment',
        label: 'Confirmar pagamento',
        note: paymentDone ? 'Concluído' : 'Aguardando',
        icon: CheckCircle2,
        clickable: true,
        onClick: () => onPaymentStatusChange('paid'),
        state: paymentDone ? 'done' : 'current',
      },
      {
        key: 'processing',
        label: 'Aguardando retirada',
        note: orderStatus === 'completed' ? 'Concluída' : pickupStepState === 'current' ? 'Etapa atual' : 'Aguardando',
        icon: ClipboardList,
        clickable: paymentDone,
        onClick: () => onStatusChange('processing'),
        state: pickupStepState,
      },
      {
        key: 'completed',
        label: 'Produto retirado',
        note: orderStatus === 'completed' ? 'Concluída' : 'Aguardando',
        icon: PackageCheck,
        clickable: paymentDone,
        onClick: () => onStatusChange('completed'),
        state: orderStatus === 'completed' ? 'current' : 'upcoming',
      },
    ]
  }

  const processingState: WorkflowStep['state'] =
    !paymentDone ? 'upcoming' : orderStatus === 'shipped' || orderStatus === 'completed' ? 'done' : 'current'
  const shippedState: WorkflowStep['state'] =
    orderStatus === 'completed' ? 'done' : orderStatus === 'shipped' ? 'current' : 'upcoming'
  const completedState: WorkflowStep['state'] = orderStatus === 'completed' ? 'current' : 'upcoming'

  return [
    {
      key: 'payment',
      label: 'Confirmar pagamento',
      note: paymentDone ? 'Concluído' : 'Aguardando',
      icon: CheckCircle2,
      clickable: true,
      onClick: () => onPaymentStatusChange('paid'),
      state: paymentDone ? 'done' : 'current',
    },
    {
      key: 'processing',
      label: 'Em preparação',
      note: processingState === 'current' ? 'Etapa atual' : processingState === 'done' ? 'Concluída' : 'Aguardando',
      icon: ClipboardList,
      clickable: paymentDone,
      onClick: () => onStatusChange('processing'),
      state: processingState,
    },
    {
      key: 'shipped',
      label: 'Saiu para entrega',
      note: shippedState === 'current' ? 'Etapa atual' : shippedState === 'done' ? 'Concluída' : 'Aguardando',
      icon: Truck,
      clickable: paymentDone,
      onClick: () => onStatusChange('shipped'),
      state: shippedState,
    },
    {
      key: 'completed',
      label: 'Marcar como entregue',
      note: completedState === 'current' ? 'Concluída' : 'Aguardando',
      icon: CheckCircle2,
      clickable: paymentDone,
      onClick: () => onStatusChange('completed'),
      state: completedState,
    },
  ]
}

type OrderDetailViewProps = {
  order: StoreOrder
  storeName?: string | null
  storeLogoUrl?: string | null
  storeWhatsapp?: string | null
  storeAddress?: string | null
}

export function OrderDetailView({ order, storeName, storeLogoUrl, storeWhatsapp, storeAddress }: OrderDetailViewProps) {
  const router = useRouter()
  const showToast = useToast()
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(normalizePaymentStatus(order.payment_status, order.status))
  const [isPending, startTransition] = useTransition()
  const [isEditingMessage, setIsEditingMessage] = useState(false)

  const storeDisplayName = storeName?.trim() || 'Improve Styles'
  const displayOrder = useMemo(
    () => ({
      ...order,
      status,
      payment_status: paymentStatus,
    }),
    [order, paymentStatus, status]
  )

  const [messageDraft, setMessageDraft] = useState(buildWhatsAppMessage(displayOrder, displayOrder.status))

  const pdfSettings: OrderPDFSettings = useMemo(
    () => ({
      storeName: storeDisplayName,
      storeLogoUrl: storeLogoUrl ?? null,
      storeWhatsapp: storeWhatsapp ?? null,
      storeAddress: storeAddress ?? null,
    }),
    [storeDisplayName, storeLogoUrl, storeWhatsapp, storeAddress]
  )

  const { downloadPDF, openPDFPreview, isGenerating } = useOrderPDF({ order: displayOrder, settings: pdfSettings })

  const orderCode = getOrderCode(order.id)
  const subtotal = useMemo(
    () => displayOrder.store_order_items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [displayOrder.store_order_items]
  )
  const shippingCost = Number(displayOrder.shipping_cost || 0)
  const discount = Number(displayOrder.discount_amount || 0)
  const computedDiscount =
    discount > 0 ? discount : Math.max(0, subtotal + shippingCost - Number(displayOrder.total_price))
  function handleStatusUpdate(nextStatus: string) {
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, nextStatus)
        setStatus(nextStatus)
        setMessageDraft(buildWhatsAppMessage({ ...displayOrder, status: nextStatus }, nextStatus))
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

  function handlePaymentStatusUpdate(nextPaymentStatus: PaymentStatus) {
    startTransition(async () => {
      try {
        await updateOrderPaymentStatus(order.id, nextPaymentStatus)
        setPaymentStatus(nextPaymentStatus)
        showToast({ variant: 'success', title: 'Status do pagamento atualizado' })
        router.refresh()
      } catch (error) {
        showToast({
          variant: 'error',
          title: 'Falha ao atualizar o pagamento',
          description: error instanceof Error ? error.message : 'Erro inesperado.',
        })
      }
    })
  }

  function openWhatsApp(customMessage?: string) {
    const phone = normalizeWhatsAppPhone(displayOrder.customer_phone)
    const message = (customMessage || messageDraft).trim()

    if (!phone) {
      showToast({
        variant: 'error',
        title: 'WhatsApp indisponível',
        description: 'Esse pedido não possui telefone para contato.',
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
      showToast({ variant: 'success', title: 'Número do pedido copiado' })
    } catch {
      showToast({ variant: 'error', title: 'Falha ao copiar' })
    }
  }

  const workflowSteps = buildWorkflowSteps(displayOrder, paymentStatus, status, handleStatusUpdate, handlePaymentStatusUpdate)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pedido #{orderCode}</h1>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClasses(status)}`}>
              {getStatusLabel(status, displayOrder.delivery_method)}
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-sm font-semibold',
                getPaymentStatusBadgeClasses(paymentStatus, status)
              )}
            >
              Pagamento: {getPaymentStatusLabel(paymentStatus, status)}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Criado em {formatDate(displayOrder.created_at)} {' • '} Atualizado em {formatDate(displayOrder.updated_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/pedidos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar para pedidos
            </Button>
          </Link>
          <Button variant="outline" onClick={downloadPDF} disabled={isGenerating}>
            <Download className="h-4 w-4" />
            {isGenerating ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          <Button variant="outline" onClick={openPDFPreview} disabled={isGenerating}>
            <FileText className="h-4 w-4" />
            Visualizar
          </Button>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-emerald-100">
        <CardContent className="space-y-6 px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Etapas do pedido</h2>
              <p className="text-sm text-slate-500">Acompanhe e atualize o status operacional do pedido.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Pedido #{orderCode}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-0">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <Fragment key={step.key}>
                  <div className="flex items-stretch xl:flex-1">
                    <button
                      type="button"
                      disabled={isPending || !step.clickable}
                      onClick={step.onClick}
                      className={cn(
                        'group flex h-full w-full min-h-[170px] flex-col items-start justify-between rounded-3xl border px-5 py-5 text-left transition-all',
                        getStepCardClasses(step.state),
                        step.clickable && 'hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-28px_rgba(15,23,42,0.35)]',
                        !step.clickable && 'cursor-default'
                      )}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border',
                            step.state === 'current'
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                              : step.state === 'done'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span
                          className={cn(
                            'flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold',
                            step.state === 'current' || step.state === 'done'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          )}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex min-h-[72px] flex-1 flex-col">
                        <p className="text-base font-semibold">{step.label}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {step.state === 'current' ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Etapa atual
                            </span>
                          ) : null}
                          <span className="text-sm text-slate-500">{step.note}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        {step.state === 'done' || step.state === 'current' ? formatDate(displayOrder.created_at) : '\u00A0'}
                      </p>
                    </button>
                  </div>
                  {index < workflowSteps.length - 1 ? (
                    <div className="hidden w-16 shrink-0 items-center xl:flex">
                      <div
                        className={cn(
                          'h-0.5 w-full border-t border-dashed',
                          workflowSteps[index].state === 'done' ? 'border-emerald-400' : 'border-slate-300'
                        )}
                      />
                    </div>
                  ) : null}
                </Fragment>
              )
            })}
          </div>

          <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                <MessageCircleMore className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Mensagem da etapa atual</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Envie ao cliente uma mensagem personalizada sobre o status do pedido.
                </p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
                  <textarea
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    readOnly={!isEditingMessage}
                    rows={6}
                    className={cn(
                      'w-full resize-none border-0 bg-transparent text-base leading-8 text-slate-800 outline-none',
                      !isEditingMessage && 'cursor-default'
                    )}
                  />
                  <div className="mt-2 text-right text-sm text-slate-400">{messageDraft.length}/1000 caracteres</div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openWhatsApp()}>
                    <MessageCircleMore className="h-4 w-4" />
                    Enviar mensagem via WhatsApp
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditingMessage((current) => !current)}>
                    <PencilLine className="h-4 w-4" />
                    {isEditingMessage ? 'Concluir edição' : 'Editar mensagem'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-base font-semibold text-slate-700">Pré-visualização</p>
                <div className="rounded-[28px] border border-[#f2e8de] bg-[#f7efe8] p-4">
                  <div className="rounded-[24px] bg-white px-5 py-4 text-[0.95rem] leading-8 text-slate-800 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.5)]">
                    <div className="whitespace-pre-line">{messageDraft}</div>
                    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-500">
                      <span>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}</span>
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <InfoCard title="Dados do cliente" icon={<UserRound className="h-5 w-5 text-[#3483fa]" />}>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900">{displayOrder.customer_name}</p>
            <p className="text-sm text-slate-600">{displayOrder.customer_phone || 'Sem telefone informado.'}</p>
            <p className="text-sm text-slate-600">{displayOrder.customer_email || 'Sem e-mail informado.'}</p>
          </div>
        </InfoCard>

        <InfoCard title="Entrega" icon={<Truck className="h-5 w-5 text-[#3483fa]" />}>
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {getDeliveryLabel(displayOrder)}
            </span>
            <p className="text-sm leading-6 text-slate-600">
              {displayOrder.delivery_address || 'Endereço não informado.'}
            </p>
            {displayOrder.delivery_lat && displayOrder.delivery_lng ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${displayOrder.delivery_lat},${displayOrder.delivery_lng}`}
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
              <span>Número do pedido</span>
              <button type="button" className="inline-flex items-center gap-2 font-semibold text-slate-900" onClick={copyOrderCode}>
                {orderCode}
                <Copy className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Status</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClasses(status)}`}>
                {getStatusLabel(status, displayOrder.delivery_method)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Criado em</span>
              <span className="font-medium text-slate-900">{formatDate(displayOrder.created_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Atualizado em</span>
              <span className="font-medium text-slate-900">{formatDate(displayOrder.updated_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Pagamento</span>
              <span className="font-medium text-slate-900">{getPaymentLabel(displayOrder)}</span>
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
                <span>Variação</span>
                <span>Qtd</span>
                <span className="text-right">Subtotal</span>
              </div>
              {displayOrder.store_order_items.map((item) => (
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
              {computedDiscount > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Desconto{displayOrder.coupon_code ? ` (${displayOrder.coupon_code})` : ''}</span>
                  <span>- {formatMoney(computedDiscount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-lg font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatMoney(displayOrder.total_price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <InfoCard title="Pagamento" icon={<CreditCard className="h-5 w-5 text-[#3483fa]" />}>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Forma de pagamento</span>
                <span className="font-medium text-slate-900">{getPaymentLabel(displayOrder)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Status atual</span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    getPaymentStatusBadgeClasses(paymentStatus, status)
                  )}
                >
                  {getPaymentStatusLabel(paymentStatus, status)}
                </span>
              </div>
              <div className="space-y-2">
                <label htmlFor="payment-status" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Atualizar pagamento
                </label>
                <select
                  id="payment-status"
                  disabled={isPending}
                  value={paymentStatus}
                  onChange={(event) => handlePaymentStatusUpdate(event.target.value as PaymentStatus)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Observações" icon={<ClipboardList className="h-5 w-5 text-[#3483fa]" />}>
            <p className="text-sm leading-6 text-slate-600">
              {displayOrder.notes?.trim() || 'Nenhuma observação enviada pelo cliente.'}
            </p>
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
