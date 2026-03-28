import type { MetadataRoute } from 'next'
import { createStaticClient } from '@/lib/supabase/static'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'

  const base: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
  ]

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return base

  const supabase = createStaticClient()

  const [{ data: products }, { data: posts }] = await Promise.all([
    supabase.from('products').select('slug, updated_at:created_at').eq('active', true),
    supabase
      .from('blog_posts')
      .select('slug, published_at')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString()),
  ])

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  const blogUrls: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...base, ...productUrls, ...blogUrls]
}
