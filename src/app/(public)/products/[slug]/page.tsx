import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createStaticClient } from '@/lib/supabase/static'
import { formatPrice, productUrl } from '@/lib/utils'
import StockBadge from '@/components/product/StockBadge'
import AddToCartButton from '@/components/product/AddToCartButton'
import ImageGallery from '@/components/product/ImageGallery'
import type { Product } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('products')
    .select('*, brand:brands(*)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  try {
    const supabase = createStaticClient()
    const { data } = await supabase.from('products').select('slug').eq('active', true)
    return (data ?? []).map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
  const title = product.meta_title ?? product.name
  const description = product.meta_description ?? ''
  const image = product.images[0]

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/products/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/products/${slug}`,
      images: image ? [{ url: image }] : [],
    },
  }
}

export const revalidate = 3600 // ISR: revalidate every hour

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  // Explicit related products (manually set in admin)
  let explicitRelated: Array<{ id: string; name: string; slug: string; sku: string | null; price: number; images: string[] }> = []
  {
    const supabase = createStaticClient()
    const { data: relationRows } = await supabase
      .from('product_relations')
      .select('product_id, related_product_id')
      .or(`product_id.eq.${product.id},related_product_id.eq.${product.id}`)
    if (relationRows?.length) {
      const ids = relationRows.map(r => r.product_id === product.id ? r.related_product_id : r.product_id)
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, sku, price, images')
        .in('id', ids)
        .eq('active', true)
      explicitRelated = data ?? []
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
  const brand = product.brand

  const brandName = Array.isArray(brand) ? brand[0]?.name : brand?.name

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? '',
    image: product.images,
    ...(brandName && { brand: { '@type': 'Brand', name: brandName } }),
    ...(product.sku && { sku: product.sku, mpn: product.sku }),
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'EUR',
      availability:
        product.stock_status === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Atmar Horeca EOOD' },
    },
    url: `${siteUrl}/products/${slug}`,
  }

  const productUrl = `${siteUrl}/products/${slug}`
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Brands', item: `${siteUrl}/brands` },
      ...(brandName ? [{ '@type': 'ListItem', position: 3, name: brandName }] : []),
      { '@type': 'ListItem', position: brandName ? 4 : 3, name: product.name, item: productUrl },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <span>Home</span>
          <span>›</span>
          <span>Brands</span>
          {brandName && <><span>›</span><span>{brandName}</span></>}
          <span>›</span>
          <span className="text-gray-500 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image gallery */}
          <ImageGallery images={product.images} alt={[brandName, product.name].filter(Boolean).join(' ')} />

          {/* Product details */}
          <div className="flex flex-col gap-5">
            <div>
              {(brand || product.sku) && (
                <div className="flex items-center gap-2 mb-2">
                  {brand && (
                    <span className="text-sm font-semibold text-[#6B3D8F] uppercase tracking-wide">{brand.name}</span>
                  )}
                  {product.sku && (
                    <span className="text-sm text-gray-400 font-mono">{product.sku}</span>
                  )}
                </div>
              )}
              <h1 className="text-3xl font-bold text-[#1A1A5E]">{product.name}</h1>
            </div>

            {/* Price */}
            <div>
              <span className="text-3xl font-bold text-[#1A1A5E]">
                {formatPrice(product.price)}
              </span>
              <span className="ml-2 text-sm text-gray-500">excl. VAT</span>
              <p className="text-xs text-gray-400 mt-1">VAT calculated at checkout</p>
            </div>

            {/* Stock badge */}
            <StockBadge
              stockStatus={product.stock_status}
              requiresConfirmation={product.requires_confirmation}
            />

            {/* Lead time */}
            {brand?.lead_time_note && (
              <p className="text-sm text-gray-600">{brand.lead_time_note}</p>
            )}

            {/* CTA */}
            <AddToCartButton product={product} />

            {product.shipping_inefficient && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5">⚠️</span>
                <span>Orders containing this product are <strong>not eligible for free EU delivery</strong> due to its size or weight.</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Product Description</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {explicitRelated.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Related Products</h2>
            <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {explicitRelated.map(p => (
                <li key={p.id}>
                  <a
                    href={productUrl(p)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {p.images[0] && (
                      <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-contain rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A5E] truncate">{p.name}</p>
                      {p.sku && <p className="text-xs text-gray-400 font-mono">{p.sku}</p>}
                    </div>
                    <span className="text-sm font-bold text-[#1A1A5E] shrink-0">{formatPrice(p.price)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
