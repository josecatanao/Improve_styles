import { StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf',
      fontWeight: 700,
    },
  ],
})

export const pdfTheme = {
  colors: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#64748b',
    border: '#e2e8f0',
    lightBorder: '#f1f5f9',
    success: '#059669',
    successBg: '#ecfdf5',
    accent: '#2563eb',
    accentBg: '#eff6ff',
    warning: '#d97706',
    warningBg: '#fffbeb',
    info: '#4f46e5',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
    background: '#f8fafc',
    white: '#ffffff',
  },
  fonts: {
    family: 'Inter',
  },
}

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: pdfTheme.colors.primary,
    padding: '16mm 18mm',
    lineHeight: 1.5,
  },

  // ── Header ─────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: pdfTheme.colors.border,
  },
  headerLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  headerLogo: {
    height: 44,
    maxWidth: 110,
    objectFit: 'contain',
  },
  headerStoreName: {
    fontSize: 17,
    fontWeight: 700,
    color: pdfTheme.colors.primary,
    lineHeight: 1,
  },
  headerContact: {
    fontSize: 9,
    color: pdfTheme.colors.secondary,
    marginTop: 4,
  },
  headerDocumentLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: pdfTheme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 3.5,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.border,
  },
  headerRight: {
    textAlign: 'right',
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 24,
  },
  headerOrderCode: {
    fontSize: 28,
    fontWeight: 700,
    color: pdfTheme.colors.primary,
    lineHeight: 1,
  },
  headerOrderLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: pdfTheme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 9.5,
    color: pdfTheme.colors.secondary,
    marginTop: 8,
  },
  headerStatusBadge: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: pdfTheme.colors.accentBg,
    color: pdfTheme.colors.accent,
  },

  // ── Section Titles ─────────────────────────────────────
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: pdfTheme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: pdfTheme.colors.border,
  },

  // ── Two-column info blocks ─────────────────────────────
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.lightBorder,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: pdfTheme.colors.muted,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 10.5,
    fontWeight: 600,
    color: pdfTheme.colors.primary,
    marginBottom: 1,
  },
  infoSecondary: {
    fontSize: 9,
    color: pdfTheme.colors.secondary,
    marginBottom: 1,
  },

  // ── Delivery section ───────────────────────────────────
  deliveryBlock: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.lightBorder,
  },
  deliveryMethodBadge: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  deliveryAddress: {
    fontSize: 9,
    color: pdfTheme.colors.secondary,
    lineHeight: 1.6,
  },
  deliveryStoreAddress: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.lightBorder,
  },
  deliveryStoreAddressLabel: {
    fontSize: 8.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: pdfTheme.colors.muted,
    marginBottom: 4,
  },
  deliveryStoreAddressText: {
    fontSize: 9,
    color: pdfTheme.colors.secondary,
    lineHeight: 1.5,
  },

  // ── Products Table ─────────────────────────────────────
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: pdfTheme.colors.border,
    paddingVertical: 9,
    paddingHorizontal: 8,
    backgroundColor: pdfTheme.colors.background,
  },
  tableHeaderCell: {
    fontSize: 8.5,
    fontWeight: 700,
    color: pdfTheme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.lightBorder,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 40,
  },
  tableCellProduct: {
    flex: 2.5,
    paddingRight: 8,
  },
  tableCellVariant: {
    flex: 1.5,
    paddingRight: 8,
  },
  tableCellQty: {
    flex: 0.7,
    paddingRight: 8,
  },
  tableCellUnitPrice: {
    flex: 1.3,
    paddingRight: 8,
    textAlign: 'right',
  },
  tableCellSubtotal: {
    flex: 1.3,
    textAlign: 'right',
  },
  productName: {
    fontSize: 10,
    fontWeight: 600,
    color: pdfTheme.colors.primary,
  },
  productVariant: {
    fontSize: 8,
    color: pdfTheme.colors.muted,
    marginTop: 2,
  },
  productQty: {
    fontSize: 10,
    color: pdfTheme.colors.secondary,
  },
  productPrice: {
    fontSize: 10,
    color: pdfTheme.colors.secondary,
  },
  productSubtotal: {
    fontSize: 10,
    fontWeight: 600,
    color: pdfTheme.colors.primary,
  },

  // ── Financial Summary ──────────────────────────────────
  summaryContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: pdfTheme.colors.border,
  },
  summaryBox: {
    width: '45%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: pdfTheme.colors.secondary,
  },
  summaryValue: {
    fontSize: 10,
    color: pdfTheme.colors.secondary,
  },
  summaryDiscountLabel: {
    fontSize: 10,
    color: pdfTheme.colors.success,
  },
  summaryDiscountValue: {
    fontSize: 10,
    color: pdfTheme.colors.success,
    fontWeight: 600,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: pdfTheme.colors.primary,
  },
  summaryTotalValue: {
    fontSize: 13,
    fontWeight: 700,
    color: pdfTheme.colors.primary,
  },
  summaryTotalBorder: {
    borderTopWidth: 2,
    borderTopColor: pdfTheme.colors.primary,
    paddingTop: 7,
    marginTop: 5,
  },

  // ── Payment Section ────────────────────────────────────
  paymentBlock: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: pdfTheme.colors.background,
    borderRadius: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 10,
    color: pdfTheme.colors.secondary,
  },
  paymentValue: {
    fontSize: 10,
    fontWeight: 600,
    color: pdfTheme.colors.primary,
  },
  paymentStatusBadge: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 3,
  },

  // ── Notes Section ──────────────────────────────────────
  notesBlock: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: pdfTheme.colors.background,
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: pdfTheme.colors.muted,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: pdfTheme.colors.secondary,
    lineHeight: 1.5,
  },

  // ── Extra Info ─────────────────────────────────────────
  extraInfoBlock: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: pdfTheme.colors.background,
    borderRadius: 6,
  },
  extraInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  extraInfoLabel: {
    fontSize: 9,
    color: pdfTheme.colors.secondary,
  },
  extraInfoValue: {
    fontSize: 9,
    fontWeight: 600,
    color: pdfTheme.colors.primary,
  },

  // ── Footer ─────────────────────────────────────────────
  footer: {
    textAlign: 'center',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.border,
    marginTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: pdfTheme.colors.muted,
  },
  footerStoreName: {
    fontSize: 8,
    color: pdfTheme.colors.secondary,
    marginTop: 3,
  },
})

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDateFull(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getOrderCode(orderId: string): string {
  return orderId.split('-')[0].toUpperCase()
}

export function getVariantLabel(item: { size?: string | null; color_name?: string | null; sku?: string | null }): string {
  const parts: string[] = []
  if (item.color_name?.trim()) parts.push(item.color_name.trim())
  if (item.size?.trim()) parts.push(item.size.trim())
  if (item.sku?.trim()) parts.push(`SKU: ${item.sku.trim()}`)
  return parts.join(' / ')
}

export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'completed':
      return { bg: pdfTheme.colors.successBg, text: pdfTheme.colors.success }
    case 'processing':
      return { bg: pdfTheme.colors.accentBg, text: pdfTheme.colors.accent }
    case 'shipped':
      return { bg: pdfTheme.colors.accentBg, text: pdfTheme.colors.info }
    case 'pending':
      return { bg: pdfTheme.colors.warningBg, text: pdfTheme.colors.warning }
    case 'cancelled':
      return { bg: pdfTheme.colors.dangerBg, text: pdfTheme.colors.danger }
    default:
      return { bg: pdfTheme.colors.background, text: pdfTheme.colors.muted }
  }
}

export function getDeliveryColor(deliveryMethod: string | undefined | null): { bg: string; text: string } {
  if ((deliveryMethod ?? '').toLowerCase() === 'pickup') {
    return { bg: pdfTheme.colors.successBg, text: pdfTheme.colors.success }
  }
  return { bg: pdfTheme.colors.accentBg, text: pdfTheme.colors.accent }
}
