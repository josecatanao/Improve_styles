import { Document, Page } from '@react-pdf/renderer'
import { pdfStyles } from './pdf-styles'
import { PdfHeader } from './PdfHeader'
import { PdfCustomerBlock } from './PdfCustomerBlock'
import { PdfDeliveryBlock } from './PdfDeliveryBlock'
import { PdfProductsTable } from './PdfProductsTable'
import { PdfFinancialSummary } from './PdfFinancialSummary'
import { PdfPaymentBlock } from './PdfPaymentBlock'
import { PdfNotesBlock } from './PdfNotesBlock'
import { PdfFooter } from './PdfFooter'
import type { StoreOrder } from '@/lib/orders'

export type OrderPDFSettings = {
  storeName: string
  storeLogoUrl: string | null
  storeWhatsapp: string | null
  storeAddress: string | null
}

type PedidoPDFDocumentProps = {
  order: StoreOrder
  settings: OrderPDFSettings
}

export function PedidoPDFDocument({ order, settings }: PedidoPDFDocumentProps) {
  const storeName = settings.storeName || 'Improve Styles'

  return (
    <Document
      title={`Pedido #${order.id.split('-')[0].toUpperCase()}`}
      author={storeName}
      subject={`Comprovante de pedido #${order.id.split('-')[0].toUpperCase()}`}
      creator={storeName}
      language="pt-BR"
    >
      <Page size="A4" style={pdfStyles.page} wrap>
        <PdfHeader
          order={order}
          storeName={storeName}
          storeLogoUrl={settings.storeLogoUrl}
          storeWhatsapp={settings.storeWhatsapp}
        />

        <PdfCustomerBlock order={order} />

        <PdfDeliveryBlock
          order={order}
          storeAddress={settings.storeAddress}
        />

        <PdfProductsTable order={order} />

        <PdfFinancialSummary order={order} />

        <PdfPaymentBlock order={order} />

        <PdfNotesBlock order={order} />

        <PdfFooter
          order={order}
          storeName={storeName}
          storeWhatsapp={settings.storeWhatsapp}
        />
      </Page>
    </Document>
  )
}
