import type { ShippingRate } from '@/types'

/**
 * Look up the transit days for a route.
 * Returns null if no rate exists for this origin→destination (triggers Type B).
 * Shipping cost is always free for EU destinations.
 */
export function calculateShipping(
  rates: ShippingRate[],
  originCountry: string,
  destinationCountry: string,
): { cost: number; transitDays: number } | null {
  const route = rates.find(
    (r) =>
      r.origin_country_code === originCountry &&
      r.destination_country_code === destinationCountry,
  )
  if (!route) return null
  return { cost: 0, transitDays: route.transit_days }
}
