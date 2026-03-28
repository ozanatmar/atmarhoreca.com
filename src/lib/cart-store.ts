import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(item) {
        const existing = get().items.find((i) => i.product_id === item.product_id)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, qty: i.qty + item.qty }
                : i,
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, item] }))
        }
      },

      updateQty(productId, qty) {
        if (qty < 1) return
        set((s) => ({
          items: s.items.map((i) =>
            i.product_id === productId ? { ...i, qty } : i,
          ),
        }))
      },

      removeItem(productId) {
        set((s) => ({ items: s.items.filter((i) => i.product_id !== productId) }))
      },

      clearCart() {
        set({ items: [] })
      },
    }),
    { name: 'atmar-cart' },
  ),
)
