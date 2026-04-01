'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/cart-store'
import { productUrl } from '@/lib/utils'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export default function AddToCartButton({ product }: Props) {
  const [loggedIn, setLoggedIn] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
  }, [])

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
    addItem({
      product_id: product.id,
      brand_id: product.brand_id ?? null,
      brand_name: brandName,
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? null,
      price: product.price,
      weight_kg: product.weight_kg,
      qty: 1,
      images: product.images,
      requires_confirmation: requiresConfirmation,
      shipping_inefficient: product.shipping_inefficient,
      stock_status: product.stock_status,
    })
    router.push('/cart')
  }

  return (
    <Button size="lg" onClick={handleClick} className="w-full sm:w-auto">
      {label}
    </Button>
  )
}
