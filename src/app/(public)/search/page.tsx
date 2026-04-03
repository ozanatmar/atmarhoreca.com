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

  let products: Array<{
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
  }> = []

  if (query) {
    const { data: matchedBrands } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', `%${query}%`)
    const brandIds = (matchedBrands ?? []).map((s: { id: string }) => s.id)

    let dbQuery = supabase
      .from('products')
      .select('id, name, slug, sku, price, images, stock_status, requires_confirmation, brand_id, brand:brands(name)')
      .eq('active', true)

    const orFilters = [`name.ilike.%${query}%`, `description.ilike.%${query}%`, `sku.ilike.%${query}%`]
    if (brandIds.length > 0) {
      orFilters.push(`brand_id.in.(${brandIds.join(',')})`)
    }
    dbQuery = dbQuery.or(orFilters.join(','))

    const { data } = await dbQuery.limit(200)
    products = data ?? []
  } else {
    // No query — load all products so the page works as a full browser
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, sku, price, images, stock_status, requires_confirmation, brand_id, brand:brands(name)')
      .eq('active', true)
      .limit(200)
    products = data ?? []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">
        {query ? `Results for "${query}"` : 'All Products'}
      </h1>
      <SearchResultsClient products={products} initialQuery={query} />
    </div>
  )
}
