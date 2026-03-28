'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart-store'
import { calculateVat, cartSubtotal, cartTotalWeight } from '@/lib/utils'
import { calculateShipping } from '@/lib/shipping'
import { determineOrderType } from '@/lib/order-type'
import type { Customer, ShippingRate, CheckoutAddress } from '@/types'
import StepCart from './StepCart'
import StepAddress from './StepAddress'
import StepReview from './StepReview'
import StepPayment from './StepPayment'

interface Props {
  customer: Customer | null
  userId: string
  shippingRates: ShippingRate[]
}

export type CheckoutStep = 1 | 2 | 3 | 4

export default function CheckoutFlow({ customer, userId, shippingRates }: Props) {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const [step, setStep] = useState<CheckoutStep>(1)
  const [address, setAddress] = useState<CheckoutAddress>({
    full_name: customer?.full_name ?? '',
    company_name: customer?.company_name ?? '',
    street: customer?.billing_address?.street ?? '',
    city: customer?.billing_address?.city ?? '',
    postal_code: customer?.billing_address?.postal_code ?? '',
    country_code: customer?.billing_address?.country_code ?? '',
    vat_number: customer?.vat_number ?? '',
    vat_validated: customer?.vat_validated ?? false,
  })
  const [sameShipping, setSameShipping] = useState(true)
  const [shippingAddress, setShippingAddress] = useState<CheckoutAddress>(address)
  const [orderId, setOrderId] = useState<string | null>(null)

  if (items.length === 0 && step < 4) {
    router.push('/cart')
    return null
  }

  // Determine destination country for shipping
  const destCountry = sameShipping
    ? address.country_code
    : shippingAddress.country_code

  // Compute shipping and order type
  const totalWeight = cartTotalWeight(items)
  const originCountry = 'IT' // Martellato is IT; in future could vary per supplier

  const shippingResult = destCountry
    ? calculateShipping(shippingRates, originCountry, destCountry, totalWeight)
    : null

  const orderType = determineOrderType(items, !!shippingResult)
  const subtotal = cartSubtotal(items)
  const shippingCost = orderType === 'A' && shippingResult ? shippingResult.cost : 0
  const vatResult = calculateVat(address.country_code || 'BG', address.vat_validated ?? false)
  const vatAmount = (subtotal + shippingCost) * vatResult.rate
  const total = subtotal + shippingCost + vatAmount

  const stepProps = {
    step,
    setStep,
    items,
    address,
    setAddress,
    sameShipping,
    setSameShipping,
    shippingAddress,
    setShippingAddress,
    orderType,
    subtotal,
    shippingCost,
    shippingResult,
    vatResult,
    vatAmount,
    total,
    userId,
    customer,
    orderId,
    setOrderId,
    clearCart,
    router,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Progress */}
      <CheckoutProgress step={step} />

      {step === 1 && <StepCart {...stepProps} />}
      {step === 2 && <StepAddress {...stepProps} />}
      {step === 3 && <StepReview {...stepProps} />}
      {step === 4 && <StepPayment {...stepProps} />}
    </div>
  )
}

function CheckoutProgress({ step }: { step: CheckoutStep }) {
  const steps = ['Cart', 'Details', 'Review', 'Payment']
  return (
    <div className="flex items-center mb-8 gap-0">
      {steps.map((label, i) => {
        const num = (i + 1) as CheckoutStep
        const active = step === num
        const done = step > num
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done
                    ? 'bg-[#7AB648] text-white'
                    : active
                    ? 'bg-[#6B3D8F] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? '✓' : num}
              </div>
              <span className={`text-xs mt-1 ${active ? 'text-[#6B3D8F] font-semibold' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-[#7AB648]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
