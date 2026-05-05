import { View, Text } from '@react-pdf/renderer'
import { pdfStyles, getDeliveryColor } from './pdf-styles'
import { isPickup } from '@/lib/order-statuses'
import type { StoreOrder } from '@/lib/orders'

type PdfDeliveryBlockProps = {
  order: StoreOrder
  storeAddress: string | null
}

export function PdfDeliveryBlock({ order, storeAddress }: PdfDeliveryBlockProps) {
  const pickup = isPickup(order.delivery_method)
  const deliveryColors = getDeliveryColor(order.delivery_method)

  return (
    <View style={pdfStyles.deliveryBlock}>
      <Text style={pdfStyles.sectionTitle}>
        {pickup ? 'Retirada na loja' : 'Endereço de entrega'}
      </Text>

      {pickup ? (
        <View>
          <Text
            style={[
              pdfStyles.deliveryMethodBadge,
              {
                backgroundColor: deliveryColors.bg,
                color: deliveryColors.text,
              },
            ]}
          >
            Retirada na loja
          </Text>
          {storeAddress?.trim() ? (
            <View style={pdfStyles.deliveryStoreAddress}>
              <Text style={pdfStyles.deliveryStoreAddressLabel}>Endereço da loja</Text>
              <Text style={pdfStyles.deliveryStoreAddressText}>{storeAddress.trim()}</Text>
            </View>
          ) : (
            <Text style={pdfStyles.infoSecondary}>
              O cliente deve comparecer à loja para retirar o pedido.
            </Text>
          )}
        </View>
      ) : (
        <View>
          <Text
            style={[
              pdfStyles.deliveryMethodBadge,
              {
                backgroundColor: deliveryColors.bg,
                color: deliveryColors.text,
              },
            ]}
          >
            Entrega (Delivery)
          </Text>
          <Text style={pdfStyles.deliveryAddress}>
            {order.delivery_address?.trim() || 'Endereço não informado'}
          </Text>
          {order.shipping_zone_name?.trim() ? (
            <View style={pdfStyles.deliveryStoreAddress}>
              <Text style={pdfStyles.deliveryStoreAddressLabel}>Zona de entrega</Text>
              <Text style={pdfStyles.deliveryStoreAddressText}>
                {order.shipping_zone_name}
                {order.shipping_zip?.trim() ? ` — CEP ${order.shipping_zip.trim()}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}
