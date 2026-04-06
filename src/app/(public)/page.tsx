import Link from 'next/link'
import Image from 'next/image'
import { Globe, FileText, Package, Search } from 'lucide-react'
import { createStaticClient } from '@/lib/supabase/static'

export const revalidate = 3600

function countryFlag(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)).join('')
}

export default async function LandingPage() {
  const supabase = createStaticClient()

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, country_code, logo_url, description')
    .eq('active', true)
    .order('name')

  const { data: counts } = await supabase
    .from('products')
    .select('brand_id')
    .eq('active', true)

  const countMap: Record<string, number> = {}
  for (const p of counts ?? []) {
    if (p.brand_id) countMap[p.brand_id] = (countMap[p.brand_id] ?? 0) + 1
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

      {/* Brands showcase */}
      {brands && brands.length > 0 && (
        <section className="bg-[#F5F5F5] py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1A1A5E] mb-2">Our Brands</h2>
            <p className="text-gray-500 mb-8">Click a brand to browse their full catalogue.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map(brand => {
                const href = brand.slug ? `/brands/${brand.slug}` : `/search?q=${encodeURIComponent(brand.name)}`
                const count = countMap[brand.id] ?? 0
                return (
                  <Link
                    key={brand.id}
                    href={href}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="h-32 bg-gray-50 flex items-center justify-center p-6">
                      {brand.logo_url ? (
                        <Image
                          src={brand.logo_url}
                          alt={brand.name}
                          width={180}
                          height={72}
                          className="object-contain max-h-16 group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      ) : (
                        <span className="text-5xl font-bold text-gray-200 group-hover:text-gray-300 transition-colors">
                          {brand.name[0]}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1A1A5E]">{brand.name}</span>
                        <span title={brand.country_code}>{countryFlag(brand.country_code)}</span>
                      </div>
                      {brand.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{brand.description}</p>
                      )}
                      <p className="text-xs text-[#6B3D8F] font-medium mt-1">
                        {count} product{count !== 1 ? 's' : ''} →
                      </p>
                    </div>
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
