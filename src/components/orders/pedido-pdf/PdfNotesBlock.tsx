import { View, Text } from '@react-pdf/renderer'
import { pdfStyles, formatCurrency } from './pdf-styles'
import type { StoreOrder } from '@/lib/orders'

type PdfNotesBlockProps = {
  order: StoreOrder
}

export function PdfNotesBlock({ order }: PdfNotesBlockProps) {
  if (!order.notes?.trim()) {
    return null
  }

  return (
    <View style={pdfStyles.notesBlock}>
      <Text style={pdfStyles.notesLabel}>Observações</Text>
      <Text style={pdfStyles.notesText}>{order.notes.trim()}</Text>
    </View>
  )
}
