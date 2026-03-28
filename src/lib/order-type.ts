import type { CartItem, OrderType } from '@/types'

/**
 * Determine order type (A or B) based on cart contents and shipping availability.
 * Per spec Section 7.
 */
export function determineOrderType(
  items: CartItem[],
  shippingAvailable: boolean,
): OrderType {
  if (items.some((item) => item.requires_confirmation)) return 'B'
  if (items.some((item) => item.stock_status !== 'in_stock')) return 'B'
  if (!shippingAvailable) return 'B'
  return 'A'
}
