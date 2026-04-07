import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SearchResultsClient from './SearchResultsClient'

export const metadata: Metadata = {
  title: 'Search Products',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const supabase = await createClient()

  type ProductRow = {
    id: string
    name: string
    slug: string
    sku: string | null
    price: number
    images: string[]
    stock_status: string
    requires_confirmation: boolean
    brand_id: string | null
    brand: { name: string } | { name: string }[] | null
  }

  const PRODUCT_SELECT = 'id, name, slug, sku, price, images, stock_status, requires_confirmation, brand_id, brand:brands(name, default_requires_confirmation)'

  let products: ProductRow[] = []
  let fallbackProducts: ProductRow[] = []

  if (query) {
    const { data: matchedBrands } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', `%${query}%`)
    const brandIds = (matchedBrands ?? []).map((s: { id: string }) => s.id)

    let dbQuery = supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('active', true)

    const orFilters = [`name.ilike.%${query}%`, `description.ilike.%${query}%`, `sku.ilike.%${query}%`]
    if (brandIds.length > 0) {
      orFilters.push(`brand_id.in.(${brandIds.join(',')})`)
    }
    dbQuery = dbQuery.or(orFilters.join(','))

    const { data } = await dbQuery.limit(200)
    products = data ?? []

    // Fallback: if no results, search by individual words
    if (products.length === 0) {
      const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'for', 'to', 'with'])
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
      if (words.length > 0) {
        const wordFilters = words.map(w => `name.ilike.%${w}%`)
        const { data: fallback } = await supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('active', true)
          .or(wordFilters.join(','))
          .limit(8)
        fallbackProducts = fallback ?? []
      }
    }
  } else {
    // No query — load all products so the page works as a full browser
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('active', true)
      .limit(200)
    products = data ?? []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">
        {query ? `Results for "${query}"` : 'All Products'}
      </h1>
      <SearchResultsClient key={query} products={products} fallbackProducts={fallbackProducts} initialQuery={query} />
    </div>
  )
}
