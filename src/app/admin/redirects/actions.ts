'use server'
import { createServiceClient } from '@/lib/supabase/server'

export async function importFromSitemap(): Promise<{ count: number; error: string | null }> {
  const res = await fetch('https://www.atmarhoreca.com/store-products-sitemap.xml', { cache: 'no-store' })
  const xml = await res.text()

  const paths = [...xml.matchAll(/<loc>https:\/\/www\.atmarhoreca\.com(\/product-page\/[^<]+)<\/loc>/g)]
    .map(m => m[1])

  if (!paths.length) return { count: 0, error: 'No product-page URLs found in sitemap' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('redirects')
    .upsert(
      paths.map(p => ({ from_path: p })),
      { onConflict: 'from_path', ignoreDuplicates: true }
    )

  return { count: paths.length, error: error?.message ?? null }
}

export async function searchProducts(query: string): Promise<Array<{ id: string; name: string; slug: string; images: string[] }>> {
  if (!query.trim()) return []
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, images')
    .ilike('name', `%${query}%`)
    .eq('active', true)
    .order('name')
    .limit(8)
  return data ?? []
}

export async function saveRedirect(fromPath: string, toPath: string): Promise<{ error: string | null }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('redirects')
    .update({ to_path: toPath || null })
    .eq('from_path', fromPath)
  return { error: error?.message ?? null }
}
