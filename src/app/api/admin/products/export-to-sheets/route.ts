import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeToSheet } from '@/lib/google-sheets'

const HEADERS = [
  'id', 'name', 'sku', 'brand', 'description', 'price', 'weight_kg', 'stock_status',
  'martellato_url', 'images', 'meta_title', 'meta_description',
  'requires_confirmation', 'shipping_inefficient', 'active',
]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brandId } = await request.json()
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, brand:brands(name), description, price, weight_kg, stock_status, martellato_url, images, meta_title, meta_description, requires_confirmation, shipping_inefficient, active')
    .eq('brand_id', brandId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!products?.length) return NextResponse.json({ error: 'No products found for this brand' }, { status: 404 })

  const rows = [
    HEADERS,
    ...products.map((p) => {
      const brand = Array.isArray(p.brand) ? p.brand[0] : p.brand
      return [
        p.id,
        p.name,
        p.sku ?? '',
        brand?.name ?? '',
        p.description ?? '',
        String(p.price),
        String(p.weight_kg),
        p.stock_status,
        p.martellato_url ?? '',
        (p.images ?? []).join('|'),
        p.meta_title ?? '',
        p.meta_description ?? '',
        String(p.requires_confirmation),
        String(p.shipping_inefficient),
        String(p.active),
      ]
    }),
  ]

  try {
    await writeToSheet(rows)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  return NextResponse.json({ count: products.length })
}
