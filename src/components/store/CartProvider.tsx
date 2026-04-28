'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'

export type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string | null
  size?: string | null
  colorName?: string | null
  colorHex?: string | null
  sku?: string | null
}

type CartContextValue = {
  items: CartItem[]
  isReady: boolean
  totalItems: number
  totalPrice: number
  addItem: (item: CartItem) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CART_STORAGE_KEY = 'improve-style-cart'
const CART_EVENT = 'improve-style-cart-updated'
const CartContext = createContext<CartContextValue | null>(null)
const EMPTY_CART: CartItem[] = []
let cartSnapshot: CartItem[] = EMPTY_CART

function readItemsFromLocalStorage() {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as CartItem[]) : EMPTY_CART
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY)
    return EMPTY_CART
  }
}

function readItemsFromStorage() {
  if (typeof window === 'undefined') {
    return cartSnapshot
  }

  const latest = readItemsFromLocalStorage()

  if (JSON.stringify(latest) !== JSON.stringify(cartSnapshot)) {
    cartSnapshot = latest
  }

  return cartSnapshot
}

function writeItemsToStorage(items: CartItem[]) {
  cartSnapshot = items
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_EVENT))
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  function handleChange() {
    cartSnapshot = readItemsFromLocalStorage()
    callback()
  }

  window.addEventListener(CART_EVENT, handleChange)
  window.addEventListener('storage', handleChange)

  return () => {
    window.removeEventListener(CART_EVENT, handleChange)
    window.removeEventListener('storage', handleChange)
  }
}

function getItemTotals(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  return {
    totalItems,
    totalPrice,
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readItemsFromStorage, () => EMPTY_CART)
  const { totalItems, totalPrice } = getItemTotals(items)

  function addItem(item: CartItem) {
    const current = readItemsFromStorage()
    const existingIndex = current.findIndex((entry) => entry.id === item.id)

    if (existingIndex >= 0) {
      writeItemsToStorage(
        current.map((entry, index) =>
          index === existingIndex
            ? {
                ...entry,
                quantity: entry.quantity + item.quantity,
              }
            : entry
        )
      )
      return
    }

    writeItemsToStorage([...current, item])
  }

  function updateQuantity(id: string, quantity: number) {
    const current = readItemsFromStorage()
    writeItemsToStorage(
      current
        .map((item) => (item.id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    )
  }

  function removeItem(id: string) {
    const current = readItemsFromStorage()
    writeItemsToStorage(current.filter((item) => item.id !== id))
  }

  function clearCart() {
    writeItemsToStorage([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        isReady: true,
        totalItems,
        totalPrice,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
