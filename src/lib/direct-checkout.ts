'use client'

import { useSyncExternalStore } from 'react'
import type { CartItem } from '@/components/store/CartProvider'

const DIRECT_CHECKOUT_KEY = 'improve-style-direct-checkout'
const DIRECT_CHECKOUT_EVENT = 'improve-style-direct-checkout-updated'

let cachedRaw: string | null = null
let cachedItems: CartItem[] | null = null

function readSnapshot(): CartItem[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DIRECT_CHECKOUT_KEY)
    if (raw === cachedRaw) return cachedItems
    cachedRaw = raw
    cachedItems = raw ? JSON.parse(raw) : null
    return cachedItems
  } catch {
    window.localStorage.removeItem(DIRECT_CHECKOUT_KEY)
    cachedRaw = null
    cachedItems = null
    return null
  }
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(DIRECT_CHECKOUT_EVENT, callback)
  return () => window.removeEventListener(DIRECT_CHECKOUT_EVENT, callback)
}

export function useDirectCheckout() {
  return useSyncExternalStore(subscribe, readSnapshot, () => null)
}

export function setDirectCheckoutItem(item: CartItem) {
  if (typeof window === 'undefined') return
  const json = JSON.stringify([item])
  cachedRaw = json
  cachedItems = [item]
  window.localStorage.setItem(DIRECT_CHECKOUT_KEY, json)
  window.dispatchEvent(new Event(DIRECT_CHECKOUT_EVENT))
}

export function clearDirectCheckout() {
  if (typeof window === 'undefined') return
  cachedRaw = null
  cachedItems = null
  window.localStorage.removeItem(DIRECT_CHECKOUT_KEY)
  window.dispatchEvent(new Event(DIRECT_CHECKOUT_EVENT))
}
