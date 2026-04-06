'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice, productUrl } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Product, SelectedOption } from '@/types'

interface Props {
  product: Product
}

export default function ProductPurchaseSection({ product }: Props) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [selections, setSelections] = useState<Record<string, { label: string; price_modifier: number }>>({})
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
  }, [])

  // Default first option for each group
  useEffect(() => {
    if (!product.option_groups?.length) return
    const defaults: typeof selections = {}
    for (const group of product.option_groups) {
      if (group.options.length > 0) {
        defaults[group.name] = group.options[0]
      }
    }
    setSelections(defaults)
  }, [product.id])

  const totalModifier = Object.values(selections).reduce((sum, o) => sum + o.price_modifier, 0)
  const computedPrice = product.price + totalModifier

  const brandObj = Array.isArray(product.brand) ? product.brand[0] : product.brand
  const isTypeB =
    product.requires_confirmation ||
    (brandObj?.default_requires_confirmation ?? false) ||
    product.shipping_inefficient ||
    product.stock_status !== 'in_stock'
  const label = isTypeB ? 'Request Order' : 'Add to Cart'

  function handleClick() {
    if (!loggedIn) {
      router.push(`/login?next=${productUrl(product)}`)
      return
    }

    const brand = Array.isArray(product.brand) ? product.brand[0] : product.brand
    const brandName = brand?.name ?? null
    const requiresConfirmation = product.requires_confirmation || (brand?.default_requires_confirmation ?? false)

    const selectedOptions: SelectedOption[] = Object.entries(selections).map(([group, opt]) => ({
      group,
      label: opt.label,
      price_modifier: opt.price_modifier,
    }))

    const cartKey = selectedOptions.length
      ? `${product.id}::${selectedOptions.map(o => o.label).join('::')}`
      : product.id

    addItem({
      cart_key: cartKey,
      product_id: product.id,
      brand_id: product.brand_id ?? null,
      brand_name: brandName,
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? null,
      price: computedPrice,
      weight_kg: product.weight_kg,
      qty: 1,
      images: product.images,
      requires_confirmation: requiresConfirmation,
      shipping_inefficient: product.shipping_inefficient,
      stock_status: product.stock_status,
      selected_options: selectedOptions.length ? selectedOptions : undefined,
    })
    router.push('/cart')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Price */}
      <div>
        <span className="text-3xl font-bold text-[#1A1A5E]">{formatPrice(computedPrice)}</span>
        <span className="ml-2 text-sm text-gray-500">excl. VAT</span>
        <p className="text-xs text-gray-400 mt-1">VAT calculated at checkout</p>
      </div>

      {/* Option dropdowns */}
      {product.option_groups?.map(group => (
        <div key={group.name}>
          <label className="text-sm font-medium text-gray-700 block mb-1">{group.name}</label>
          <select
            value={selections[group.name]?.label ?? ''}
            onChange={e => {
              const opt = group.options.find(o => o.label === e.target.value)
              if (opt) setSelections(prev => ({ ...prev, [group.name]: opt }))
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F] bg-white"
          >
            {group.options.map(opt => (
              <option key={opt.label} value={opt.label}>
                {opt.label}{opt.price_modifier !== 0 ? ` (${opt.price_modifier > 0 ? '+' : ''}€${opt.price_modifier.toFixed(2)})` : ''}
              </option>
            ))}
          </select>
        </div>
      ))}

      <Button size="lg" onClick={handleClick} className="w-full sm:w-auto">
        {label}
      </Button>
    </div>
  )
}
