import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeToSheet } from '@/lib/google-sheets'

const HEADERS = [
  'id', 'sku', 'name', 'slug', 'price', 'weight_kg', 'stock_status',
  'requires_confirmation', 'shipping_inefficient', 'active',
  'martellato_url', 'meta_title', 'meta_description', 'images',
]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { supplierId } = await request.json()
  if (!supplierId) return NextResponse.json({ error: 'supplierId required' }, { status: 400 })

  const { data: products, error } = await supabase
    .from('products')
    .select('id, sku, name, slug, price, weight_kg, stock_status, requires_confirmation, shipping_inefficient, active, martellato_url, meta_title, meta_description, images')
    .eq('supplier_id', supplierId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!products?.length) return NextResponse.json({ error: 'No products found for this supplier' }, { status: 404 })

  const rows = [
    HEADERS,
    ...products.map((p) => [
      p.id,
      p.sku ?? '',
      p.name,
      p.slug,
      String(p.price),
      String(p.weight_kg),
      p.stock_status,
      String(p.requires_confirmation),
      String(p.shipping_inefficient),
      String(p.active),
      p.martellato_url ?? '',
      p.meta_title ?? '',
      p.meta_description ?? '',
      (p.images ?? []).join('|'),
    ]),
  ]

  try {
    await writeToSheet(rows)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  return NextResponse.json({ count: products.length })
}
