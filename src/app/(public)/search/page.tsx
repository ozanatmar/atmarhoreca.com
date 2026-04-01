import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, productUrl } from '@/lib/utils'
import StockBadge from '@/components/product/StockBadge'

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

  let products: Array<{
    id: string
    name: string
    slug: string
    sku: string | null
    price: number
    images: string[]
    stock_status: string
    requires_confirmation: boolean
    brand: { name: string } | null
  }> = []

  if (query) {
    const supabase = await createClient()

    // Find brand IDs matching the brand search term
    const { data: matchedBrands } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', `%${query}%`)
    const brandIds = (matchedBrands ?? []).map((s: { id: string }) => s.id)

    let q = supabase
      .from('products')
      .select('id, name, slug, sku, price, images, stock_status, requires_confirmation, brand:brands(name)')
      .eq('active', true)

    const orFilters = [`name.ilike.%${query}%`, `description.ilike.%${query}%`, `sku.ilike.%${query}%`]
    if (brandIds.length > 0) {
      orFilters.push(`brand_id.in.(${brandIds.join(',')})`)
    }
    q = q.or(orFilters.join(','))

    const { data } = await q.limit(48)
    products = data ?? []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-2">
        {query ? `Results for "${query}"` : 'Search Products'}
      </h1>
      {query && (
        <p className="text-sm text-gray-500 mb-6">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </p>
      )}

      {!query && (
        <p className="text-gray-500">Enter a search term above to find products.</p>
      )}

      {query && products.length === 0 && (
        <p className="text-gray-500">No products found for &quot;{query}&quot;.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <Link
            key={p.id}
            href={productUrl(p)}
            className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square bg-gray-50">
              <Image
                src={p.images[0] ?? 'https://atmar.bg/atmar_horeca_logo_512x512.jpg'}
                alt={p.name}
                fill
                className="object-contain p-3 group-hover:scale-105 transition-transform"
                unoptimized
              />
            </div>
            <div className="p-4 flex flex-col gap-1.5">
              {p.brand && (
                <span className="text-xs font-semibold text-[#6B3D8F] uppercase tracking-wide">
                  {Array.isArray(p.brand) ? p.brand[0]?.name : p.brand.name}
                </span>
              )}
              <h2 className="text-sm font-semibold text-[#1A1A5E] line-clamp-2">{p.name}</h2>
              {p.sku && (
                <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-[#1A1A5E]">
                  {formatPrice(p.price)}
                </span>
                <StockBadge
                  stockStatus={p.stock_status as 'in_stock' | 'out_of_stock' | 'unknown'}
                  requiresConfirmation={p.requires_confirmation}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
