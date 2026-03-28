'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { slugify } from '@/lib/utils'
import type { BlogPost } from '@/types'

interface Props {
  post: BlogPost | null
  products: { id: string; name: string }[]
}

export default function BlogPostForm({ post, products }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? '')
  const [publishedAt, setPublishedAt] = useState(
    post?.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : ''
  )
  const [linkedProductIds, setLinkedProductIds] = useState<string[]>(post?.linked_product_ids ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!post) setSlug(slugify(val))
  }

  function toggleProduct(id: string) {
    setLinkedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()
    const payload = {
      title,
      slug,
      content,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      linked_product_ids: linkedProductIds,
    }

    const { error: dbError } = post
      ? await supabase.from('blog_posts').update(payload).eq('id', post.id)
      : await supabase.from('blog_posts').insert(payload)

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    // Trigger ISR revalidation for blog
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `/blog/${slug}` }),
    })

    router.push('/admin/blog')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <Input label="Title" value={title} onChange={(e) => handleTitleChange(e.target.value)} required />
      <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />

      <div>
        <label className="text-sm font-medium text-[#1A1A5E] block mb-1">Content (HTML or Markdown)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
        />
      </div>

      <Input label="Meta Title (max 60 chars)" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={60} />
      <Input label="Meta Description (max 160 chars)" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={160} />

      <div>
        <label className="text-sm font-medium text-[#1A1A5E] block mb-1">
          Published At (leave blank for draft)
        </label>
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
        />
      </div>

      {/* Linked products */}
      {products.length > 0 && (
        <div>
          <label className="text-sm font-medium text-[#1A1A5E] block mb-2">Linked Products</label>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{p.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[#C0392B]">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : post ? 'Save Changes' : 'Create Post'}
        </Button>
      </div>
    </form>
  )
}
