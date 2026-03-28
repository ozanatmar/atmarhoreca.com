import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFromSheet, clearSheetData } from '@/lib/google-sheets'
import { slugify } from '@/lib/utils'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rows: string[][]
  try {
    rows = await readFromSheet()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  if (rows.length <= 1) {
    return NextResponse.json({ count: 0 })
  }

  const [header, ...dataRows] = rows
  const col = (name: string) => header.indexOf(name)

  const updates = dataRows
    .filter((row) => row[col('id')]?.trim())
    .map((row) => {
      const name = row[col('name')] ?? ''
      return {
        id: row[col('id')].trim(),
        name,
        slug: slugify(name),
        sku: row[col('sku')] || null,
        description: row[col('description')] || null,
        price: parseFloat(row[col('price')]),
        weight_kg: parseFloat(row[col('weight_kg')]),
        stock_status: (row[col('stock_status')] || 'unknown') as 'in_stock' | 'out_of_stock' | 'unknown',
        martellato_url: row[col('martellato_url')] || null,
        images: row[col('images')] ? row[col('images')].split('|').filter(Boolean) : [],
        meta_title: row[col('meta_title')] || null,
        meta_description: row[col('meta_description')] || null,
        requires_confirmation: row[col('requires_confirmation')] === 'true',
        shipping_inefficient: row[col('shipping_inefficient')] === 'true',
        active: row[col('active')] === 'true',
      }
    })

  let updatedCount = 0
  for (const { id, ...payload } of updates) {
    const { error } = await supabase.from('products').update(payload).eq('id', id)
    if (!error) updatedCount++
  }

  try {
    await clearSheetData()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  return NextResponse.json({ count: updatedCount })
}
