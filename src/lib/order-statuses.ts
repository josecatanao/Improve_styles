import { CheckCircle2, ClipboardList, PackageCheck, Truck } from 'lucide-react'

export type DeliveryMethod = 'delivery' | 'pickup'

export function isPickup(deliveryMethod: string | undefined | null): boolean {
  return (deliveryMethod ?? '').toLowerCase() === 'pickup'
}

const DELIVERY_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Em preparação' },
  { value: 'shipped', label: 'Saiu para entrega' },
  { value: 'completed', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
] as const

const PICKUP_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Aguardando retirada' },
  { value: 'completed', label: 'Produto retirado' },
  { value: 'cancelled', label: 'Cancelado' },
] as const

export type StatusOption = { value: string; label: string }

export function getStatusOptions(deliveryMethod: string | undefined | null): StatusOption[] {
  return isPickup(deliveryMethod) ? [...PICKUP_STATUS_OPTIONS] : [...DELIVERY_STATUS_OPTIONS]
}

const DELIVERY_STATUS_STEPS = [
  { value: 'pending', label: 'Confirmar pagamento', icon: CheckCircle2 },
  { value: 'processing', label: 'Em preparação', icon: ClipboardList },
  { value: 'shipped', label: 'Saiu para entrega', icon: Truck },
  { value: 'completed', label: 'Marcar como entregue', icon: CheckCircle2 },
] as const

const PICKUP_STATUS_STEPS = [
  { value: 'pending', label: 'Pedido recebido', icon: CheckCircle2 },
  { value: 'processing', label: 'Aguardando retirada', icon: ClipboardList },
  { value: 'completed', label: 'Produto retirado', icon: PackageCheck },
] as const

export type StatusStep = { value: string; label: string; icon: typeof CheckCircle2 }

export function getStatusSteps(deliveryMethod: string | undefined | null): StatusStep[] {
  return isPickup(deliveryMethod) ? [...PICKUP_STATUS_STEPS] : [...DELIVERY_STATUS_STEPS]
}

export function getStatusLabel(status: string, deliveryMethod?: string | null): string {
  if (isPickup(deliveryMethod)) {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'processing':
        return 'Aguardando retirada'
      case 'completed':
        return 'Produto retirado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  switch (status) {
    case 'pending':
      return 'Pendente'
    case 'processing':
      return 'Em preparação'
    case 'shipped':
      return 'Saiu para entrega'
    case 'completed':
      return 'Entregue'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

export function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    case 'processing':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
    case 'shipped':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    case 'cancelled':
      return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

export function getOrderStatusLabel(status: string, deliveryMethod?: string | null): string {
  if (isPickup(deliveryMethod)) {
    switch (status) {
      case 'pending':
        return 'Pendentes'
      case 'processing':
        return 'Aguardando retirada'
      case 'completed':
        return 'Retirados'
      case 'cancelled':
        return 'Cancelados'
      default:
        return status
    }
  }

  switch (status) {
    case 'pending':
      return 'Pendentes'
    case 'processing':
      return 'Em separação'
    case 'shipped':
      return 'Em entrega'
    case 'completed':
      return 'Concluídos'
    case 'cancelled':
      return 'Cancelados'
    default:
      return status
  }
}

export function getStepDescription(
  stepKey: string,
  state: 'done' | 'current' | 'upcoming' | 'cancelled',
  createdAt: string,
  deliveryMethod?: string | null
) {
  const pickup = isPickup(deliveryMethod)

  if (state === 'done' && stepKey === 'pending') {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(createdAt))
  }

  if (state === 'current') {
    if (stepKey === 'pending') {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(createdAt))
    }
    if (stepKey === 'processing') {
      return pickup ? 'Aguardando o cliente retirar' : 'Atualizado no pedido'
    }
    if (stepKey === 'shipped') {
      return 'A caminho do destino'
    }
    if (stepKey === 'completed') {
      return pickup ? 'Produto retirado pelo cliente' : 'Pedido finalizado'
    }
  }

  if (state === 'upcoming') {
    if (stepKey === 'processing') {
      return pickup ? 'Aguardando preparação para retirada' : 'Aguardando separação'
    }
    if (stepKey === 'shipped') {
      return 'A caminho do destino'
    }
    if (stepKey === 'completed') {
      return pickup ? 'Aguardando retirada pelo cliente' : 'Aguardando confirmação'
    }
  }

  return 'Etapa concluída'
}

export function getOrderSteps(
  status: string,
  deliveryMethod?: string | null
): Array<{ key: string; label: string; icon: typeof CheckCircle2; state: 'done' | 'current' | 'upcoming' | 'cancelled' }> {
  const pickup = isPickup(deliveryMethod)
  const steps = pickup
    ? [
        { key: 'pending', label: 'Recebido', icon: CheckCircle2 },
        { key: 'processing', label: 'Aguard. retirada', icon: ClipboardList },
        { key: 'completed', label: 'Retirado', icon: PackageCheck },
      ]
    : [
        { key: 'pending', label: 'Recebido', icon: CheckCircle2 },
        { key: 'processing', label: 'Em preparo', icon: ClipboardList },
        { key: 'shipped', label: 'Em entrega', icon: Truck },
        { key: 'completed', label: 'Concluído', icon: CheckCircle2 },
      ]

  const statusIndex = steps.findIndex((s) => s.key === status)

  if (status === 'cancelled') {
    return steps.map((step) => ({ ...step, state: 'cancelled' as const }))
  }

  return steps.map((step, index) => ({
    ...step,
    state: (index < statusIndex ? 'done' : index === statusIndex ? 'current' : 'upcoming') as 'done' | 'current' | 'upcoming',
  }))
}

export function getCustomerStatusMeta(status: string) {
  switch (status) {
    case 'completed':
      return { label: 'Concluído', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
    case 'cancelled':
      return { label: 'Cancelado', className: 'bg-red-50 text-red-700 ring-red-200' }
    case 'pending':
      return { label: 'Pendente', className: 'bg-amber-50 text-amber-700 ring-amber-200' }
    case 'processing':
      return { label: 'Em preparo', className: 'bg-blue-50 text-blue-700 ring-blue-200' }
    case 'shipped':
      return { label: 'Em entrega', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' }
    default:
      return { label: 'Em andamento', className: 'bg-slate-100 text-slate-700 ring-slate-200' }
  }
}
