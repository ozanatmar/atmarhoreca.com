import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, shortId, productUrl } from '@/lib/utils'
import ClearCart from './ClearCart'

export const metadata: Metadata = {
  title: 'Order Details',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
  processing: 'Processing',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, customer:customers(full_name, email, company_name, phone, vat_number, billing_address, shipping_address)')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!order) notFound()

  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer

  // Fetch product images and slugs for order items
  const productIds = order.items.map((i: { product_id: string }) => i.product_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, sku, images')
    .in('id', productIds)
  const productMap = Object.fromEntries((products ?? []).map((p) => [p.id, p]))
  const isNew = order.status === 'pending_approval' || order.status === 'awaiting_payment'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
          <ClearCart />

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {isNew && (
                    <div className="w-8 h-8 bg-[#7AB648] rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <h1 className="text-xl font-bold text-[#1A1A5E]">
                    {order.type === 'B' ? 'Order Received' : 'Payment Confirmed'}
                  </h1>
                </div>
                <p className="text-sm text-gray-500">
                  Order #{shortId(order.id)} &bull; {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F5F5F5] text-[#1A1A5E] capitalize">
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            {order.type === 'B' && isNew && (
              <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                We will check availability and send you a proforma invoice within 2 business days. You can pay by card or bank transfer once you receive it.
              </p>
            )}
            {order.type === 'A' && isNew && (
              <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                Your payment was successful. A confirmation email has been sent to you. Your order is being processed and will be dispatched soon.
              </p>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1A1A5E]">Items</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="text-left px-6 py-3 text-[#1A1A5E] font-semibold">Product</th>
                  <th className="text-center px-4 py-3 text-[#1A1A5E] font-semibold">Qty</th>
                  <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Unit</th>
                  <th className="text-right px-6 py-3 text-[#1A1A5E] font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: { product_id: string; name: string; qty: number; unit_price: number }, i: number) => {
                  const product = productMap[item.product_id]
                  const image = product?.images?.[0]
                  const url = product ? productUrl(product) : null
                  return (
                    <tr key={item.product_id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {image && (
                            url ? (
                              <Link href={url} className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 block hover:opacity-80 transition-opacity">
                                <Image src={image} alt={item.name} width={48} height={48} className="object-contain w-full h-full" unoptimized />
                              </Link>
                            ) : (
                              <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                                <Image src={image} alt={item.name} width={48} height={48} className="object-contain w-full h-full" unoptimized />
                              </div>
                            )
                          )}
                          {url ? (
                            <Link href={url} className="text-[#1A1A5E] hover:underline font-medium text-sm">{item.name}</Link>
                          ) : (
                            <span className="text-gray-800 text-sm">{item.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatPrice(item.unit_price)}</td>
                      <td className="px-6 py-3 text-right font-semibold text-[#1A1A5E]">{formatPrice(item.unit_price * item.qty)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="font-semibold text-[#1A1A5E] mb-4">Summary</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal (excl. VAT)</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {order.shipping_cost > 0
                    ? formatPrice(order.shipping_cost)
                    : order.type === 'A'
                      ? 'Free'
                      : <span className="text-[#F0A500]">To be confirmed</span>}
                </span>
              </div>
              {order.vat_rate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT ({(order.vat_rate * 100).toFixed(0)}%)</span>
                  <span className="font-medium">{formatPrice(order.vat_amount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200 font-bold text-[#1A1A5E] text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-semibold text-[#1A1A5E] mb-3">Billing Information</h2>
              <div className="text-sm text-gray-700 flex flex-col gap-0.5">
                <p className="font-medium">{customer?.full_name}</p>
                {customer?.company_name && <p>{customer.company_name}</p>}
                {customer?.vat_number && <p className="text-gray-500">VAT: {customer.vat_number}</p>}
                {customer?.billing_address && (
                  <>
                    <p className="mt-1">{customer.billing_address.street}</p>
                    <p>{customer.billing_address.postal_code} {customer.billing_address.city}</p>
                    <p>{customer.billing_address.country_code}</p>
                  </>
                )}
                {customer?.phone && <p className="mt-1">{customer.phone}</p>}
                <p className="mt-1 text-gray-500">{customer?.email}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-semibold text-[#1A1A5E] mb-3">Shipping Address</h2>
              <div className="text-sm text-gray-700 flex flex-col gap-0.5">
                {customer?.shipping_address ? (
                  <>
                    <p className="font-medium">{customer.full_name}</p>
                    <p>{customer.shipping_address.street}</p>
                    <p>{customer.shipping_address.postal_code} {customer.shipping_address.city}</p>
                    <p>{customer.shipping_address.country_code}</p>
                    {customer.phone && <p className="mt-1">{customer.phone}</p>}
                  </>
                ) : customer?.billing_address ? (
                  <>
                    <p className="font-medium">{customer.full_name}</p>
                    <p>{customer.billing_address.street}</p>
                    <p>{customer.billing_address.postal_code} {customer.billing_address.city}</p>
                    <p>{customer.billing_address.country_code}</p>
                    {customer.phone && <p className="mt-1">{customer.phone}</p>}
                  </>
                ) : (
                  <p className="text-gray-400">Same as billing</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="font-semibold text-[#1A1A5E] mb-3">Timeline</h2>
            <div className="flex flex-col gap-2 text-sm">
              <DateRow label="Order Placed" value={order.created_at} />
              {order.paid_at && <DateRow label="Payment Received" value={order.paid_at} />}
              {order.estimated_ship_date && <DateRow label="Estimated Ship Date" value={order.estimated_ship_date} dateOnly />}
              {order.estimated_delivery_date && <DateRow label="Estimated Delivery" value={order.estimated_delivery_date} dateOnly />}
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
              <h2 className="font-semibold text-[#1A1A5E] mb-3">Tracking</h2>
              <p className="text-sm text-gray-700">Tracking number: <span className="font-mono font-semibold">{order.tracking_number}</span></p>
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-[#6B3D8F] hover:underline font-semibold">
                  Track your shipment →
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/account?tab=orders"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#6B3D8F] text-white rounded-xl font-semibold hover:bg-[#5a3278] transition-colors">
              View All Orders
            </Link>
            <Link href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Continue Shopping
            </Link>
          </div>
    </div>
  )
}

function DateRow({ label, value, dateOnly }: { label: string; value: string; dateOnly?: boolean }) {
  const formatted = dateOnly
    ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-[#1A1A5E]">{formatted}</span>
    </div>
  )
}
