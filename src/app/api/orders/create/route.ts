import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    items,
    subtotal,
    shipping_cost,
    vat_rate,
    vat_amount,
    total,
    type,
    billing_address,
    shipping_address,
    full_name,
    company_name,
    vat_number,
    vat_validated,
  } = body

  // Upsert customer record with latest address info
  await supabase.from('customers').upsert({
    id: user.id,
    email: user.email!,
    full_name,
    company_name: company_name || null,
    vat_number: vat_number || null,
    vat_validated: vat_validated ?? false,
    country_code: billing_address.country_code,
    billing_address,
    shipping_address,
  })

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      type,
      status: type === 'A' ? 'awaiting_payment' : 'pending_approval',
      items,
      subtotal,
      shipping_cost: type === 'A' ? shipping_cost : 0,
      vat_rate,
      vat_amount,
      total,
      currency: 'EUR',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify admin and customer on order creation
  const customerInfo = { full_name, email: user.email, subtotal }
  await notifyAdmin(order.id, customerInfo)
  if (type === 'B') {
    await sendEmail('order_received', order.id, { full_name, email: user.email, items, subtotal })
  }

  return NextResponse.json({ orderId: order.id })
}

async function notifyAdmin(orderId: string, customer: { full_name: string; email?: string; subtotal: number }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atmarhoreca.com'

  // Telegram
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (token && chatId) {
    const text = `New order received — Order #${orderId.slice(0, 8).toUpperCase()}\nCustomer: ${customer.full_name} (${customer.email})\nSubtotal: €${customer.subtotal}\nView order: ${siteUrl}/admin/orders/${orderId}`
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch(console.error)
  }

  // Email to admin
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    await sendEmail('admin_new_order', orderId, {
      full_name: customer.full_name,
      email: customer.email,
      subtotal: customer.subtotal,
      admin_link: `${siteUrl}/admin/orders/${orderId}`,
    })
  }
}

// For internal API calls — always use current deployment URL
function apiBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return 'http://localhost:3000'
}

// For public-facing links (emails, Telegram)
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendEmail(template: string, orderId: string, data: Record<string, any>) {
  fetch(`${apiBaseUrl()}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, orderId, data }),
  }).catch(console.error)
}
