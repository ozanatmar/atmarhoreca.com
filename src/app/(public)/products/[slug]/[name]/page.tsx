import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createStaticClient } from '@/lib/supabase/static'
import { formatPrice, productUrl } from '@/lib/utils'
import StockBadge from '@/components/product/StockBadge'
import ProductPurchaseSection from '@/components/product/ProductPurchaseSection'
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
  const brandName = Array.isArray(product.brand) ? product.brand[0]?.name : (product.brand as { name: string } | null)?.name
  const title = product.meta_title ?? product.name
  const autoDescription = [
    brandName,
    product.name,
    product.description ? product.description.slice(0, 120).replace(/\s+\S*$/, '') + '…' : null,
  ].filter(Boolean).join(' — ')
  const description = product.meta_description || autoDescription
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

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'for', 'to', 'with', 'de', 'la', 'le'])

function tokenize(name: string): Set<string> {
  return new Set(
    name.toLowerCase()
      .split(/[\s\-—–_/()]+/)
      .filter(w => w.length > 0 && !STOP_WORDS.has(w))
  )
}

type Candidate = { id: string; name: string; slug: string; sku: string | null; price: number; images: string[]; stock_status: string; requires_confirmation: boolean }

function pickRelated(currentName: string, candidates: Candidate[], limit: number): Candidate[] {
  const currentWords = tokenize(currentName)
  const scored = candidates.map(p => {
    const words = tokenize(p.name)
    const overlap = [...words].filter(w => currentWords.has(w)).length
    return { p, overlap }
  })

  const picked = new Set<string>()
  const result: Candidate[] = []

  for (let threshold = 4; threshold >= 1 && result.length < limit; threshold--) {
    const matches = scored.filter(({ p, overlap }) => overlap >= threshold && !picked.has(p.id))
    for (const { p } of matches) {
      if (result.length >= limit) break
      result.push(p)
      picked.add(p.id)
    }
  }

  // Fill remainder with random same-brand products not yet picked
  if (result.length < limit) {
    const remaining = candidates.filter(p => !picked.has(p.id))
    // shuffle
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]]
    }
    for (const p of remaining) {
      if (result.length >= limit) break
      result.push(p)
    }
  }

  return result
}

export default async function ProductPage({ params }: Props) {
  const { slug: sku, name } = await params
  const product = await getProduct(sku, name)
  if (!product) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
  const brand = product.brand
  const url = `${siteUrl}${productUrl(product)}`

  const brandName = Array.isArray(brand) ? brand[0]?.name : brand?.name

  // Product documents
  let documents: Array<{ id: string; name: string; file_path: string }> = []
  {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from('product_documents')
      .select('id, name, file_path')
      .eq('product_id', product.id)
      .order('created_at')
    documents = data ?? []
  }

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

  // Auto-related products — same brand, ranked by word overlap with current product name
  let related: Array<{ id: string; name: string; slug: string; sku: string | null; price: number; images: string[]; stock_status: string; requires_confirmation: boolean }> = []
  if (product.brand_id) {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, sku, price, images, stock_status, requires_confirmation')
      .eq('brand_id', product.brand_id)
      .eq('active', true)
      .neq('id', product.id)
    const candidates = data ?? []
    related = pickRelated(product.name, candidates, 4)
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
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability:
        product.stock_status === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url,
      seller: { '@type': 'Organization', name: 'Atmar Horeca EOOD' },
    },
    url,
  }

  const brandSlug = Array.isArray(brand) ? brand[0]?.slug : (brand as { slug?: string } | null)?.slug

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Brands', item: `${siteUrl}/brands` },
      ...(brandName ? [{ '@type': 'ListItem', position: 3, name: brandName, ...(brandSlug && { item: `${siteUrl}/brands/${brandSlug}` }) }] : []),
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
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>›</span>
          <Link href="/brands" className="hover:text-gray-600">Brands</Link>
          {brandName && (
            <>
              <span>›</span>
              {(Array.isArray(brand) ? brand[0]?.slug : brand?.slug)
                ? <Link href={`/brands/${Array.isArray(brand) ? brand[0]?.slug : brand?.slug}`} className="hover:text-gray-600">{brandName}</Link>
                : <span>{brandName}</span>
              }
            </>
          )}
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

            <StockBadge
              stockStatus={product.stock_status}
              requiresConfirmation={
                product.requires_confirmation ||
                (Array.isArray(product.brand)
                  ? (product.brand[0]?.default_requires_confirmation ?? false)
                  : (product.brand?.default_requires_confirmation ?? false))
              }
            />

            {brand?.lead_time_note && (
              <p className="text-sm text-gray-600">{brand.lead_time_note}</p>
            )}

            <ProductPurchaseSection product={product} />

            {product.shipping_inefficient && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5">⚠️</span>
                <span>Orders containing this product are <strong>not eligible for free EU delivery</strong> due to its size or weight.</span>
              </div>
            )}

            {documents.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#1A1A5E] mb-2">Documents</p>
                <ul className="flex flex-col gap-1.5">
                  {documents.map(doc => (
                    <li key={doc.id}>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-documents/${doc.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 text-sm text-[#6B3D8F] hover:underline"
                      >
                        <span>📄</span>{doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {(product.description || product.specs?.length > 0 || explicitRelated.length > 0) && (
          <div className={`mt-12 ${(product.description && (product.specs?.length > 0 || explicitRelated.length > 0)) ? 'grid grid-cols-1 lg:grid-cols-2 gap-10 items-start' : ''}`}>
            {product.description && (
              <div>
                <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Product Description</h2>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
            {(product.specs?.length > 0 || explicitRelated.length > 0) && (
              <div className="flex flex-col gap-10">
                {product.specs?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Technical Specifications</h2>
                    <table className="w-full text-sm">
                      <tbody>
                        {product.specs.map((s, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="py-2 px-3 font-medium text-gray-700 w-2/5 rounded-l">{s.key}</td>
                            <td className="py-2 px-3 text-gray-600 rounded-r">{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {explicitRelated.length > 0 && (
                  <div>
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
            )}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-[#1A1A5E] mb-6">More from {brandName ?? 'this brand'}</h2>
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
                      <StockBadge
                        stockStatus={p.stock_status as 'in_stock' | 'out_of_stock' | 'unknown'}
                        requiresConfirmation={
                          p.requires_confirmation ||
                          (Array.isArray(product.brand)
                            ? (product.brand[0]?.default_requires_confirmation ?? false)
                            : (product.brand?.default_requires_confirmation ?? false))
                        }
                      />
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
