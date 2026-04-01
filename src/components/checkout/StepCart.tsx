import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { useCartStore } from '@/lib/cart-store'
import { createClient } from '@/lib/supabase/client'
import type { StepProps } from './types'

export default function StepCart({ items, subtotal, setStep }: StepProps) {
  const { updateQty, removeItem } = useCartStore()
  const [minimumErrors, setMinimumErrors] = useState<string[]>([])

  useEffect(() => {
    const brandIds = [...new Set(items.map((i) => i.brand_id).filter(Boolean))] as string[]
    if (brandIds.length === 0) { setMinimumErrors([]); return }

    const supabase = createClient()
    supabase
      .from('brands')
      .select('id, name, minimum_order_amount')
      .in('id', brandIds)
      .then(({ data }) => {
        if (!data) return
        const errors: string[] = []
        for (const brand of data) {
          if (!brand.minimum_order_amount) continue
          const total = items
            .filter((i) => i.brand_id === brand.id)
            .reduce((sum, i) => sum + i.price * i.qty, 0)
          if (total < brand.minimum_order_amount) {
            errors.push(`Minimum order for ${brand.name} is ${formatPrice(brand.minimum_order_amount)}. Your current total is ${formatPrice(total)}.`)
          }
        }
        setMinimumErrors(errors)
      })
  }, [items])

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Step 1 — Cart Review</h2>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        {items.map((item, i) => (
          <div key={item.product_id} className={`flex gap-4 p-4 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <Link href={`/products/${encodeURIComponent(item.sku ?? item.slug)}/${item.slug}`} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 hover:opacity-80 transition-opacity">
              <Image src={item.images[0] ?? 'https://atmar.bg/atmar_horeca_logo_512x512.jpg'} alt={item.name} fill className="object-contain" unoptimized />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A5E] line-clamp-2">{item.name}</p>
              <p className="text-xs text-gray-500">{formatPrice(item.price)} each</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateQty(item.product_id, item.qty - 1)} disabled={item.qty <= 1} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
              <button onClick={() => updateQty(item.product_id, item.qty + 1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="w-20 text-right text-sm font-bold text-[#1A1A5E] shrink-0">{formatPrice(item.price * item.qty)}</span>
            <button onClick={() => removeItem(item.product_id)} className="p-1 text-gray-400 hover:text-[#C0392B]">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {minimumErrors.length > 0 && (
        <div className="bg-[#FFF8E1] border border-[#F0A500] rounded-xl p-4 mb-4 flex flex-col gap-1.5">
          {minimumErrors.map((err, i) => (
            <p key={i} className="text-sm text-gray-700">{err}</p>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">Subtotal (excl. VAT &amp; shipping)</p>
          <p className="text-lg font-bold text-[#1A1A5E]">{formatPrice(subtotal)}</p>
        </div>
        <Button size="lg" onClick={() => setStep(2)} disabled={minimumErrors.length > 0}>
          Continue
        </Button>
      </div>
    </div>
  )
}
