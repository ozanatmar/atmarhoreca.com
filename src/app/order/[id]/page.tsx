import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, shortId } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!order) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-[#F5F5F5]">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-10">
            <div className="w-16 h-16 bg-[#7AB648] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#1A1A5E] mb-2">
              {order.type === 'B' ? 'Order Received' : 'Payment Confirmed'}
            </h1>

            <p className="text-gray-500 mb-1">Order #{shortId(order.id)}</p>
            <p className="text-xl font-bold text-[#1A1A5E] mb-6">{formatPrice(order.total)} EUR</p>

            {order.type === 'B' && (
              <p className="text-sm text-gray-600 mb-6">
                Your order has been received. We will check availability and send you a proforma
                invoice within 24 hours.
              </p>
            )}

            {order.type === 'A' && (
              <p className="text-sm text-gray-600 mb-6">
                Thank you for your payment. Your order is being processed and will be dispatched
                soon.
              </p>
            )}

            {order.tracking_number && (
              <div className="bg-[#F5F5F5] rounded-xl p-4 mb-6 text-sm text-left">
                <p className="font-semibold text-[#1A1A5E] mb-1">Tracking Information</p>
                <p className="text-gray-700">Tracking: {order.tracking_number}</p>
                {order.tracking_url && (
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-[#6B3D8F] hover:underline mt-1 inline-block">
                    Track your order
                  </a>
                )}
              </div>
            )}

            <Link href="/account" className="text-[#6B3D8F] hover:underline text-sm">
              View all orders
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
