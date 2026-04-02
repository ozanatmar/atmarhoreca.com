import type { OrderItem } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
// Use current deployment URL for assets (logo), so it works on dev and production
const ASSET_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://atmarhoreca.com')
const LOGO_URL = `${ASSET_URL}/logo_white_no_bg.png`

const REVOLUT_IBAN = process.env.REVOLUT_EUR_IBAN ?? ''
const REVOLUT_BIC = process.env.REVOLUT_EUR_BIC ?? ''
const REVOLUT_HOLDER = process.env.REVOLUT_ACCOUNT_HOLDER ?? 'Atmar Horeca EOOD'

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Atmar Horeca</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#6B3D8F;padding:24px 32px;">
              <img src="${LOGO_URL}" alt="Atmar Horeca" height="48" style="display:block;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#1A1A5E;padding:20px 32px;text-align:center;">
              <p style="color:#9b9fca;font-size:12px;margin:0;">
                Atmar Horeca EOOD &bull; VAT: BG205062463 &bull; Varna, Bulgaria
              </p>
              <p style="color:#9b9fca;font-size:12px;margin:4px 0 0 0;">
                <a href="${SITE_URL}" style="color:#9b9fca;">${SITE_URL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

interface EmailOrderItem extends OrderItem {
  slug?: string
  sku?: string | null
}

function itemsTable(items: EmailOrderItem[], siteUrl: string): string {
  const rows = items.map((item) => {
    const url = item.sku
      ? `${siteUrl}/products/${encodeURIComponent(item.sku)}/${item.slug}`
      : item.slug ? `${siteUrl}/products/${item.slug}` : null
    const nameCell = url
      ? `<a href="${url}" style="color:#6B3D8F;text-decoration:none;font-weight:500;">${item.name}</a>`
      : item.name
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;">${nameCell}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">€${item.unit_price.toFixed(2)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">€${(item.unit_price * item.qty).toFixed(2)}</td>
    </tr>`
  }).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px 0;text-align:left;font-weight:600;color:#1A1A5E;">Product</th>
          <th style="padding:8px 0;text-align:center;font-weight:600;color:#1A1A5E;">Qty</th>
          <th style="padding:8px 0;text-align:right;font-weight:600;color:#1A1A5E;">Unit</th>
          <th style="padding:8px 0;text-align:right;font-weight:600;color:#1A1A5E;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function pricingTable(data: {
  subtotal: number
  shipping_cost?: number
  vat_rate: number
  vat_amount: number
  total?: number
  type?: string
}): string {
  const shippingRow = data.type === 'B'
    ? `<tr><td style="padding:4px 0;color:#555;">Shipping</td><td style="padding:4px 0;text-align:right;color:#F0A500;">To be confirmed</td></tr>`
    : data.shipping_cost != null
      ? `<tr><td style="padding:4px 0;color:#555;">Shipping</td><td style="padding:4px 0;text-align:right;">€${data.shipping_cost.toFixed(2)}</td></tr>`
      : ''

  const vatRow = data.vat_rate > 0
    ? `<tr><td style="padding:4px 0;color:#555;">VAT (${(data.vat_rate * 100).toFixed(0)}%)</td><td style="padding:4px 0;text-align:right;">€${data.vat_amount.toFixed(2)}</td></tr>`
    : `<tr><td style="padding:4px 0;color:#555;">VAT</td><td style="padding:4px 0;text-align:right;color:#555;">0% (reverse charge)</td></tr>`

  const totalRow = data.total != null
    ? `<tr style="font-weight:bold;font-size:16px;border-top:2px solid #1A1A5E;"><td style="padding:8px 0;">Total</td><td style="text-align:right;">€${data.total.toFixed(2)}</td></tr>`
    : ''

  return `
    <table width="100%" style="font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#555;">Subtotal (excl. VAT)</td><td style="padding:4px 0;text-align:right;">€${data.subtotal.toFixed(2)}</td></tr>
      ${shippingRow}
      ${vatRow}
      ${totalRow}
    </table>`
}

function addressBlock(label: string, addr: { street: string; city: string; postal_code: string; country_code: string } | null): string {
  if (!addr) return ''
  return `
    <div style="margin-top:8px;">
      <strong style="color:#1A1A5E;">${label}</strong><br/>
      <span style="color:#555;font-size:14px;">
        ${addr.street}<br/>
        ${addr.postal_code} ${addr.city}<br/>
        ${addr.country_code}
      </span>
    </div>`
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

// ============================================================
// Email #1 — Order Received (Type B)
// ============================================================
export function orderReceivedEmail(orderId: string, data: {
  full_name: string
  email?: string
  items: EmailOrderItem[]
  subtotal: number
  vat_rate: number
  vat_amount: number
  billing_address?: { street: string; city: string; postal_code: string; country_code: string } | null
  order_link: string
}) {
  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">Your order has been received</h2>
    <p>Dear ${data.full_name},</p>
    <p>Thank you for your order <strong>#${shortId(orderId)}</strong>. We have received it and are currently checking product availability with our supplier.</p>
    <p>We will send you a proforma invoice within <strong>2 business days</strong>. You can pay by card or bank transfer once you receive it.</p>
    ${itemsTable(data.items, SITE_URL)}
    ${pricingTable({ subtotal: data.subtotal, vat_rate: data.vat_rate, vat_amount: data.vat_amount, type: 'B' })}
    ${data.billing_address ? addressBlock('Billing Address', data.billing_address) : ''}
    <div style="margin:28px 0 8px 0;text-align:center;">
      <a href="${data.order_link}" style="background:#6B3D8F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
        View Order Details
      </a>
    </div>
  `
  return { subject: `Your order has been received — Order #${shortId(orderId)}`, html: baseLayout(content) }
}

// ============================================================
// Email #2 — Proforma Invoice
// ============================================================
export function proformaInvoiceEmail(orderId: string, data: {
  full_name: string
  email: string
  items: OrderItem[]
  subtotal: number
  shipping_cost: number
  vat_rate: number
  vat_amount: number
  total: number
  stripe_payment_link_url: string
}) {
  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">Proforma Invoice</h2>
    <p>Dear ${data.full_name},</p>
    <p>Please find your proforma invoice for Order <strong>#${shortId(orderId)}</strong>. You can pay by card using the button below, or by bank transfer using the details provided.</p>
    ${itemsTable(data.items, SITE_URL)}
    ${pricingTable({ subtotal: data.subtotal, shipping_cost: data.shipping_cost, vat_rate: data.vat_rate, vat_amount: data.vat_amount, total: data.total })}

    <div style="margin:24px 0;text-align:center;">
      <a href="${data.stripe_payment_link_url}" style="background:#7AB648;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
        Pay by Card
      </a>
    </div>

    <div style="background:#f5f5f5;border-radius:8px;padding:16px;font-size:13px;color:#555;">
      <strong>Pay by Bank Transfer:</strong><br />
      IBAN: ${REVOLUT_IBAN}<br />
      BIC/SWIFT: ${REVOLUT_BIC}<br />
      Account Holder: ${REVOLUT_HOLDER}<br />
      Payment Reference: <strong>Order #${shortId(orderId)}</strong>
    </div>
  `
  return { subject: `Proforma Invoice — Order #${shortId(orderId)}`, html: baseLayout(content) }
}

// ============================================================
// Email #3 — Payment Confirmed
// ============================================================
export function paymentConfirmedEmail(orderId: string, data: {
  full_name: string
  items: OrderItem[]
  total: number
  type: string
  estimated_days?: number
  order_link?: string
}) {
  const deliveryNote = data.type === 'A' && data.estimated_days
    ? `<p>Estimated delivery: <strong>${data.estimated_days} business days</strong> from today.</p>`
    : `<p>We will notify you with tracking information once your order has been dispatched.</p>`

  const viewOrder = data.order_link
    ? `<div style="margin:24px 0;text-align:center;"><a href="${data.order_link}" style="background:#6B3D8F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Order Details</a></div>`
    : ''

  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">Payment Confirmed</h2>
    <p>Dear ${data.full_name},</p>
    <p>We have received your payment for Order <strong>#${shortId(orderId)}</strong>. Your order is being processed and will be dispatched soon.</p>
    ${deliveryNote}
    ${itemsTable(data.items, SITE_URL)}
    <p style="font-weight:bold;font-size:16px;">Total paid: €${data.total.toFixed(2)}</p>
    ${viewOrder}
  `
  return { subject: `Payment confirmed — Order #${shortId(orderId)}`, html: baseLayout(content) }
}

// ============================================================
// Email #4 — Order Fulfilled
// ============================================================
export function orderFulfilledEmail(orderId: string, data: {
  full_name: string
  items: OrderItem[]
  tracking_number: string
  tracking_url?: string | null
}) {
  const trackBtn = data.tracking_url
    ? `<div style="margin:20px 0;"><a href="${data.tracking_url}" style="background:#6B3D8F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Track Your Order</a></div>`
    : ''

  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">Your order has been shipped</h2>
    <p>Dear ${data.full_name},</p>
    <p>Your order <strong>#${shortId(orderId)}</strong> is on its way. You can track your shipment using the information below.</p>
    <p><strong>Tracking Number:</strong> ${data.tracking_number}</p>
    ${trackBtn}
    ${itemsTable(data.items, SITE_URL)}
  `
  return { subject: `Your order has been shipped — Order #${shortId(orderId)}`, html: baseLayout(content) }
}

// ============================================================
// Admin payment received email (Type A — card payment)
// ============================================================
export function adminPaymentReceivedEmail(orderId: string, data: {
  full_name: string
  email?: string
  items: OrderItem[]
  total: number
  admin_link: string
}) {
  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">💳 Payment received</h2>
    <p><strong>Order:</strong> #${shortId(orderId)}</p>

    <div style="background:#f5f5f5;border-radius:8px;padding:16px;font-size:14px;margin-bottom:16px;">
      <strong style="color:#1A1A5E;">Customer</strong><br/>
      ${data.full_name}<br/>
      ${data.email ?? ''}
    </div>

    ${itemsTable(data.items, SITE_URL)}

    <p style="font-size:16px;font-weight:bold;">Total paid: €${data.total.toFixed(2)}</p>

    <div style="margin:24px 0;">
      <a href="${data.admin_link}" style="background:#6B3D8F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
        View in Admin
      </a>
    </div>
  `
  return { subject: `Payment received — Order #${shortId(orderId)}`, html: baseLayout(content) }
}

// ============================================================
// Admin new order email
// ============================================================
export function adminNewOrderEmail(orderId: string, data: {
  full_name: string
  email?: string
  phone?: string
  company_name?: string
  vat_number?: string
  items: EmailOrderItem[]
  subtotal: number
  vat_rate: number
  vat_amount: number
  billing_address?: { street: string; city: string; postal_code: string; country_code: string } | null
  admin_link: string
  order_link: string
}) {
  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">New order requires approval</h2>
    <p><strong>Order:</strong> #${shortId(orderId)}</p>

    <div style="background:#f5f5f5;border-radius:8px;padding:16px;font-size:14px;margin-bottom:16px;">
      <strong style="color:#1A1A5E;">Customer</strong><br/>
      ${data.full_name}${data.company_name ? ` — ${data.company_name}` : ''}<br/>
      ${data.email ?? ''}<br/>
      ${data.phone ? `📞 ${data.phone}<br/>` : ''}
      ${data.vat_number ? `VAT: ${data.vat_number}` : ''}
      ${data.billing_address ? `<br/>${data.billing_address.street}, ${data.billing_address.postal_code} ${data.billing_address.city}, ${data.billing_address.country_code}` : ''}
    </div>

    ${itemsTable(data.items, SITE_URL)}
    ${pricingTable({ subtotal: data.subtotal, vat_rate: data.vat_rate, vat_amount: data.vat_amount, type: 'B' })}

    <div style="margin:24px 0;display:flex;gap:12px;">
      <a href="${data.admin_link}" style="background:#6B3D8F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-right:12px;">
        View in Admin
      </a>
      <a href="${data.order_link}" style="background:#1A1A5E;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
        Customer Order Page
      </a>
    </div>
  `
  return { subject: `New order requires approval — Order #${shortId(orderId)}`, html: baseLayout(content) }
}
