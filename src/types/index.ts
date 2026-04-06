// ============================================================
// Database Types
// ============================================================

export type StockStatus = 'in_stock' | 'out_of_stock' | 'unknown'

export interface ProductOptionGroup {
  name: string
  options: Array<{ label: string; price_modifier: number }>
}

export interface SelectedOption {
  group: string
  label: string
  price_modifier: number
}
export type OrderType = 'A' | 'B'
export type OrderStatus = 'pending_approval' | 'awaiting_payment' | 'paid' | 'fulfilled' | 'cancelled'
export type ScrapeStatus = 'success' | 'failed'

export interface Brand {
  id: string
  name: string
  country_code: string
  lead_time_note: string | null
  handling_days: number
  default_requires_confirmation: boolean
  contact_email: string | null
  minimum_order_amount: number | null
  active: boolean
  created_at: string
}

export interface Product {
  id: string
  brand_id: string
  name: string
  slug: string
  sku: string | null
  description: string | null
  price: number
  weight_kg: number
  requires_confirmation: boolean
  stock_status: StockStatus
  last_scraped_at: string | null
  martellato_url: string | null
  images: string[]
  meta_title: string | null
  meta_description: string | null
  shipping_inefficient: boolean
  specs: Array<{ key: string; value: string }>
  option_groups: ProductOptionGroup[]
  active: boolean
  created_at: string
  // joined
  brand?: Brand
}

export interface Address {
  street: string
  city: string
  postal_code: string
  country_code: string
}

export interface Customer {
  id: string
  email: string
  full_name: string
  company_name: string | null
  phone: string | null
  vat_number: string | null
  vat_validated: boolean
  email_verified: boolean
  country_code: string | null
  billing_address: Address | null
  shipping_address: Address | null
  created_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  qty: number
  unit_price: number
  weight_kg: number
  selected_options?: SelectedOption[]
}

export interface Order {
  id: string
  customer_id: string
  type: OrderType
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  shipping_cost: number
  vat_rate: number
  vat_amount: number
  total: number
  currency: string
  stripe_payment_link_url: string | null
  stripe_payment_intent_id: string | null
  proforma_pdf_url: string | null
  estimated_delivery_days: number | null
  estimated_ship_date: string | null
  estimated_delivery_date: string | null
  paid_at: string | null
  tracking_number: string | null
  tracking_url: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  // joined
  customer?: Customer
}

export interface ShippingRate {
  id: string
  origin_country_code: string
  destination_country_code: string
  transit_days: number
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  linked_product_ids: string[]
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
  created_at: string
}

export interface ProductDocument {
  id: string
  product_id: string
  name: string
  file_path: string
  created_at: string
}

export interface ScrapeLog {
  id: string
  brand_id: string
  status: ScrapeStatus
  products_updated: number
  error_log: string | null
  ran_at: string
}

// ============================================================
// Cart Types
// ============================================================

export interface CartItem {
  cart_key: string
  product_id: string
  brand_id: string | null
  brand_name: string | null
  name: string
  slug: string
  sku: string | null
  price: number
  weight_kg: number
  qty: number
  images: string[]
  requires_confirmation: boolean
  shipping_inefficient: boolean
  stock_status: StockStatus
  selected_options?: SelectedOption[]
}

// ============================================================
// Checkout Types
// ============================================================

export interface CheckoutAddress {
  full_name: string
  company_name?: string
  phone?: string
  street: string
  city: string
  postal_code: string
  country_code: string
  vat_number?: string
  vat_validated?: boolean
}

export interface VatResult {
  rate: number
  reverse_charge: boolean
  reason: string
}
