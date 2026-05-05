import { View, Text } from '@react-pdf/renderer'
import { pdfStyles, formatCurrency } from './pdf-styles'
import type { StoreOrder } from '@/lib/orders'

type PdfFinancialSummaryProps = {
  order: StoreOrder
}

export function PdfFinancialSummary({ order }: PdfFinancialSummaryProps) {
  const subtotal = order.store_order_items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const shippingCost = Number(order.shipping_cost || 0)
  const discount = Number(order.discount_amount || 0)
  const computedDiscount = discount > 0
    ? discount
    : Math.max(0, subtotal + shippingCost - Number(order.total_price))

  return (
    <View style={pdfStyles.summaryContainer}>
      <View style={pdfStyles.summaryBox}>
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Subtotal</Text>
          <Text style={pdfStyles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>

        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>
            {shippingCost === 0 ? 'Frete grátis' : 'Frete'}
          </Text>
          <Text style={pdfStyles.summaryValue}>
            {shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)}
          </Text>
        </View>

        {computedDiscount > 0 ? (
          <View style={pdfStyles.summaryRow}>
            <Text style={pdfStyles.summaryDiscountLabel}>
              Desconto{order.coupon_code ? ` (${order.coupon_code})` : ''}
            </Text>
            <Text style={pdfStyles.summaryDiscountValue}>
              – {formatCurrency(computedDiscount)}
            </Text>
          </View>
        ) : null}

        <View style={[pdfStyles.summaryRow, pdfStyles.summaryTotalBorder]}>
          <Text style={pdfStyles.summaryTotalLabel}>Total</Text>
          <Text style={pdfStyles.summaryTotalValue}>{formatCurrency(order.total_price)}</Text>
        </View>
      </View>
    </View>
  )
}
