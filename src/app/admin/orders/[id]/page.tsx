import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, shortId } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import OrderActions from './OrderActions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, customer:customers(*)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A5E]">Order #{shortId(order.id)}</h1>
        <Badge variant={order.type === 'A' ? 'green' : 'orange'}>Type {order.type}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1A1A5E] mb-3">Customer</h2>
          <dl className="text-sm space-y-1">
            <Row label="Name" value={customer?.full_name} />
            <Row label="Email" value={customer?.email} />
            {customer?.company_name && <Row label="Company" value={customer.company_name} />}
            {customer?.vat_number && (
              <Row
                label="VAT"
                value={`${customer.vat_number} ${customer.vat_validated ? '(validated)' : '(not validated)'}`}
              />
            )}
          </dl>
          {customer?.billing_address && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Billing Address</p>
              <AddressBlock addr={customer.billing_address} />
            </div>
          )}
          {customer?.shipping_address && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Shipping Address</p>
              <AddressBlock addr={customer.shipping_address} />
            </div>
          )}
        </div>

        {/* Financials */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1A1A5E] mb-3">Financials</h2>
          <dl className="text-sm space-y-1.5">
            <Row label="Subtotal (excl. VAT)" value={formatPrice(order.subtotal)} />
            <Row label="Shipping" value={formatPrice(order.shipping_cost)} />
            <Row label={`VAT (${(order.vat_rate * 100).toFixed(0)}%)`} value={formatPrice(order.vat_amount)} />
            <Row label="Total" value={formatPrice(order.total)} bold />
            <Row label="Currency" value={order.currency} />
          </dl>
          {order.stripe_payment_link_url && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Payment Link</p>
              <a href={order.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6B3D8F] hover:underline break-all">
                {order.stripe_payment_link_url}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-bold text-[#1A1A5E] mb-3">Timeline</h2>
        <dl className="text-sm space-y-1.5">
          <Row
            label="Order Placed"
            value={new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          />
          {order.paid_at && (
            <Row
              label="Payment Received"
              value={new Date(order.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            />
          )}
          {order.estimated_ship_date && (
            <Row
              label="Est. Ship Date"
              value={new Date(order.estimated_ship_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
          )}
          {order.estimated_delivery_date && (
            <Row
              label="Est. Delivery Date"
              value={new Date(order.estimated_delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
          )}
        </dl>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-bold text-[#1A1A5E] mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">Product</th>
              <th className="text-right py-2 text-gray-500 font-medium">Qty</th>
              <th className="text-right py-2 text-gray-500 font-medium">Unit Price</th>
              <th className="text-right py-2 text-gray-500 font-medium">Weight</th>
              <th className="text-right py-2 text-gray-500 font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: { product_id: string; name: string; qty: number; unit_price: number; weight_kg: number }) => (
              <tr key={item.product_id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 text-gray-700">{item.name}</td>
                <td className="py-2 text-right">{item.qty}</td>
                <td className="py-2 text-right">{formatPrice(item.unit_price)}</td>
                <td className="py-2 text-right">{item.weight_kg} kg</td>
                <td className="py-2 text-right font-semibold">{formatPrice(item.unit_price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <OrderActions order={order} />
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value?: string | null; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-[#1A1A5E]' : ''}`}>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-800">{value ?? '—'}</dd>
    </div>
  )
}

function AddressBlock({ addr }: { addr: { street?: string; city?: string; postal_code?: string; country_code?: string } }) {
  return (
    <p className="text-sm text-gray-700">
      {addr.street}, {addr.city}, {addr.postal_code}, {addr.country_code}
    </p>
  )
}
