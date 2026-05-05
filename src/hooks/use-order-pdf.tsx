'use client'

import { useCallback, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { PedidoPDFDocument } from '@/components/orders/pedido-pdf/PedidoPDFDocument'
import type { OrderPDFSettings } from '@/components/orders/pedido-pdf/PedidoPDFDocument'
import type { StoreOrder } from '@/lib/orders'

type UseOrderPDFOptions = {
  order: StoreOrder
  settings: OrderPDFSettings
}

type UseOrderPDFReturn = {
  downloadPDF: () => Promise<void>
  openPDFPreview: () => Promise<void>
  isGenerating: boolean
}

export function useOrderPDF({ order, settings }: UseOrderPDFOptions): UseOrderPDFReturn {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateBlob = useCallback(async (): Promise<Blob> => {
    const doc = <PedidoPDFDocument order={order} settings={settings} />
    const blobResult = await pdf(doc).toBlob()
    return blobResult
  }, [order, settings])

  const downloadPDF = useCallback(async () => {
    setIsGenerating(true)
    try {
      const blob = await generateBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const orderCode = order.id.split('-')[0].toUpperCase()
      link.href = url
      link.download = `Pedido_${orderCode}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsGenerating(false)
    }
  }, [generateBlob, order.id])

  const openPDFPreview = useCallback(async () => {
    setIsGenerating(true)
    try {
      const blob = await generateBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setIsGenerating(false)
    }
  }, [generateBlob])

  return { downloadPDF, openPDFPreview, isGenerating }
}
