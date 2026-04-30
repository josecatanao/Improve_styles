'use client'

import { createContext, useContext, useSyncExternalStore, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export type CartItem = {
  id: string
  productId: string
  name: string
  category?: string | null
  price: number
  quantity: number
  image: string | null
  size?: string | null
  colorName?: string | null
  colorHex?: string | null
  sku?: string | null
}

export function buildCartItemId(productId: string, colorHex?: string | null, size?: string | null): string {
  return `${productId}:${colorHex || 'no-color'}:${size || 'no-size'}`
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
  wishlist: string[]
  addToWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  appliedCoupon: { id: string; code: string; discount_type: 'percentage' | 'fixed' | 'free_shipping'; discount_value: number; min_order_value: number | null; productIds: string[]; categories: string[] } | null
  applyCoupon: (coupon: { id: string; code: string; discount_type: 'percentage' | 'fixed' | 'free_shipping'; discount_value: number; min_order_value: number | null; productIds: string[]; categories: string[] }) => void
  removeCoupon: () => void
}

const CART_STORAGE_KEY = 'improve-style-cart'
const CART_EVENT = 'improve-style-cart-updated'
const WISHLIST_STORAGE_KEY = 'improve-style-wishlist'
const WISHLIST_EVENT = 'improve-style-wishlist-updated'
const COUPON_STORAGE_KEY = 'improve-style-coupon'
const CartContext = createContext<CartContextValue | null>(null)
const EMPTY_CART: CartItem[] = []
const EMPTY_WISHLIST: string[] = []
let cartSnapshot: CartItem[] = EMPTY_CART
let wishlistSnapshot: string[] = EMPTY_WISHLIST

function readWishlistFromLocalStorage() {
  try {
    const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as string[]) : EMPTY_WISHLIST
  } catch {
    window.localStorage.removeItem(WISHLIST_STORAGE_KEY)
    return EMPTY_WISHLIST
  }
}

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

function readWishlistFromStorage() {
  if (typeof window === 'undefined') {
    return wishlistSnapshot
  }

  const latest = readWishlistFromLocalStorage()

  if (JSON.stringify(latest) !== JSON.stringify(wishlistSnapshot)) {
    wishlistSnapshot = latest
  }

  return wishlistSnapshot
}

function writeItemsToStorage(items: CartItem[]) {
  cartSnapshot = items
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_EVENT))
}

function writeWishlistToStorage(ids: string[]) {
  wishlistSnapshot = ids
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event(WISHLIST_EVENT))
}

function subscribeCart(callback: () => void) {
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

function subscribeWishlist(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  function handleChange() {
    wishlistSnapshot = readWishlistFromLocalStorage()
    callback()
  }

  window.addEventListener(WISHLIST_EVENT, handleChange)
  window.addEventListener('storage', handleChange)

  return () => {
    window.removeEventListener(WISHLIST_EVENT, handleChange)
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
  const items = useSyncExternalStore(subscribeCart, readItemsFromStorage, () => EMPTY_CART)
  const wishlist = useSyncExternalStore(subscribeWishlist, readWishlistFromStorage, () => EMPTY_WISHLIST)
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_type: 'percentage' | 'fixed' | 'free_shipping'; discount_value: number; min_order_value: number | null; productIds: string[]; categories: string[] } | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = window.localStorage.getItem(COUPON_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const { totalItems, totalPrice } = getItemTotals(items)

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon))
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY)
    }
  }, [appliedCoupon])
  const supabase = createClient()
  const userIdRef = useRef<string | null>(null)
  const appliedCouponRef = useRef(appliedCoupon)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    appliedCouponRef.current = appliedCoupon
  }, [appliedCoupon])

  useEffect(() => {
    async function fetchDBCart(userId: string, isLoginEvent: boolean) {
      const { data } = await supabase.from('customer_profiles').select('cart, wishlist, coupon').eq('id', userId).single()
      const dbCart = (data?.cart as CartItem[]) || []
      const dbWishlist = (data?.wishlist as string[]) || EMPTY_WISHLIST
      const dbCoupon = (data?.coupon as { id: string; code: string; discount_type: 'percentage' | 'fixed' | 'free_shipping'; discount_value: number; min_order_value: number | null; productIds: string[]; categories: string[] } | null) || null

        if (isLoginEvent) {
        const currentLocal = readItemsFromStorage()
        const merged = [...dbCart]

        for (const localItem of currentLocal) {
          const index = merged.findIndex((i) => i.id === localItem.id)
          if (index === -1) {
            merged.push(localItem)
          } else {
            merged[index].quantity = Math.max(merged[index].quantity, localItem.quantity)
          }
        }

        writeItemsToStorage(merged)

        const currentLocalWishlist = readWishlistFromLocalStorage()
        const mergedWishlist = [...new Set([...dbWishlist, ...currentLocalWishlist])]
        writeWishlistToStorage(mergedWishlist)

        if (dbCoupon && !appliedCouponRef.current) {
          setAppliedCoupon(dbCoupon)
        }
      } else {
        writeItemsToStorage(dbCart)
        const currentLocalWishlist = readWishlistFromLocalStorage()
        const mergedWishlist = [...new Set([...dbWishlist, ...currentLocalWishlist])]
        writeWishlistToStorage(mergedWishlist)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user
      if (user && user.user_metadata?.account_type === 'customer') {
        if (userIdRef.current !== user.id) {
           userIdRef.current = user.id
           fetchDBCart(user.id, event === 'SIGNED_IN')
        }
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null
        writeItemsToStorage([])
        setAppliedCoupon(null)
      }
    })

    supabase.auth.getUser().then(({ data }) => {
      if (data.user && data.user.user_metadata?.account_type === 'customer') {
        if (userIdRef.current !== data.user.id) {
          userIdRef.current = data.user.id
          fetchDBCart(data.user.id, false)
        }
      }
    })

    const readyTimer = window.setTimeout(() => {
      setIsReady(true)
    }, 0)

    return () => {
      window.clearTimeout(readyTimer)
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (isReady && userIdRef.current) {
      void supabase.from('customer_profiles').update({ cart: items, wishlist, coupon: appliedCoupon }).eq('id', userIdRef.current)
    }
  }, [appliedCoupon, isReady, items, supabase, wishlist])

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
    setAppliedCoupon(null)
  }

  function applyCoupon(coupon: { id: string; code: string; discount_type: 'percentage' | 'fixed' | 'free_shipping'; discount_value: number; min_order_value: number | null; productIds: string[]; categories: string[] }) {
    setAppliedCoupon(coupon)
  }

  function removeCoupon() {
    setAppliedCoupon(null)
  }

  function addToWishlist(productId: string) {
    const current = readWishlistFromStorage()
    if (!current.includes(productId)) {
      writeWishlistToStorage([...current, productId])
    }
  }

  function removeFromWishlist(productId: string) {
    const current = readWishlistFromStorage()
    writeWishlistToStorage(current.filter((id) => id !== productId))
  }

  function isInWishlist(productId: string) {
    return wishlist.includes(productId)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        isReady: isReady,
        totalItems,
        totalPrice,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
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
