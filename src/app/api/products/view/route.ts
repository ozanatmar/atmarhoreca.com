import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: 'missing productId' }, { status: 400 })

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/product_views`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ product_id: productId, session_id: 'n/a' }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
