import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, published_at, linked_product_ids')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A5E]">Blog Posts</h1>
        <Link href="/admin/blog/new">
          <Button>+ New Post</Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Title</th>
              <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Status</th>
              <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Published</th>
              <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Linked Products</th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((post, i) => {
              const isLive = post.published_at && new Date(post.published_at) <= new Date()
              return (
                <tr key={post.id} className={`hover:bg-purple-50 ${i % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/${post.id}`} className="text-[#6B3D8F] hover:underline font-medium">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={isLive ? 'green' : 'gray'}>{isLive ? 'Live' : 'Draft'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {post.linked_product_ids?.length ?? 0}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!posts?.length && (
          <div className="p-10 text-center text-gray-500">No blog posts yet</div>
        )}
      </div>
    </div>
  )
}
