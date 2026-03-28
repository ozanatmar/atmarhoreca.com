import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { formatPrice } from '@/lib/utils'
import StockBadge from '@/components/product/StockBadge'
import AddToCartButton from '@/components/product/AddToCartButton'
import ImageGallery from '@/components/product/ImageGallery'
import type { Product } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, supplier:suppliers(*)')
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
  const supplier = product.supplier

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? '',
    image: product.images,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image gallery */}
          <ImageGallery images={product.images} alt={product.name} />

          {/* Product details */}
          <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold text-[#1A1A5E]">{product.name}</h1>

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
            {supplier?.lead_time_note && (
              <p className="text-sm text-gray-600">{supplier.lead_time_note}</p>
            )}

            {/* CTA */}
            <AddToCartButton product={product} />

            {/* Shipping inefficiency warning */}
            {product.shipping_inefficient && (
              <div className="bg-[#FFF8E1] border border-[#F0A500] rounded-lg p-4 text-sm text-gray-700">
                Note: Due to the size or weight of this product, shipping costs will be
                calculated individually and confirmed in your proforma invoice.
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
      </div>
    </>
  )
}
