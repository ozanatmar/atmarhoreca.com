import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug, path } = await request.json()

  if (path) {
    revalidatePath(path)
  } else if (slug) {
    revalidatePath(`/products/${slug}`)
  }

  return NextResponse.json({ revalidated: true })
}
