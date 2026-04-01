export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import BulkSheetsActions from './BulkSheetsActions'
import ProductsTable from './ProductsTable'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, price, weight_kg, stock_status, active, images, supplier:suppliers(name)')
      .order('name'),
    supabase
      .from('suppliers')
      .select('id, name')
      .order('name'),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A5E]">Products</h1>
        <Link href="/admin/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      <BulkSheetsActions suppliers={suppliers ?? []} />

      <ProductsTable products={products ?? []} />
    </div>
  )
}
