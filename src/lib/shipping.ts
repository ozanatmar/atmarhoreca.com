import type { ShippingRate } from '@/types'

/**
 * Calculate shipping cost using the rate table.
 * For weight > 30kg: additive (rate(30) + rate(remainder)).
 * Returns null if no rate found for this route (triggers Type B).
 */
export function calculateShipping(
  rates: ShippingRate[],
  originCountry: string,
  destinationCountry: string,
  totalWeightKg: number,
): { cost: number; transitDays: number } | null {
  const routeRates = rates.filter(
    (r) =>
      r.origin_country_code === originCountry &&
      r.destination_country_code === destinationCountry,
  )

  if (routeRates.length === 0) return null

  const getRate = (kg: number): ShippingRate | undefined =>
    routeRates.find((r) => r.weight_kg === kg)

  const weight = Math.ceil(totalWeightKg)

  if (weight <= 30) {
    const rate = getRate(weight) ?? getRate(30)
    if (!rate) return null
    return { cost: rate.rate_eur, transitDays: rate.transit_days }
  }

  // > 30kg: additive
  const rate30 = getRate(30)
  if (!rate30) return null

  const remainder = weight - 30
  const remainderRate = getRate(Math.min(remainder, 30))
  if (!remainderRate) return null

  return {
    cost: rate30.rate_eur + remainderRate.rate_eur,
    transitDays: rate30.transit_days,
  }
}
