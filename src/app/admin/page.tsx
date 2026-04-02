import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, shortId } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import type { OrderStatus } from '@/types'

const TABS: { label: string; status: OrderStatus }[] = [
  { label: 'Pending Approval', status: 'pending_approval' },
  { label: 'Awaiting Payment', status: 'awaiting_payment' },
  { label: 'Paid', status: 'paid' },
  { label: 'Fulfilled', status: 'fulfilled' },
  { label: 'Cancelled', status: 'cancelled' },
]

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeStatus: OrderStatus = (tab as OrderStatus) ?? 'pending_approval'

  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, type, status, total, currency, created_at, items, customer:customers(full_name, email)')
    .eq('status', activeStatus)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/admin?tab=${t.status}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStatus === t.status
                ? 'bg-[#6B3D8F] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {!orders?.length ? (
          <div className="p-10 text-center text-gray-500">No orders in this tab</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Order</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Customer</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Items</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Type</th>
                <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Total</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
                return (
                  <tr key={order.id} className={`hover:bg-purple-50 cursor-pointer ${i % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-[#6B3D8F] hover:underline font-mono font-bold">
                        #{shortId(order.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{customer?.full_name}</div>
                      <div className="text-xs text-gray-400">{customer?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {Array.isArray(order.items) ? order.items.length : 0}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.type === 'A' ? 'green' : 'orange'}>
                        Type {order.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#1A1A5E]">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
