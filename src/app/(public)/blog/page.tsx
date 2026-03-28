import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips, guides, and insights for horeca professionals.',
}

export const revalidate = 3600

export default async function BlogIndexPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, meta_description, published_at')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-8">Blog</h1>

      {!posts?.length && (
        <p className="text-gray-500">No posts published yet.</p>
      )}

      <div className="flex flex-col gap-6">
        {posts?.map((post) => (
          <article key={post.id} className="border-b border-gray-200 pb-6 last:border-0">
            <Link href={`/blog/${post.slug}`} className="group">
              <h2 className="text-xl font-bold text-[#1A1A5E] group-hover:text-[#6B3D8F] transition-colors mb-1">
                {post.title}
              </h2>
            </Link>
            <p className="text-xs text-gray-500 mb-2">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : ''}
            </p>
            {post.meta_description && (
              <p className="text-sm text-gray-600">{post.meta_description}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
