'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice, cartSubtotal, productUrl } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const { items, updateQty, removeItem } = useCartStore()
  const subtotal = cartSubtotal(items)

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#1A1A5E] mb-4">Your Cart</h1>
        <p className="text-gray-500 mb-6">Your cart is empty.</p>
        <Link href="/">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Your Cart</h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {items.map((item, i) => (
          <div
            key={item.product_id}
            className={`flex gap-4 p-4 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}
          >
            {/* Image */}
            <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
              <Image
                src={item.images[0] ?? 'https://atmar.bg/atmar_horeca_logo_512x512.jpg'}
                alt={item.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <Link
                href={productUrl(item)}
                className="text-sm font-semibold text-[#1A1A5E] hover:underline line-clamp-2"
              >
                {item.name}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">{formatPrice(item.price)} each</p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.product_id, item.qty - 1)}
                disabled={item.qty <= 1}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
              <button
                onClick={() => updateQty(item.product_id, item.qty + 1)}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Line total */}
            <span className="w-24 text-right text-sm font-bold text-[#1A1A5E] shrink-0">
              {formatPrice(item.price * item.qty)}
            </span>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.product_id)}
              className="p-1.5 text-gray-400 hover:text-[#C0392B] transition-colors"
              aria-label="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subtotal (excl. VAT &amp; shipping)</span>
          <span className="font-bold text-[#1A1A5E]">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-gray-400 mb-6">VAT and shipping calculated at checkout</p>

        <Link href="/checkout">
          <Button size="lg" className="w-full">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </div>
  )
}
