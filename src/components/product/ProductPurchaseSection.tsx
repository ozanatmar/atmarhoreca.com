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
  const [textEnabled, setTextEnabled] = useState<Record<string, boolean>>({})
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const [textErrors, setTextErrors] = useState<Record<string, string>>({})
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
  }, [])

  // Default first option for each select group (skip text_input groups)
  useEffect(() => {
    if (!product.option_groups?.length) return
    const defaults: typeof selections = {}
    for (const group of product.option_groups) {
      if ((group.type ?? 'select') === 'select' && group.options.length > 0) {
        defaults[group.name] = group.options[0]
      }
    }
    setSelections(defaults)
  }, [product.id])

  const selectModifier = Object.values(selections).reduce((sum, o) => sum + o.price_modifier, 0)
  const textModifier = (product.option_groups ?? []).reduce((sum, g) => {
    if ((g.type ?? 'select') === 'text_input' && textEnabled[g.name]) {
      return sum + (g.text_price_modifier ?? 0)
    }
    return sum
  }, 0)
  const totalModifier = selectModifier + textModifier
  const computedPrice = product.price + totalModifier
  const packSize = product.pack_size ?? null
  const packTotal = packSize ? computedPrice * packSize : null

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

    // Validate text_input groups
    const newTextErrors: Record<string, string> = {}
    for (const group of product.option_groups ?? []) {
      if ((group.type ?? 'select') !== 'text_input') continue
      if (!textEnabled[group.name]) continue
      const val = (textValues[group.name] ?? '').trim()
      if (!val) {
        newTextErrors[group.name] = 'Please enter a value.'
      } else if (group.text_pattern && !new RegExp(group.text_pattern, 'i').test(val)) {
        newTextErrors[group.name] = `Invalid format. Expected e.g. ${group.text_placeholder ?? 'RAL 1000'}`
      }
    }
    if (Object.keys(newTextErrors).length > 0) {
      setTextErrors(newTextErrors)
      return
    }

    const brand = Array.isArray(product.brand) ? product.brand[0] : product.brand
    const brandName = brand?.name ?? null
    const requiresConfirmation = product.requires_confirmation || (brand?.default_requires_confirmation ?? false)

    const selectedOptions: SelectedOption[] = [
      ...Object.entries(selections).map(([group, opt]) => ({
        group,
        label: opt.label,
        price_modifier: opt.price_modifier,
      })),
      ...(product.option_groups ?? [])
        .filter(g => (g.type ?? 'select') === 'text_input' && textEnabled[g.name])
        .map(g => ({
          group: g.name,
          label: (textValues[g.name] ?? '').trim().toUpperCase(),
          price_modifier: g.text_price_modifier ?? 0,
        })),
    ]

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
      price: packTotal ?? computedPrice,
      weight_kg: product.weight_kg,
      qty: 1,
      images: product.images,
      requires_confirmation: requiresConfirmation,
      shipping_inefficient: product.shipping_inefficient,
      pack_size: packSize ?? undefined,
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
        <span className="ml-2 text-sm text-gray-500">excl. VAT per unit</span>
        {packTotal && (
          <p className="text-sm font-semibold text-[#6B3D8F] mt-1">
            Pack of {packSize} — {formatPrice(packTotal)} per pack
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">VAT calculated at checkout</p>
      </div>

      {/* Option selectors */}
      {product.option_groups?.map(group => {
        if ((group.type ?? 'select') === 'text_input') {
          const enabled = textEnabled[group.name] ?? false
          const val = textValues[group.name] ?? ''
          const priceTag = group.text_price_modifier && group.text_price_modifier !== 0
            ? ` (+€${group.text_price_modifier.toFixed(2)})`
            : ''
          return (
            <div key={group.name}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => {
                    setTextEnabled(prev => ({ ...prev, [group.name]: e.target.checked }))
                    setTextErrors(prev => ({ ...prev, [group.name]: '' }))
                  }}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {group.name}{priceTag}
                </span>
              </label>
              {enabled && (
                <div className="mt-2 pl-6">
                  <input
                    type="text"
                    value={val}
                    onChange={e => {
                      setTextValues(prev => ({ ...prev, [group.name]: e.target.value }))
                      setTextErrors(prev => ({ ...prev, [group.name]: '' }))
                    }}
                    placeholder={group.text_placeholder ?? ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F] uppercase placeholder:normal-case"
                  />
                  {textErrors[group.name] && (
                    <p className="text-xs text-red-500 mt-1">{textErrors[group.name]}</p>
                  )}
                </div>
              )}
            </div>
          )
        }

        return (
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
        )
      })}

      <Button size="lg" onClick={handleClick} className="w-full sm:w-auto">
        {label}
      </Button>
    </div>
  )
}
