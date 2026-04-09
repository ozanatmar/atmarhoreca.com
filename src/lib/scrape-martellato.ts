import { createServiceClient } from '@/lib/supabase/server'

export type ScrapeResult =
  | { skipped: true; reason: string }
  | { success: true; products_updated: number }
  | { success: false; error: string }

/**
 * Runs the Martellato scrape.
 * Pass force=true to bypass the frequency check (used by admin "Run Now").
 */
export async function runMartellato(force = false): Promise<ScrapeResult> {
  const supabase = createServiceClient()

  if (!force) {
    const [{ data: freqSetting }, { data: lastLog }] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'scrape_frequency').single(),
      supabase.from('scrape_logs').select('ran_at').eq('status', 'success').order('ran_at', { ascending: false }).limit(1).single(),
    ])

    if (lastLog?.ran_at) {
      const freq = freqSetting?.value ?? 'weekly'
      const minHours = freq === 'daily' ? 23 : freq === 'monthly' ? 27 * 24 : 6 * 24
      const hoursSinceLast = (Date.now() - new Date(lastLog.ran_at).getTime()) / 36e5
      if (hoursSinceLast < minHours) {
        return { skipped: true, reason: `frequency is ${freq}, only ${Math.round(hoursSinceLast)}h since last run` }
      }
    }
  }

  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('name', 'Martellato')
    .single()

  if (!brand) {
    return { success: false, error: 'Martellato brand not found' }
  }

  const brandId = brand.id

  try {
    const sitemapResponse = await fetch('https://www.martellato.com/sitemap.xml', {
      signal: AbortSignal.timeout(30000),
    })

    if (!sitemapResponse.ok) {
      throw new Error(`Sitemap fetch failed: HTTP ${sitemapResponse.status}`)
    }

    const sitemapText = await sitemapResponse.text()

    const re = /<loc>(https?:\/\/www\.martellato\.com[^<]*)<\/loc>/g
    const sitemapUrls = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = re.exec(sitemapText)) !== null) {
      sitemapUrls.add(m[1].trim())
    }

    if (sitemapUrls.size === 0) {
      throw new Error('Sitemap parsed but contained no URLs — unexpected format')
    }

    const { data: products } = await supabase
      .from('products')
      .select('id, martellato_url, stock_status')
      .eq('brand_id', brandId)
      .not('martellato_url', 'is', null)

    if (!products?.length) {
      await supabase.from('scrape_logs').insert({ brand_id: brandId, status: 'success', products_updated: 0 })
      return { success: true, products_updated: 0 }
    }

    let updated = 0
    const now = new Date().toISOString()

    for (const product of products) {
      const newStatus = sitemapUrls.has(product.martellato_url!) ? 'in_stock' : 'out_of_stock'
      if (newStatus !== product.stock_status) {
        await supabase.from('products').update({ stock_status: newStatus, last_scraped_at: now }).eq('id', product.id)
        updated++
      } else {
        await supabase.from('products').update({ last_scraped_at: now }).eq('id', product.id)
      }
    }

    await supabase.from('scrape_logs').insert({ brand_id: brandId, status: 'success', products_updated: updated })
    return { success: true, products_updated: updated }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

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

    return { success: false, error: errorMessage }
  }
}
