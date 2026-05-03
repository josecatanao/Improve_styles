'use client'

import { useCallback, useRef, useState } from 'react'
import type { ProductFormState, ColorGroup, ImageItem } from '@/components/products/ProductForm'

export { type ProductFormState, type ColorGroup, type ImageItem }

type DraftData = {
  form: ProductFormState
  step: number
  productType: 'simple' | 'variant'
  colorGroups: ColorGroup[]
  categoryDraft: string
  brandDraft: string
  sizeDrafts: Record<string, string>
  imageUrlDraft: string
  mode: 'create' | 'edit'
  showMeasures: boolean
}

const DRAFT_KEY_PREFIX = 'product-form-draft'

function buildDraftKey(mode: 'create' | 'edit', productId?: string | null): string {
  if (mode === 'edit' && productId) {
    return `${DRAFT_KEY_PREFIX}-edit-${productId}`
  }
  return `${DRAFT_KEY_PREFIX}-create`
}

function checkHasDraft(draftKey: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(draftKey)
    if (raw) {
      JSON.parse(raw)
      return true
    }
  } catch {
    try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
  }
  return false
}

export function useProductDraft(mode: 'create' | 'edit', productId?: string | null) {
  const draftKey = buildDraftKey(mode, productId)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hasDraft] = useState(() => checkHasDraft(draftKey))
  const [draftRestored, setDraftRestored] = useState(false)

  const saveDraft = useCallback(
    (data: DraftData) => {
      if (typeof window === 'undefined') return
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify(data))
        } catch {
          try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
        }
      }, 500)
    },
    [draftKey]
  )

  const loadDraft = useCallback((): DraftData | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return null
      const parsed = JSON.parse(raw) as DraftData
      setDraftRestored(true)
      return parsed
    } catch {
      try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
      return null
    }
  }, [draftKey])

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(draftKey)
      } catch {
        // ignore
      }
    }
    setDraftRestored(false)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }, [draftKey])

  const discardDraft = useCallback(() => {
    clearDraft()
  }, [clearDraft])

  return {
    hasDraft,
    draftRestored,
    saveDraft,
    loadDraft,
    clearDraft,
    discardDraft,
  }
}
