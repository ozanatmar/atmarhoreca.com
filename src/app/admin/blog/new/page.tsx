import { createClient } from '@/lib/supabase/server'
import BlogPostForm from '../BlogPostForm'

export default async function NewBlogPostPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('id, name').eq('active', true).order('name')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">New Blog Post</h1>
      <BlogPostForm post={null} products={products ?? []} />
    </div>
  )
}
