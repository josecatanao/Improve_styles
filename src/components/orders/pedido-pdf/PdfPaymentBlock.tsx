import { View, Text } from '@react-pdf/renderer'
import { pdfStyles, getStatusColor } from './pdf-styles'
import { getPaymentStatusLabel, getStatusLabel, isPickup, normalizePaymentStatus } from '@/lib/order-statuses'
import type { StoreOrder } from '@/lib/orders'

type PdfPaymentBlockProps = {
  order: StoreOrder
}

function getPaymentLabel(order: StoreOrder): string {
  if (order.payment_method === 'pix') return 'Pix'
  if (order.payment_method === 'cash') return 'Dinheiro'
  return `Cartão de crédito ${order.installments > 1 ? `(${order.installments}x)` : ''}`.trim()
}

function getPaymentStatusLabelAndColor(order: StoreOrder): { label: string; bg: string; text: string } {
  const paymentStatus = normalizePaymentStatus(order.payment_status, order.status)

  if (paymentStatus === 'paid') {
    return { label: 'Confirmado', bg: pdfStyles.paymentBlock.backgroundColor || '#f8fafc', text: '#059669' }
  }
  if (paymentStatus === 'cancelled') {
    return { label: 'Cancelado', bg: '#fef2f2', text: '#dc2626' }
  }
  return { label: getPaymentStatusLabel(order.payment_status, order.status), bg: '#fffbeb', text: '#d97706' }
}

export function PdfPaymentBlock({ order }: PdfPaymentBlockProps) {
  const statusLabel = getStatusLabel(order.status, order.delivery_method)
  const paymentLabel = getPaymentLabel(order)
  const paymentStatus = getPaymentStatusLabelAndColor(order)
  const deliveryTypeLabel = isPickup(order.delivery_method) ? 'Retirada na loja' : 'Entrega (Delivery)'
  const statusColors = getStatusColor(order.status)

  return (
    <View>
      <Text style={pdfStyles.sectionTitle}>Pagamento e informações</Text>

      <View style={pdfStyles.paymentBlock}>
        <View style={pdfStyles.paymentRow}>
          <Text style={pdfStyles.paymentLabel}>Forma de pagamento</Text>
          <Text style={pdfStyles.paymentValue}>{paymentLabel}</Text>
        </View>
        <View style={pdfStyles.paymentRow}>
          <Text style={pdfStyles.paymentLabel}>Status do pagamento</Text>
          <Text
            style={[
              pdfStyles.paymentStatusBadge,
              { backgroundColor: paymentStatus.bg, color: paymentStatus.text },
            ]}
          >
            {paymentStatus.label}
          </Text>
        </View>
      </View>

      <View style={pdfStyles.extraInfoBlock}>
        <View style={pdfStyles.extraInfoRow}>
          <Text style={pdfStyles.extraInfoLabel}>Tipo de entrega</Text>
          <Text style={pdfStyles.extraInfoValue}>{deliveryTypeLabel}</Text>
        </View>
        <View style={pdfStyles.extraInfoRow}>
          <Text style={pdfStyles.extraInfoLabel}>Status do pedido</Text>
          <Text
            style={[
              pdfStyles.extraInfoValue,
              {
                color: statusColors.text,
                fontWeight: 700,
              },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        {order.shipping_zone_name?.trim() ? (
          <View style={pdfStyles.extraInfoRow}>
            <Text style={pdfStyles.extraInfoLabel}>Zona de envio</Text>
            <Text style={pdfStyles.extraInfoValue}>{order.shipping_zone_name.trim()}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}
