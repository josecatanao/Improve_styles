import type { CartItem } from '@/components/store/CartProvider'

export const STORE_ORDER_STORAGE_KEY = 'improve-style-orders'
export const STORE_ORDER_EVENT = 'improve-style-orders-updated'

export type StoreOrderCustomer = {
  name: string
  phone: string
  notes: string
  delivery_method: string
  payment_method: string
  installments: number
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
}

export type StoreOrder = {
  id: string
  createdAt: string
  customer: StoreOrderCustomer
  items: CartItem[]
  totalPrice: number
  totalItems: number
}

let cachedRaw: string | null = null
let cachedOrders: StoreOrder[] = []
const EMPTY_ORDERS: StoreOrder[] = []

export function readStoredOrders() {
  if (typeof window === 'undefined') {
    return EMPTY_ORDERS
  }

  try {
    const raw = window.localStorage.getItem(STORE_ORDER_STORAGE_KEY)
    if (raw === cachedRaw) {
      return cachedOrders
    }

    cachedRaw = raw
    if (raw) {
      cachedOrders = JSON.parse(raw) as StoreOrder[]
    } else {
      cachedOrders = EMPTY_ORDERS
    }
    return cachedOrders
  } catch {
    window.localStorage.removeItem(STORE_ORDER_STORAGE_KEY)
    cachedRaw = null
    cachedOrders = EMPTY_ORDERS
    return cachedOrders
  }
}

export function writeStoredOrders(orders: StoreOrder[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORE_ORDER_STORAGE_KEY, JSON.stringify(orders))
  window.dispatchEvent(new Event(STORE_ORDER_EVENT))
}

export function saveStoreOrder(order: StoreOrder) {
  const current = readStoredOrders()
  writeStoredOrders([order, ...current].slice(0, 20))
}
