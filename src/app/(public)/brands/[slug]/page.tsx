import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { createStaticClient } from '@/lib/supabase/static'
import SearchResultsClient from '@/app/(public)/search/SearchResultsClient'
import CountryFlag from '@/components/ui/CountryFlag'

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600


export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  try {
    const supabase = createStaticClient()
    const { data } = await supabase.from('brands').select('slug').eq('active', true).not('slug', 'is', null)
    return (data ?? []).filter(b => b.slug).map(b => ({ slug: b.slug! }))
  } catch { return [] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createStaticClient()
  const { data: brand } = await supabase.from('brands').select('name, description').eq('slug', slug).single()
  if (!brand) return {}
  return {
    title: brand.name,
    description: brand.description ?? `Browse all ${brand.name} products at Atmar Horeca.`,
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const supabase = createStaticClient()

  const { data: brand } = await supabase
    .from('brands')
    .select('id, name, slug, country_code, logo_url, description, lead_time_note')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!brand) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, sku, price, images, stock_status, requires_confirmation, brand_id, brand:brands(name)')
    .eq('brand_id', brand.id)
    .eq('active', true)
    .limit(200)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Brand header */}
      <div className="flex items-center gap-6 mb-10 pb-8 border-b border-gray-200">
        {brand.logo_url && (
          <div className="w-28 shrink-0">
            <Image src={brand.logo_url} alt={brand.name} width={112} height={112} className="object-contain w-full h-auto" unoptimized />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-[#1A1A5E]">{brand.name}</h1>
            <CountryFlag code={brand.country_code} className="text-2xl" />
          </div>
          {brand.description && <p className="text-gray-500 max-w-xl">{brand.description}</p>}
          {brand.lead_time_note && <p className="text-sm text-gray-400 mt-1">{brand.lead_time_note}</p>}
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#1A1A5E] mb-6">
        {products?.length ?? 0} Products
      </h2>

      <SearchResultsClient
        key={brand.id}
        products={products ?? []}
        fallbackProducts={[]}
        initialQuery=""
        hideBrandFilter
      />
    </div>
  )
}
