import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import BulkSheetsActions from './BulkSheetsActions'
import type { StockStatus } from '@/types'

const STOCK_BADGE: Record<StockStatus, { label: string; variant: 'green' | 'red' | 'orange' }> = {
  in_stock: { label: 'In Stock', variant: 'green' },
  out_of_stock: { label: 'Out of Stock', variant: 'red' },
  unknown: { label: 'Unknown', variant: 'orange' },
}

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, weight_kg, stock_status, active, supplier:suppliers(name)')
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

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Name</th>
              <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Supplier</th>
              <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Price</th>
              <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Weight</th>
              <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Stock</th>
              <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Active</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p, i) => {
              const supplier = Array.isArray(p.supplier) ? p.supplier[0] : p.supplier
              const stock = STOCK_BADGE[p.stock_status as StockStatus]
              return (
                <tr key={p.id} className={`hover:bg-purple-50 ${i % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-[#6B3D8F] hover:underline font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{supplier?.name}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-right">{p.weight_kg} kg</td>
                  <td className="px-4 py-3">
                    <Badge variant={stock.variant}>{stock.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${p.active ? 'text-[#7AB648]' : 'text-gray-400'}`}>
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
