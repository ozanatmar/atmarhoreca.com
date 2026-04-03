import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.BLOG_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    title: string
    slug: string
    content: string
    meta_title: string
    meta_description: string
    linked_product_ids: string[]
    published_at: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, slug, content, meta_title, meta_description, linked_product_ids, published_at } = body

  if (!title || !slug || !content || !meta_title || !meta_description || !published_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 })
  }

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      meta_title,
      meta_description,
      linked_product_ids: linked_product_ids ?? [],
      published_at: new Date(published_at).toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger ISR revalidation
  revalidatePath(`/blog/${slug}`)
  revalidatePath('/blog')

  return NextResponse.json({
    success: true,
    id: post.id,
    url: `/blog/${slug}`,
  })
}
