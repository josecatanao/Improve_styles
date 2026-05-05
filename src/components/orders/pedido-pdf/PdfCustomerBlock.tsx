import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdf-styles'
import type { StoreOrder } from '@/lib/orders'

type PdfCustomerBlockProps = {
  order: StoreOrder
}

export function PdfCustomerBlock({ order }: PdfCustomerBlockProps) {
  return (
    <View>
      <Text style={pdfStyles.sectionTitle}>Dados do cliente</Text>
      <View style={pdfStyles.infoGrid}>
        <View style={pdfStyles.infoColumn}>
          <Text style={pdfStyles.infoLabel}>Nome</Text>
          <Text style={pdfStyles.infoValue}>{order.customer_name}</Text>
        </View>
        <View style={pdfStyles.infoColumn}>
          <Text style={pdfStyles.infoLabel}>Telefone / WhatsApp</Text>
          <Text style={pdfStyles.infoValue}>
            {order.customer_phone?.trim() || 'Não informado'}
          </Text>
        </View>
        <View style={pdfStyles.infoColumn}>
          <Text style={pdfStyles.infoLabel}>E-mail</Text>
          <Text style={pdfStyles.infoValue}>
            {order.customer_email?.trim() || 'Não informado'}
          </Text>
        </View>
      </View>
    </View>
  )
}
