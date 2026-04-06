import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Authenticate via secret header (Vercel cron) or admin role
  const cronSecret = request.headers.get('x-cron-secret')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Check frequency setting against last successful run
  const [{ data: freqSetting }, { data: lastLog }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'scrape_frequency').single(),
    supabase.from('scrape_logs').select('ran_at').eq('status', 'success').order('ran_at', { ascending: false }).limit(1).single(),
  ])

  if (lastLog?.ran_at) {
    const freq = freqSetting?.value ?? 'weekly'
    const minHours = freq === 'daily' ? 23 : freq === 'monthly' ? 27 * 24 : 6 * 24
    const hoursSinceLast = (Date.now() - new Date(lastLog.ran_at).getTime()) / 36e5
    if (hoursSinceLast < minHours) {
      return NextResponse.json({ skipped: true, reason: `frequency is ${freq}, only ${Math.round(hoursSinceLast)}h since last run` })
    }
  }

  // Get Martellato brand ID
  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('name', 'Martellato')
    .single()

  if (!brand) {
    return NextResponse.json({ error: 'Martellato brand not found' }, { status: 500 })
  }

  const brandId = brand.id

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
      .eq('brand_id', brandId)
      .not('martellato_url', 'is', null)

    if (!products?.length) {
      await supabase.from('scrape_logs').insert({
        brand_id: brandId,
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
      brand_id: brandId,
      status: 'success',
      products_updated: updated,
    })

    return NextResponse.json({ success: true, products_updated: updated })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    // Set all Martellato products to 'unknown'
    await supabase.from('products')
      .update({ stock_status: 'unknown' })
      .eq('brand_id', brandId)
      .not('martellato_url', 'is', null)

    await supabase.from('scrape_logs').insert({
      brand_id: brandId,
      status: 'failed',
      products_updated: 0,
      error_log: errorMessage,
    })

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
