import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFromSheet, clearSheetData, ADD_SHEET } from '@/lib/google-sheets'
import { slugify } from '@/lib/utils'

const VALID_STOCK = ['in_stock', 'out_of_stock', 'unknown']
const VALID_BOOL = ['true', 'false', 'TRUE', 'FALSE']

function colLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function cellRef(colIndex: number, rowNumber: number): string {
  return `${colLetter(colIndex)}${rowNumber}`
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rows: string[][]
  try {
    rows = await readFromSheet(ADD_SHEET)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  if (rows.length <= 2) {
    return NextResponse.json({ count: 0 })
  }

  const header = rows[1]  // row 1 = instructions, row 2 = headers
  const dataRows = rows.slice(2) // data starts at row 3
  const col = (name: string) => header.indexOf(name)

  // Validate header columns
  const REQUIRED_COLS = ['name', 'sku', 'brand', 'price', 'stock_status', 'requires_confirmation', 'shipping_inefficient', 'active']
  for (const colName of REQUIRED_COLS) {
    if (col(colName) === -1) {
      return NextResponse.json({ error: `Missing column "${colName}" in header row (row 2)` }, { status: 422 })
    }
  }

  // Fetch all brands for name→id lookup
  const { data: brands } = await supabase.from('brands').select('id, name')
  const brandMap = new Map((brands ?? []).map((s) => [s.name.toLowerCase(), s.id]))

  // Validate all rows before inserting anything
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNum = i + 3 // 1-based: row 1 = instructions, row 2 = headers, data starts at row 3

    const get = (name: string) => (row[col(name)]?.trim() ?? '').replace(/\u0000/g, '')

    const name = get('name')
    if (!name) {
      return NextResponse.json({ error: `Empty name in ${cellRef(col('name'), rowNum)}` }, { status: 422 })
    }

    const sku = get('sku')
    if (!sku) {
      return NextResponse.json({ error: `Empty SKU in ${cellRef(col('sku'), rowNum)}` }, { status: 422 })
    }

    const brandName = get('brand')
    if (!brandName) {
      return NextResponse.json({ error: `Empty brand in ${cellRef(col('brand'), rowNum)}` }, { status: 422 })
    }
    if (!brandMap.has(brandName.toLowerCase())) {
      return NextResponse.json({ error: `Unknown brand "${brandName}" in ${cellRef(col('brand'), rowNum)}` }, { status: 422 })
    }

    const priceStr = get('price')
    if (!priceStr || isNaN(parseFloat(priceStr)) || parseFloat(priceStr) < 0) {
      return NextResponse.json({ error: `Invalid price in ${cellRef(col('price'), rowNum)}` }, { status: 422 })
    }

    const weightStr = get('weight_kg')
    if (weightStr && (isNaN(parseFloat(weightStr)) || parseFloat(weightStr) < 0)) {
      return NextResponse.json({ error: `Invalid weight_kg in ${cellRef(col('weight_kg'), rowNum)} — must be a positive number or left empty` }, { status: 422 })
    }

    const stockStatus = get('stock_status')
    if (!VALID_STOCK.includes(stockStatus)) {
      return NextResponse.json({ error: `Invalid stock_status in ${cellRef(col('stock_status'), rowNum)} — must be one of: ${VALID_STOCK.join(', ')}` }, { status: 422 })
    }

    const martellatoUrl = get('martellato_url')
    if (martellatoUrl && !isValidUrl(martellatoUrl)) {
      return NextResponse.json({ error: `Invalid URL in ${cellRef(col('martellato_url'), rowNum)}` }, { status: 422 })
    }

    const imagesRaw = get('images')
    if (imagesRaw) {
      const imageUrls = imagesRaw.split('|').map((u) => u.trim()).filter(Boolean)
      for (const url of imageUrls) {
        if (!isValidUrl(url)) {
          return NextResponse.json({ error: `Invalid image URL "${url}" in ${cellRef(col('images'), rowNum)}` }, { status: 422 })
        }
      }
    }

    const reqConf = get('requires_confirmation')
    if (!VALID_BOOL.includes(reqConf)) {
      return NextResponse.json({ error: `Invalid requires_confirmation in ${cellRef(col('requires_confirmation'), rowNum)} — must be true or false` }, { status: 422 })
    }

    const shippingIneff = get('shipping_inefficient')
    if (!VALID_BOOL.includes(shippingIneff)) {
      return NextResponse.json({ error: `Invalid shipping_inefficient in ${cellRef(col('shipping_inefficient'), rowNum)} — must be true or false` }, { status: 422 })
    }

    const active = get('active')
    if (!VALID_BOOL.includes(active)) {
      return NextResponse.json({ error: `Invalid active in ${cellRef(col('active'), rowNum)} — must be true or false` }, { status: 422 })
    }
  }

  // All rows valid — insert
  // Strip null bytes and other control chars that PostgreSQL rejects in text columns
  const sanitize = (s: string) => s.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  const products = dataRows.map((row) => {
    const get = (name: string) => sanitize(row[col(name)]?.trim() ?? '')
    const name = get('name')
    const imagesRaw = get('images')
    return {
      name,
      slug: slugify(name),
      sku: get('sku'),
      brand_id: brandMap.get(get('brand').toLowerCase())!,
      description: get('description') || null,
      price: parseFloat(get('price')),
      weight_kg: get('weight_kg') ? parseFloat(get('weight_kg')) : null,
      stock_status: get('stock_status') as 'in_stock' | 'out_of_stock' | 'unknown',
      martellato_url: get('martellato_url') || null,
      images: imagesRaw ? imagesRaw.split('|').map((u) => u.trim()).filter(Boolean) : [],
      meta_title: get('meta_title') || null,
      meta_description: get('meta_description') || null,
      requires_confirmation: get('requires_confirmation').toLowerCase() === 'true',
      shipping_inefficient: get('shipping_inefficient').toLowerCase() === 'true',
      active: get('active').toLowerCase() === 'true',
    }
  })

  const { error: insertError } = await supabase.from('products').insert(products)
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  try {
    await clearSheetData(ADD_SHEET, 3)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  return NextResponse.json({ count: products.length })
}
