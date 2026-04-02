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
    estimated_delivery_days,
    billing_address,
    shipping_address,
    full_name,
    company_name,
    phone,
    vat_number,
    vat_validated,
  } = body

  // Validate minimum order amounts per brand
  const brandIds = [...new Set((items as { brand_id?: string }[]).map((i) => i.brand_id).filter(Boolean))] as string[]
  if (brandIds.length > 0) {
    const { data: brands } = await supabase.from('brands').select('id, name, minimum_order_amount').in('id', brandIds)
    for (const brand of brands ?? []) {
      if (!brand.minimum_order_amount) continue
      const total = (items as { brand_id: string; unit_price: number; qty: number }[])
        .filter((i) => i.brand_id === brand.id)
        .reduce((sum, i) => sum + i.unit_price * i.qty, 0)
      if (total < brand.minimum_order_amount) {
        return NextResponse.json({ error: `Minimum order for ${brand.name} is €${brand.minimum_order_amount.toFixed(2)}` }, { status: 422 })
      }
    }
  }

  // Upsert customer record with latest address info
  await supabase.from('customers').upsert({
    id: user.id,
    email: user.email!,
    full_name,
    company_name: company_name || null,
    phone: phone || null,
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
      estimated_delivery_days: estimated_delivery_days ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Type B: notify admin and send order received email immediately (no payment step)
  if (type === 'B') {
    // Fetch product slugs/skus for email links
    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products } = await supabase.from('products').select('id, slug, sku').in('id', productIds)
    const productMap = Object.fromEntries((products ?? []).map((p: { id: string; slug: string; sku: string | null }) => [p.id, p]))
    const enrichedItems = items.map((i: { product_id: string }) => ({ ...i, ...productMap[i.product_id] }))

    const orderLink = `${siteUrl()}/order/${order.id}`
    const adminLink = `${siteUrl()}/admin/orders/${order.id}`

    await notifyAdmin(order.id, {
      full_name, email: user.email, subtotal,
      phone, company_name, vat_number,
      items: enrichedItems, vat_rate, vat_amount,
      billing_address, admin_link: adminLink, order_link: orderLink,
    })
    await sendEmail('order_received', order.id, {
      full_name, email: user.email, items: enrichedItems,
      subtotal, vat_rate, vat_amount, billing_address,
      order_link: orderLink,
    })
  }

  return NextResponse.json({ orderId: order.id })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyAdmin(orderId: string, data: Record<string, any>) {
  // Telegram
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (token && chatId) {
    const text = `New order — #${orderId.slice(0, 8).toUpperCase()}\nCustomer: ${data.full_name} (${data.email})\n${data.phone ? `Phone: ${data.phone}\n` : ''}${data.company_name ? `Company: ${data.company_name}\n` : ''}Subtotal: €${data.subtotal}\nView: ${data.admin_link}`
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch(console.error)
  }

  // Email to admin
  if (process.env.ADMIN_EMAIL) {
    await sendEmail('admin_new_order', orderId, data)
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
  await fetch(`${apiBaseUrl()}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, orderId, data }),
  }).catch(console.error)
}
