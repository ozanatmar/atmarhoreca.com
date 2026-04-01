import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createStaticClient } from '@/lib/supabase/static'
import { formatPrice, productUrl } from '@/lib/utils'
import StockBadge from '@/components/product/StockBadge'
import AddToCartButton from '@/components/product/AddToCartButton'
import ImageGallery from '@/components/product/ImageGallery'
import type { Product } from '@/types'

// [slug] = SKU, [name] = product name slug
interface Props {
  params: Promise<{ slug: string; name: string }>
}

async function getProduct(sku: string, name: string): Promise<Product | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('products')
    .select('*, brand:brands(*)')
    .eq('sku', decodeURIComponent(sku))
    .eq('slug', name)
    .eq('active', true)
    .single()
  return data
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from('products')
      .select('sku, slug')
      .eq('active', true)
      .not('sku', 'is', null)
    return (data ?? []).map((p) => ({ slug: encodeURIComponent(p.sku!), name: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: sku, name } = await params
  const product = await getProduct(sku, name)
  if (!product) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
  const title = product.meta_title ?? product.name
  const description = product.meta_description ?? ''
  const image = product.images[0]
  const url = `${siteUrl}${productUrl(product)}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: image ? [{ url: image }] : [] },
  }
}

export const revalidate = 3600

export default async function ProductPage({ params }: Props) {
  const { slug: sku, name } = await params
  const product = await getProduct(sku, name)
  if (!product) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
  const brand = product.brand
  const url = `${siteUrl}${productUrl(product)}`

  const brandName = Array.isArray(brand) ? brand[0]?.name : brand?.name

  // Related products — same brand, exclude current
  let related: Array<{ id: string; name: string; slug: string; sku: string | null; price: number; images: string[]; stock_status: string; requires_confirmation: boolean }> = []
  if (product.brand_id) {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, sku, price, images, stock_status, requires_confirmation')
      .eq('brand_id', product.brand_id)
      .eq('active', true)
      .neq('id', product.id)
      .limit(4)
    related = data ?? []
  }

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
    url,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Brands', item: `${siteUrl}/brands` },
      ...(brandName ? [{ '@type': 'ListItem', position: 3, name: brandName }] : []),
      { '@type': 'ListItem', position: brandName ? 4 : 3, name: product.name, item: url },
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
          <ImageGallery images={product.images} alt={[brandName, product.name].filter(Boolean).join(' ')} />

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

            <div>
              <span className="text-3xl font-bold text-[#1A1A5E]">
                {formatPrice(product.price)}
              </span>
              <span className="ml-2 text-sm text-gray-500">excl. VAT</span>
              <p className="text-xs text-gray-400 mt-1">VAT calculated at checkout</p>
            </div>

            <StockBadge
              stockStatus={product.stock_status}
              requiresConfirmation={product.requires_confirmation}
            />

            {brand?.lead_time_note && (
              <p className="text-sm text-gray-600">{brand.lead_time_note}</p>
            )}

            <AddToCartButton product={product} />

            {product.shipping_inefficient && (
              <div className="bg-[#FFF8E1] border border-[#F0A500] rounded-lg p-4 text-sm text-gray-700">
                Note: Due to the size or weight of this product, shipping costs will be
                calculated individually and confirmed in your proforma invoice.
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Product Description</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-[#1A1A5E] mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={productUrl(p)}
                  className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="relative aspect-square bg-gray-50">
                    <Image
                      src={p.images[0] ?? 'https://atmar.bg/atmar_horeca_logo_512x512.jpg'}
                      alt={[brandName, p.name].filter(Boolean).join(' ')}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  </div>
                  <div className="p-3 flex flex-col flex-1 gap-1">
                    <p className="text-xs font-semibold text-[#1A1A5E] line-clamp-2 flex-1">{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-[#1A1A5E]">{formatPrice(p.price)}</span>
                      <StockBadge stockStatus={p.stock_status as 'in_stock' | 'out_of_stock' | 'unknown'} requiresConfirmation={p.requires_confirmation} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
