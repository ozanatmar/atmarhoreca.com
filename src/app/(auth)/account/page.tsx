import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { shortId } from '@/lib/utils'
import AccountForm from './AccountForm'

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, type, status, total, currency, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-8">My Account</h1>

      <AccountForm customer={customer} userId={user.id} />

      {/* Order history */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Order History</h2>
        {!orders?.length ? (
          <p className="text-sm text-gray-500">You have no orders yet.</p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Order</th>
                  <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}>
                    <td className="px-4 py-3">
                      <Link href={`/order/${order.id}`} className="text-[#6B3D8F] hover:underline font-mono">
                        #{shortId(order.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-700">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#1A1A5E]">
                      {order.currency} {Number(order.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
