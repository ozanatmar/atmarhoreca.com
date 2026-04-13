import Link from 'next/link'
import Image from 'next/image'
import { Globe, FileText, Package, Search } from 'lucide-react'
import { createStaticClient } from '@/lib/supabase/static'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export const revalidate = 300


export default async function LandingPage() {
  const supabase = createStaticClient()
  const serviceSupabase = createServiceClient()

  const [
    { data: brands },
    { data: topViews },
  ] = await Promise.all([
    supabase
      .from('brands')
      .select('id, name, slug, logo_url')
      .eq('active', true)
      .order('name'),
    serviceSupabase.rpc('get_best_seller_ids', { limit_n: 8, days_back: 30 }),
  ])

  let bestSellers: Array<{ id: string; name: string; slug: string; price: number; images: string[] }> = []
  if (topViews?.length) {
    const topIds = (topViews as Array<{ product_id: string }>).map(v => v.product_id)
    const { data: products } = await serviceSupabase
      .from('products')
      .select('id, name, slug, price, images')
      .in('id', topIds)
      .eq('active', true)
    if (products?.length) {
      // Preserve view-count ranking order
      bestSellers = topIds
        .map(id => products.find(p => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A5E] mb-4">
            Professional Horeca Equipment
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Top European brands, delivered across the EU. B2B invoicing, no minimums.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/search" className="bg-[#6B3D8F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5a3278] transition-colors">
              Browse All Products
            </Link>
            <Link href="/brands" className="border border-[#6B3D8F] text-[#6B3D8F] px-6 py-3 rounded-lg font-semibold hover:bg-[#6B3D8F] hover:text-white transition-colors">
              View Brands
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1A1A5E] mb-2">Best Sellers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {bestSellers.map(product => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group bg-[#F5F5F5] border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-square flex items-center justify-center p-4 bg-white">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-xl" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-[#1A1A5E] line-clamp-2">{product.name}</p>
                    <p className="text-sm font-bold text-[#6B3D8F]">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands showcase */}
      {brands && brands.length > 0 && (
        <section className="bg-[#F5F5F5] py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1A1A5E] mb-6">Our Brands</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {brands.map(brand => {
                const href = brand.slug ? `/brands/${brand.slug}` : `/search?q=${encodeURIComponent(brand.name)}`
                return (
                  <Link
                    key={brand.id}
                    href={href}
                    title={brand.name}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-[#6B3D8F]/30 transition-all aspect-square flex items-center justify-center p-4"
                  >
                    {brand.logo_url ? (
                      <Image
                        src={brand.logo_url}
                        alt={brand.name}
                        width={120}
                        height={120}
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-300 group-hover:text-gray-400 transition-colors">
                        {brand.name[0]}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Value propositions */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <ValueCard
            icon={<Globe className="w-8 h-8 text-[#6B3D8F]" />}
            title="European Brands"
            description="Access professional equipment from Italy, Spain, and across Europe — brands not easily available locally."
          />
          <ValueCard
            icon={<Package className="w-8 h-8 text-[#F0A500]" />}
            title="EU-Wide Delivery"
            description="We handle shipping end-to-end to every EU country and beyond. Just order and we take care of the rest."
          />
          <ValueCard
            icon={<FileText className="w-8 h-8 text-[#7AB648]" />}
            title="B2B Friendly"
            description="Proper VAT invoicing for businesses across the EU, with VAT handled correctly based on your country and registration."
          />
          <ValueCard
            icon={<Search className="w-8 h-8 text-[#C0392B]" />}
            title="No Minimums"
            description="Order exactly what you need — one item or one hundred. No minimum order quantities."
          />
        </div>
      </section>
    </div>
  )
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#F5F5F5] rounded-xl p-6 shadow-sm flex flex-col gap-3">
      <div>{icon}</div>
      <h3 className="text-lg font-bold text-[#1A1A5E]">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
