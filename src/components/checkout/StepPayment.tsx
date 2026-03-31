'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import type { StepProps } from './types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function StepPayment(props: StepProps) {
  const { orderType, total, subtotal, shippingCost, vatAmount, vatResult, items, address, sameShipping, shippingAddress, userId, setOrderId, clearCart, router, setStep } = props

  const [submitting, setSubmitting] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function createOrder(): Promise<string | null> {
    const billingAddr = {
      street: address.street,
      city: address.city,
      postal_code: address.postal_code,
      country_code: address.country_code,
    }
    const shippingAddr = sameShipping ? billingAddr : {
      street: shippingAddress.street,
      city: shippingAddress.city,
      postal_code: shippingAddress.postal_code,
      country_code: shippingAddress.country_code,
    }

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          qty: i.qty,
          unit_price: i.price,
          weight_kg: i.weight_kg,
        })),
        subtotal,
        shipping_cost: shippingCost,
        vat_rate: vatResult.rate,
        vat_amount: vatAmount,
        total,
        type: props.orderType,
        billing_address: billingAddr,
        shipping_address: shippingAddr,
        full_name: address.full_name,
        company_name: address.company_name,
        vat_number: address.vat_number,
        vat_validated: address.vat_validated,
      }),
    })

    if (!res.ok) {
      setError('Failed to create order. Please try again.')
      return null
    }

    const json = await res.json()
    return json.orderId as string
  }

  // Type B: submit without payment
  async function handleTypeBSubmit() {
    setSubmitting(true)
    setError('')
    const id = await createOrder()
    if (!id) { setSubmitting(false); return }
    setOrderId(id)
    clearCart()
    router.push(`/order/${id}`)
  }

  // Type A: create order then PaymentIntent
  async function handleTypeAInit() {
    setSubmitting(true)
    setError('')
    const id = await createOrder()
    if (!id) { setSubmitting(false); return }
    setOrderId(id)

    const res = await fetch('/api/orders/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, amount: Math.round(total * 100) }),
    })
    const json = await res.json()
    if (!json.clientSecret) {
      setError('Failed to initialize payment.')
      setSubmitting(false)
      return
    }
    setClientSecret(json.clientSecret)
    setSubmitting(false)
  }

  if (orderType === 'B') {
    return (
      <div>
        <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Step 4 — Submit Order</h2>
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-gray-700 mb-4">
            Your order total is <strong className="text-[#1A1A5E]">{formatPrice(total)}</strong>.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            No payment is taken now. After submitting, we will check availability and send you a
            proforma invoice within 24 hours. You can then pay by card or bank transfer.
          </p>
          {error && <p className="text-sm text-[#C0392B] mb-4">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button size="lg" onClick={handleTypeBSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Order'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Type A
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Step 4 — Payment</h2>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <p className="text-gray-700 mb-6">
          Total to pay: <strong className="text-[#1A1A5E]">{formatPrice(total)}</strong>
        </p>

        {!clientSecret && (
          <>
            {error && <p className="text-sm text-[#C0392B] mb-4">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button size="lg" onClick={handleTypeAInit} disabled={submitting}>
                {submitting ? 'Loading payment...' : 'Pay by Card'}
              </Button>
            </div>
          </>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm
              orderId={props.orderId!}
              clearCart={clearCart}
              router={props.router}
            />
          </Elements>
        )}
      </div>
    </div>
  )
}

function StripePaymentForm({
  orderId,
  clearCart,
  router,
}: {
  orderId: string
  clearCart: () => void
  router: ReturnType<typeof import('next/navigation').useRouter>
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/order/${orderId}`,
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setSubmitting(false)
    } else {
      clearCart()
    }
  }

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-sm text-[#C0392B]">{error}</p>}
      <Button type="submit" size="lg" disabled={submitting || !stripe}>
        {submitting ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  )
}
