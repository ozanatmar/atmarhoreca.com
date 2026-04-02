import { formatPrice, businessDaysLabel } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { StepProps } from './types'

export default function StepReview({
  items,
  address,
  sameShipping,
  shippingAddress,
  orderType,
  subtotal,
  shippingCost,
  shippingResult,
  vatResult,
  vatAmount,
  total,
  setStep,
  maxHandlingDays,
}: StepProps) {
  const destAddress = sameShipping ? address : shippingAddress

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Step 3 — Order Summary &amp; Review</h2>

      {/* Order type label */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Order Type</p>
          <p className="font-semibold text-[#1A1A5E]">
            {orderType === 'A' ? 'Direct Order' : 'Quote Required'}
          </p>
        </div>
        <Badge variant={orderType === 'A' ? 'green' : 'orange'}>
          Type {orderType}
        </Badge>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-semibold text-[#1A1A5E] mb-3">Items</h3>
        {items.map((item) => (
          <div key={item.product_id} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
            <span className="text-gray-700">{item.name} × {item.qty}</span>
            <span className="font-semibold text-[#1A1A5E]">{formatPrice(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      {/* Financials */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-semibold text-[#1A1A5E] mb-3">Financials</h3>
        <div className="flex flex-col gap-2 text-sm">
          <Row label="Subtotal (excl. VAT)" value={formatPrice(subtotal)} />

          {orderType === 'A' ? (
            <Row label="Shipping" value={formatPrice(shippingCost)} />
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="text-[#F0A500] font-medium text-xs self-center">
                To be confirmed — will be included in your proforma invoice
              </span>
            </div>
          )}

          {vatResult.rate > 0 && (
            <Row label={`VAT (${(vatResult.rate * 100).toFixed(0)}%)`} value={formatPrice(vatAmount)} />
          )}
          <div className="border-t border-gray-200 pt-2 mt-1">
            <Row label="Total" value={formatPrice(total)} bold />
          </div>
        </div>
      </div>

      {/* Delivery estimate (Type A only) */}
      {orderType === 'A' && shippingResult && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <p className="text-sm text-gray-600">
            Estimated delivery:{' '}
            <strong className="text-[#1A1A5E]">
              {businessDaysLabel(maxHandlingDays + shippingResult.transitDays)}
            </strong>{' '}
            from payment confirmation
          </p>
        </div>
      )}

      {/* Destination warning */}
      {orderType === 'B' && !shippingResult && destAddress.country_code && (
        <div className="bg-[#FFF8E1] border border-[#F0A500] rounded-xl p-4 text-sm text-gray-700 mb-4">
          Shipping to your location will be calculated individually and included in your proforma invoice.
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button size="lg" onClick={() => setStep(4)}>
          Continue to Payment
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-[#1A1A5E]' : 'text-gray-700'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
