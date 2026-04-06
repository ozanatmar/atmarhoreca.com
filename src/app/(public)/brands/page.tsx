import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createStaticClient } from '@/lib/supabase/static'
import CountryFlag from '@/components/ui/CountryFlag'

export const metadata: Metadata = {
  title: 'Brands',
  description: 'Browse professional horeca equipment brands available at Atmar Horeca.',
}

export const revalidate = 3600


export default async function BrandsPage() {
  const supabase = createStaticClient()

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, country_code, logo_url, description')
    .eq('active', true)
    .order('name')

  // Get product counts per brand
  const { data: counts } = await supabase
    .from('products')
    .select('brand_id')
    .eq('active', true)

  const countMap: Record<string, number> = {}
  for (const p of counts ?? []) {
    if (p.brand_id) countMap[p.brand_id] = (countMap[p.brand_id] ?? 0) + 1
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-2">Brands</h1>
      <p className="text-gray-500 mb-10">Professional horeca equipment from top European manufacturers.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(brands ?? []).map(brand => {
          const href = brand.slug ? `/brands/${brand.slug}` : `/search?q=${encodeURIComponent(brand.name)}`
          const count = countMap[brand.id] ?? 0
          return (
            <Link
              key={brand.id}
              href={href}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Logo area */}
              <div className="aspect-square flex items-center justify-center p-8">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={200}
                    height={200}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl font-bold text-gray-200 group-hover:text-gray-300 transition-colors">
                    {brand.name[0]}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1A1A5E]">{brand.name}</span>
                  <CountryFlag code={brand.country_code} />
                </div>
                {brand.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{brand.description}</p>
                )}
                <p className="text-xs text-[#6B3D8F] font-medium mt-auto pt-1">
                  {count} product{count !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
