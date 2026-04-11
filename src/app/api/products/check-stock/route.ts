import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productIds }: { productIds: string[] } = await req.json()
  if (!productIds?.length) return NextResponse.json({})

  // Fetch martellato_url for requested products
  const { data: products } = await supabase
    .from('products')
    .select('id, martellato_url')
    .in('id', productIds)

  if (!products?.length) return NextResponse.json({})

  const results: Record<string, 'in_stock' | 'out_of_stock'> = {}
  const nowOos: string[] = []

  await Promise.all(
    products.map(async (p) => {
      if (!p.martellato_url) {
        results[p.id] = 'out_of_stock'
        nowOos.push(p.id)
        return
      }
      try {
        const res = await fetch(p.martellato_url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) {
          results[p.id] = 'in_stock'
        } else {
          results[p.id] = 'out_of_stock'
          nowOos.push(p.id)
        }
      } catch {
        results[p.id] = 'out_of_stock'
        nowOos.push(p.id)
      }
    })
  )

  // Update stock_status in DB for newly discovered OOS products
  if (nowOos.length) {
    const service = createServiceClient()
    await service
      .from('products')
      .update({ stock_status: 'out_of_stock' })
      .in('id', nowOos)
  }

  return NextResponse.json(results)
}
