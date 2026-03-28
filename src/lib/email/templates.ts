import type { OrderItem } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'
const LOGO_URL = 'https://atmar.bg/Atmar_Horeca_Logo_-_White.png'

const REVOLUT_IBAN = process.env.REVOLUT_IBAN ?? ''
const REVOLUT_BIC = process.env.REVOLUT_BIC ?? ''
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
              <img src="${LOGO_URL}" alt="Atmar Horeca" height="40" style="display:block;" />
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

function itemsTable(items: OrderItem[]): string {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">€${(item.unit_price).toFixed(2)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">€${(item.unit_price * item.qty).toFixed(2)}</td>
    </tr>`).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px 0;text-align:left;font-weight:600;">Product</th>
          <th style="padding:8px 0;text-align:center;font-weight:600;">Qty</th>
          <th style="padding:8px 0;text-align:right;font-weight:600;">Unit</th>
          <th style="padding:8px 0;text-align:right;font-weight:600;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

// ============================================================
// Email #1 — Order Received (Type B)
// ============================================================
export function orderReceivedEmail(orderId: string, data: {
  full_name: string
  items: OrderItem[]
  subtotal: number
}) {
  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">Your order has been received</h2>
    <p>Dear ${data.full_name},</p>
    <p>Thank you for your order <strong>#${shortId(orderId)}</strong>. We have received it and are currently checking product availability with our supplier.</p>
    <p>We will send you a proforma invoice within <strong>24 hours</strong>.</p>
    ${itemsTable(data.items)}
    <table width="100%" style="font-size:14px;">
      <tr>
        <td style="padding:4px 0;color:#555;">Subtotal (excl. VAT &amp; shipping)</td>
        <td style="padding:4px 0;text-align:right;">€${data.subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#555;">Shipping</td>
        <td style="padding:4px 0;text-align:right;color:#F0A500;">To be confirmed</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#555;">VAT</td>
        <td style="padding:4px 0;text-align:right;color:#F0A500;">To be confirmed</td>
      </tr>
    </table>
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
  const vatLabel = data.vat_rate === 0 ? 'VAT not applicable — reverse charge' : `VAT (${(data.vat_rate * 100).toFixed(0)}%)`

  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">Proforma Invoice</h2>
    <p>Dear ${data.full_name},</p>
    <p>Please find your proforma invoice for Order <strong>#${shortId(orderId)}</strong>. You can pay by card using the button below, or by bank transfer using the details provided.</p>
    ${itemsTable(data.items)}
    <table width="100%" style="font-size:14px;">
      <tr><td style="padding:4px 0;color:#555;">Subtotal (excl. VAT)</td><td style="text-align:right;">€${data.subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:#555;">Shipping</td><td style="text-align:right;">€${data.shipping_cost.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:#555;">${vatLabel}</td><td style="text-align:right;">€${data.vat_amount.toFixed(2)}</td></tr>
      <tr style="font-weight:bold;font-size:16px;border-top:2px solid #1A1A5E;">
        <td style="padding:8px 0;">Total</td>
        <td style="text-align:right;">€${data.total.toFixed(2)}</td>
      </tr>
    </table>

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
}) {
  const deliveryNote = data.type === 'A' && data.estimated_days
    ? `<p>Estimated delivery: <strong>${data.estimated_days} business days</strong> from today.</p>`
    : `<p>We will notify you with tracking information once your order has been dispatched.</p>`

  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">Payment Confirmed</h2>
    <p>Dear ${data.full_name},</p>
    <p>We have received your payment for Order <strong>#${shortId(orderId)}</strong>. Your order is being processed and will be dispatched soon.</p>
    ${deliveryNote}
    ${itemsTable(data.items)}
    <p style="font-weight:bold;font-size:16px;">Total paid: €${data.total.toFixed(2)}</p>
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
    ${itemsTable(data.items)}
  `
  return { subject: `Your order has been shipped — Order #${shortId(orderId)}`, html: baseLayout(content) }
}

// ============================================================
// Admin new order email
// ============================================================
export function adminNewOrderEmail(orderId: string, data: {
  full_name: string
  email?: string
  subtotal: number
  admin_link: string
}) {
  const content = `
    <h2 style="color:#1A1A5E;margin-top:0;">New order requires approval</h2>
    <p><strong>Order:</strong> #${shortId(orderId)}</p>
    <p><strong>Customer:</strong> ${data.full_name} (${data.email})</p>
    <p><strong>Subtotal:</strong> €${data.subtotal.toFixed(2)}</p>
    <div style="margin:20px 0;">
      <a href="${data.admin_link}" style="background:#6B3D8F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Order in Admin</a>
    </div>
  `
  return { subject: `New order requires approval — Order #${shortId(orderId)}`, html: baseLayout(content) }
}
