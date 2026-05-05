import { View, Text, Link } from '@react-pdf/renderer'
import { pdfStyles, formatDateFull } from './pdf-styles'
import { isPickup } from '@/lib/order-statuses'
import type { StoreOrder } from '@/lib/orders'

type PdfFooterProps = {
  order: StoreOrder
  storeName: string
  storeWhatsapp: string | null
}

export function PdfFooter({ order, storeName, storeWhatsapp }: PdfFooterProps) {
  const pickup = isPickup(order.delivery_method)

  return (
    <View style={pdfStyles.footer}>
      <Text style={pdfStyles.footerText}>
        Agradecemos pela preferência.{' '}
        {pickup
          ? 'O pedido está disponível para retirada conforme as informações acima.'
          : 'Seu pedido está sendo processado e será entregue no endereço informado.'}
      </Text>

      {storeWhatsapp ? (
        <Link
          src={`https://wa.me/${storeWhatsapp.replace(/\D/g, '')}`}
          style={[pdfStyles.footerText, { color: '#2563eb', marginTop: 4 }]}
        >
          Dúvidas? Fale conosco pelo WhatsApp
        </Link>
      ) : null}

      <Text style={[pdfStyles.footerText, { marginTop: 6 }]}>
        Documento gerado em {formatDateFull(new Date().toISOString())}
      </Text>
      <Text style={pdfStyles.footerStoreName}>
        {storeName} — Pedido #{order.id.split('-')[0].toUpperCase()}
      </Text>
    </View>
  )
}
