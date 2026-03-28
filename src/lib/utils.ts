import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CartItem, VatResult } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

// EU country codes
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
]

export function isEuCountry(countryCode: string): boolean {
  return EU_COUNTRIES.includes(countryCode.toUpperCase())
}

export function calculateVat(
  billingCountry: string,
  vatValidated: boolean,
): VatResult {
  const country = billingCountry.toUpperCase()

  // Non-EU: no VAT
  if (!isEuCountry(country)) {
    return { rate: 0, reverse_charge: false, reason: 'Non-EU customer — no VAT' }
  }

  // Bulgaria always 20%
  if (country === 'BG') {
    return { rate: 0.20, reverse_charge: false, reason: '20% Bulgarian VAT' }
  }

  // Valid EU VAT number (not BG): reverse charge
  if (vatValidated) {
    return { rate: 0, reverse_charge: true, reason: 'VAT not applicable — reverse charge' }
  }

  // Other EU B2C: flat 20% (below OSS threshold)
  return { rate: 0.20, reverse_charge: false, reason: '20% VAT (standard rate below OSS threshold)' }
}

export function cartTotalWeight(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.weight_kg * item.qty, 0)
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

// Format business days estimate
export function businessDaysLabel(days: number): string {
  if (days === 1) return '1 business day'
  return `${days} business days`
}
