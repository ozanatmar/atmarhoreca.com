import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: 'missing productId' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('product_views')
    .insert({ product_id: productId, session_id: 'n/a' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
