import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQty: (cartKey: string, qty: number) => void
  removeItem: (cartKey: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(item) {
        const key = item.cart_key
        const existing = get().items.find((i) => (i.cart_key ?? i.product_id) === key)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              (i.cart_key ?? i.product_id) === key
                ? { ...i, qty: i.qty + item.qty }
                : i,
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, item] }))
        }
      },

      updateQty(cartKey, qty) {
        if (qty < 1) return
        set((s) => ({
          items: s.items.map((i) =>
            (i.cart_key ?? i.product_id) === cartKey ? { ...i, qty } : i,
          ),
        }))
      },

      removeItem(cartKey) {
        set((s) => ({ items: s.items.filter((i) => (i.cart_key ?? i.product_id) !== cartKey) }))
      },

      clearCart() {
        set({ items: [] })
      },
    }),
    { name: 'atmar-cart' },
  ),
)
