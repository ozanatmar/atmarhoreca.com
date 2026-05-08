import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkMartellatoStock } from '@/lib/martellato-stock'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productIds }: { productIds: string[] } = await req.json()
  if (!productIds?.length) return NextResponse.json({})

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, martellato_url')
    .in('id', productIds)

  if (!products?.length) return NextResponse.json({})

  const results: Record<string, 'in_stock' | 'out_of_stock'> = {}
  const nowOos: string[] = []

  await Promise.all(
    products.map(async (p) => {
      if (!p.martellato_url) return // skip non-Martellato products
      const status = await checkMartellatoStock(p.martellato_url, p.sku)
      results[p.id] = status
      if (status === 'out_of_stock') nowOos.push(p.id)
    })
  )

  if (nowOos.length) {
    const service = createServiceClient()
    await service
      .from('products')
      .update({ stock_status: 'out_of_stock' })
      .in('id', nowOos)
  }

  return NextResponse.json(results)
}
