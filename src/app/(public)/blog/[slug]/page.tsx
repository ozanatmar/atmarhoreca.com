import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { productUrl } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('slug')
      .not('published_at', 'is', null)
    return (data ?? []).map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, meta_title, meta_description, published_at')
    .eq('slug', slug)
    .single()
  if (!post) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
  const title = post.meta_title ?? post.title
  return {
    title,
    description: post.meta_description ?? '',
    alternates: { canonical: `${siteUrl}/blog/${slug}` },
    openGraph: { title, description: post.meta_description ?? '', url: `${siteUrl}/blog/${slug}` },
  }
}

export const revalidate = 3600

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .single()

  if (!post) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'

  // Fetch linked products
  let linkedProducts: Array<{ id: string; name: string; slug: string; sku: string | null }> = []
  if (post.linked_product_ids?.length) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, sku')
      .in('id', post.linked_product_ids)
      .eq('active', true)
    linkedProducts = data ?? []
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.published_at,
    publisher: { '@type': 'Organization', name: 'Atmar Horeca EOOD' },
    url: `${siteUrl}/blog/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A5E] mb-3">{post.title}</h1>
        <p className="text-sm text-gray-500 mb-8">
          Published{' '}
          {new Date(post.published_at!).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        <div
          className="prose prose-sm sm:prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {linkedProducts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Related Products</h2>
            <ul className="flex flex-col gap-2">
              {linkedProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={productUrl(p)}
                    className="text-[#6B3D8F] hover:underline font-medium"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  )
}
