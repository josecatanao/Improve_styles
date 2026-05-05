import { View, Text, Image } from '@react-pdf/renderer'
import { pdfStyles, getOrderCode, formatDate, getStatusColor } from './pdf-styles'
import { getStatusLabel } from '@/lib/order-statuses'
import type { StoreOrder } from '@/lib/orders'

type PdfHeaderProps = {
  order: StoreOrder
  storeName: string
  storeLogoUrl: string | null
  storeWhatsapp: string | null
}

export function PdfHeader({ order, storeName, storeLogoUrl, storeWhatsapp }: PdfHeaderProps) {
  const orderCode = getOrderCode(order.id)
  const statusLabel = getStatusLabel(order.status, order.delivery_method)
  const statusColors = getStatusColor(order.status)
  const formattedWhatsapp = storeWhatsapp
    ? storeWhatsapp.replace(/(\d{2})(\d{1,5})(\d{4})/, '($1) $2-$3').trim()
    : null

  return (
    <View style={pdfStyles.header}>
      <View style={pdfStyles.headerLeft}>
        <View style={pdfStyles.headerBrandRow}>
          {storeLogoUrl ? (
            <Image src={storeLogoUrl} style={pdfStyles.headerLogo} />
          ) : null}
          <View>
            <Text style={pdfStyles.headerStoreName}>{storeName}</Text>
            {formattedWhatsapp ? (
              <Text style={pdfStyles.headerContact}>{formattedWhatsapp}</Text>
            ) : null}
          </View>
        </View>
        <Text style={pdfStyles.headerDocumentLabel}>Comprovante de pedido</Text>
      </View>

      <View style={pdfStyles.headerRight}>
        <Text style={pdfStyles.headerOrderLabel}>Pedido</Text>
        <Text style={pdfStyles.headerOrderCode}>#{orderCode}</Text>
        <Text style={pdfStyles.headerDate}>{formatDate(order.created_at)}</Text>
        <Text
          style={[
            pdfStyles.headerStatusBadge,
            {
              backgroundColor: statusColors.bg,
              color: statusColors.text,
            },
          ]}
        >
          {statusLabel}
        </Text>
      </View>
    </View>
  )
}
