import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Authenticate via secret header (Vercel cron) or admin role
  const cronSecret = request.headers.get('x-cron-secret')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  // Get Martellato supplier ID
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('name', 'Martellato')
    .single()

  if (!supplier) {
    return NextResponse.json({ error: 'Martellato supplier not found' }, { status: 500 })
  }

  const supplierId = supplier.id

  try {
    // 1. Fetch sitemap
    const sitemapResponse = await fetch('https://www.martellato.com/sitemap.xml', {
      signal: AbortSignal.timeout(30000),
    })

    if (!sitemapResponse.ok) {
      throw new Error(`Sitemap fetch failed: HTTP ${sitemapResponse.status}`)
    }

    const sitemapText = await sitemapResponse.text()

    // 2. Parse <loc> values
    const re = /<loc>(https?:\/\/www\.martellato\.com[^<]*)<\/loc>/g
    const sitemapUrls = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = re.exec(sitemapText)) !== null) {
      sitemapUrls.add(m[1].trim())
    }

    if (sitemapUrls.size === 0) {
      throw new Error('Sitemap parsed but contained no URLs — unexpected format')
    }

    // 3. Get all Martellato products with URLs
    const { data: products } = await supabase
      .from('products')
      .select('id, martellato_url, stock_status')
      .eq('supplier_id', supplierId)
      .not('martellato_url', 'is', null)

    if (!products?.length) {
      await supabase.from('scrape_logs').insert({
        supplier_id: supplierId,
        status: 'success',
        products_updated: 0,
      })
      return NextResponse.json({ products_updated: 0 })
    }

    // 4. Update stock status
    let updated = 0
    const now = new Date().toISOString()

    for (const product of products) {
      const newStatus = sitemapUrls.has(product.martellato_url!) ? 'in_stock' : 'out_of_stock'
      if (newStatus !== product.stock_status) {
        await supabase.from('products').update({
          stock_status: newStatus,
          last_scraped_at: now,
        }).eq('id', product.id)
        updated++
      } else {
        await supabase.from('products').update({ last_scraped_at: now }).eq('id', product.id)
      }
    }

    // 5. Log success
    await supabase.from('scrape_logs').insert({
      supplier_id: supplierId,
      status: 'success',
      products_updated: updated,
    })

    return NextResponse.json({ success: true, products_updated: updated })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    // Set all Martellato products to 'unknown'
    await supabase.from('products')
      .update({ stock_status: 'unknown' })
      .eq('supplier_id', supplierId)
      .not('martellato_url', 'is', null)

    await supabase.from('scrape_logs').insert({
      supplier_id: supplierId,
      status: 'failed',
      products_updated: 0,
      error_log: errorMessage,
    })

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
