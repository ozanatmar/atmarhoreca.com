import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BlogPostForm from '../BlogPostForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  if (!post) notFound()

  const { data: products } = await supabase.from('products').select('id, name').eq('active', true).order('name')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Edit Blog Post</h1>
      <BlogPostForm post={post} products={products ?? []} />
    </div>
  )
}
