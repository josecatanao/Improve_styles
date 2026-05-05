import { View, Text } from '@react-pdf/renderer'
import { pdfStyles, formatCurrency, getVariantLabel } from './pdf-styles'
import type { StoreOrder } from '@/lib/orders'

type PdfProductsTableProps = {
  order: StoreOrder
}

export function PdfProductsTable({ order }: PdfProductsTableProps) {
  return (
    <View>
      <Text style={pdfStyles.sectionTitle}>Itens do pedido</Text>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.tableHeaderCell, pdfStyles.tableCellProduct]}>Produto</Text>
          <Text style={[pdfStyles.tableHeaderCell, pdfStyles.tableCellVariant]}>Variação</Text>
          <Text style={[pdfStyles.tableHeaderCell, pdfStyles.tableCellQty]}>Qtd</Text>
          <Text style={[pdfStyles.tableHeaderCell, pdfStyles.tableCellUnitPrice]}>Unitário</Text>
          <Text style={[pdfStyles.tableHeaderCell, pdfStyles.tableCellSubtotal]}>Subtotal</Text>
        </View>

        {order.store_order_items.map((item) => {
          const variantLabel = getVariantLabel(item)
          const subtotal = item.price * item.quantity

          return (
            <View style={pdfStyles.tableRow} key={item.id} wrap={false}>
              <View style={pdfStyles.tableCellProduct}>
                <Text style={pdfStyles.productName}>{item.name}</Text>
              </View>
              <View style={pdfStyles.tableCellVariant}>
                <Text style={pdfStyles.productVariant}>{variantLabel || '—'}</Text>
              </View>
              <View style={pdfStyles.tableCellQty}>
                <Text style={pdfStyles.productQty}>{item.quantity}</Text>
              </View>
              <View style={pdfStyles.tableCellUnitPrice}>
                <Text style={pdfStyles.productPrice}>{formatCurrency(item.price)}</Text>
              </View>
              <View style={pdfStyles.tableCellSubtotal}>
                <Text style={pdfStyles.productSubtotal}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
