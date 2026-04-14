import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { createStaticClient } from '@/lib/supabase/static'
import CountryFlag from '@/components/ui/CountryFlag'
import { formatPrice, productUrl } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Brands',
  description: 'Browse professional horeca equipment brands available at Atmar Horeca.',
}

export const revalidate = 3600

type BrandProduct = {
  id: string
  brand_id: string
  name: string
  slug: string
  sku: string | null
  price: number
  images: string[]
  views: number
}

const PRODUCTS_PER_BRAND = 5

export default async function BrandsPage() {
  const supabase = createStaticClient()

  const [{ data: brands }, { data: allProducts }] = await Promise.all([
    supabase
      .from('brands')
      .select('id, name, slug, country_code, logo_url, description')
      .eq('active', true)
      .order('name'),
    supabase
      .from('products')
      .select('id, brand_id, name, slug, sku, price, images, views')
      .eq('active', true)
      .order('views', { ascending: false }),
  ])

  // Group top N products per brand, preserving views-desc order from the query
  const productsByBrand: Record<string, BrandProduct[]> = {}
  for (const p of (allProducts ?? []) as BrandProduct[]) {
    if (!productsByBrand[p.brand_id]) productsByBrand[p.brand_id] = []
    if (productsByBrand[p.brand_id].length < PRODUCTS_PER_BRAND) {
      productsByBrand[p.brand_id].push(p)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-2">Brands</h1>
      <p className="text-gray-500 mb-10">Professional horeca equipment from top European manufacturers.</p>

      <div className="flex flex-col gap-6">
        {(brands ?? []).map(brand => {
          const href = brand.slug ? `/brands/${brand.slug}` : `/search?q=${encodeURIComponent(brand.name)}`
          const products = productsByBrand[brand.id] ?? []

          return (
            <article
              key={brand.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Brand panel */}
              <div className="md:w-64 flex-shrink-0 flex flex-col items-center justify-center gap-4 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100">
                <Link href={href} className="w-32 h-32 flex items-center justify-center group">
                  {brand.logo_url ? (
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={128}
                      height={128}
                      className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  ) : (
                    <span className="text-5xl font-bold text-gray-200 group-hover:text-gray-300 transition-colors">{brand.name[0]}</span>
                  )}
                </Link>
                <div className="text-center flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Link href={href} className="text-base font-bold text-[#1A1A5E] hover:text-[#6B3D8F] transition-colors">{brand.name}</Link>
                    <CountryFlag code={brand.country_code} />
                  </div>
                  {brand.description && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{brand.description}</p>
                  )}
                </div>
                <Link
                  href={href}
                  className="mt-auto text-sm font-semibold text-[#6B3D8F] hover:underline flex items-center gap-1"
                >
                  Browse all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Products shelf */}
              <div className="flex-1 min-w-0 p-4 md:p-6 flex items-center">
                {products.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1 w-full">
                    {products.map(product => (
                      <Link
                        key={product.id}
                        href={productUrl(product)}
                        className="group flex-shrink-0 w-32 flex flex-col gap-2"
                      >
                        <div className="w-32 h-32 bg-[#F5F5F5] rounded-xl flex items-center justify-center p-2 group-hover:bg-gray-100 transition-colors">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={112}
                              height={112}
                              className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#1A1A5E] line-clamp-2 leading-tight">{product.name}</p>
                          <p className="text-xs font-bold text-[#6B3D8F] mt-0.5">{formatPrice(product.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Products coming soon</p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
