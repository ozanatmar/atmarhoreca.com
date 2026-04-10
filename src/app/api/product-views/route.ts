import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  let product_id: string, session_id: string
  try {
    ;({ product_id, session_id } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!product_id || !session_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Deduplicate: only count 1 view per session per product per 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('product_views')
    .select('id')
    .eq('product_id', product_id)
    .eq('session_id', session_id)
    .gte('visited_at', since)
    .limit(1)
    .maybeSingle()

  if (!existing) {
    await supabase.from('product_views').insert({ product_id, session_id })
  }

  return NextResponse.json({ ok: true })
}
