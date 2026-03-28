import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { CartItem, CheckoutAddress, Customer, OrderType, ShippingRate, VatResult } from '@/types'
import type { CheckoutStep } from './CheckoutFlow'

export interface StepProps {
  step: CheckoutStep
  setStep: (step: CheckoutStep) => void
  items: CartItem[]
  address: CheckoutAddress
  setAddress: (a: CheckoutAddress) => void
  sameShipping: boolean
  setSameShipping: (v: boolean) => void
  shippingAddress: CheckoutAddress
  setShippingAddress: (a: CheckoutAddress) => void
  orderType: OrderType
  subtotal: number
  shippingCost: number
  shippingResult: { cost: number; transitDays: number } | null
  vatResult: VatResult
  vatAmount: number
  total: number
  userId: string
  customer: Customer | null
  orderId: string | null
  setOrderId: (id: string) => void
  clearCart: () => void
  router: AppRouterInstance
}
