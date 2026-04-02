'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Order } from '@/types'

interface Props {
  order: Order
}

export default function OrderActions({ order }: Props) {
  const router = useRouter()
  const [shippingCost, setShippingCost] = useState(String(order.shipping_cost))
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '')
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function callAction(action: string, extra?: Record<string, unknown>) {
    setLoading(true)
    setMsg('')
    const res = await fetch(`/api/orders/${order.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    const json = await res.json()
    setMsg(json.message ?? (res.ok ? 'Done' : 'Error'))
    setLoading(false)
    if (res.ok) router.refresh()
  }

  async function saveNotes() {
    await callAction('save_notes', { admin_notes: adminNotes })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Admin notes */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-[#1A1A5E] mb-3">Admin Notes (internal)</h2>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
          placeholder="Internal notes — not shown to customer"
        />
      </div>

      {/* Type B pending approval */}
      {order.type === 'B' && order.status === 'pending_approval' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1A1A5E] mb-3">Approve &amp; Send Proforma</h2>
          <div className="mb-4">
            <Input
              label="Shipping Cost (EUR)"
              type="number"
              step="0.01"
              min="0"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
            />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This will generate a Stripe Payment Link, create the proforma PDF, and send it to the customer.
          </p>
          <Button
            onClick={() => callAction('approve', { shipping_cost: parseFloat(shippingCost) })}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Approve & Send'}
          </Button>
        </div>
      )}

      {/* Awaiting payment — bank transfer (Type B only) */}
      {order.type === 'B' && order.status === 'awaiting_payment' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1A1A5E] mb-3">Payment</h2>
          {order.stripe_payment_link_url && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Stripe Payment Link:</p>
              <a href={order.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" className="text-[#6B3D8F] hover:underline text-sm break-all">
                {order.stripe_payment_link_url}
              </a>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => callAction('resend_proforma')} disabled={loading}>
              Resend Proforma
            </Button>
            <Button onClick={() => callAction('mark_paid_bank')} disabled={loading}>
              Mark as Paid (Bank Transfer)
            </Button>
          </div>
        </div>
      )}

      {/* Paid — fulfillment */}
      {order.status === 'paid' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1A1A5E] mb-3">Fulfillment</h2>
          <div className="flex flex-col gap-3 mb-4">
            <Input label="Tracking Number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            <Input label="Tracking URL" type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
          </div>
          <Button
            onClick={() => callAction('fulfill', { tracking_number: trackingNumber, tracking_url: trackingUrl })}
            disabled={loading || !trackingNumber}
          >
            {loading ? 'Processing...' : 'Mark as Fulfilled'}
          </Button>
        </div>
      )}

      {/* Cancel */}
      {['pending_approval', 'awaiting_payment'].includes(order.status) && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#1A1A5E] mb-3">Cancel Order</h2>
          <Button variant="danger" onClick={() => callAction('cancel')} disabled={loading}>
            Cancel Order
          </Button>
        </div>
      )}

      {msg && <p className="text-sm text-[#7AB648]">{msg}</p>}
    </div>
  )
}
