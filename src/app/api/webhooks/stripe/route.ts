import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

function apiBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return 'http://localhost:3000'
}

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.orderId
    if (!orderId) return NextResponse.json({ received: true })

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customer:customers(full_name, email)')
      .eq('id', orderId)
      .single()

    console.log('[webhook] orderId:', orderId, '| order found:', !!order, '| error:', orderError?.message)

    if (order && order.status !== 'paid') {
      await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', orderId)

      const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
      console.log('[webhook] sending email to:', customer?.email, '| telegram token set:', !!process.env.TELEGRAM_BOT_TOKEN)

      // Send payment confirmed email to customer
      await fetch(`${apiBaseUrl()}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'payment_confirmed',
          orderId,
          data: {
            full_name: customer?.full_name,
            email: customer?.email,
            items: order.items,
            subtotal: order.subtotal,
            shipping_cost: order.shipping_cost,
            vat_rate: order.vat_rate,
            vat_amount: order.vat_amount,
            total: order.total,
            type: order.type,
            estimated_days: order.estimated_delivery_days ?? undefined,
            order_link: `${siteUrl()}/order/${orderId}`,
          },
        }),
      }).catch(console.error)

      // Admin email notification
      if (process.env.ADMIN_EMAIL) {
        await fetch(`${apiBaseUrl()}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: 'admin_payment_received',
            orderId,
            data: {
              full_name: customer?.full_name,
              email: customer?.email,
              items: order.items,
              subtotal: order.subtotal,
              shipping_cost: order.shipping_cost,
              vat_rate: order.vat_rate,
              vat_amount: order.vat_amount,
              total: order.total,
              admin_link: `${siteUrl()}/admin/orders/${orderId}`,
            },
          }),
        }).catch(console.error)
      }

      // Telegram notification to admin
      const token = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (token && chatId) {
        const base = siteUrl()
        const text = `💳 Payment received — Order #${orderId.slice(0, 8).toUpperCase()}\nCustomer: ${customer?.full_name} (${customer?.email})\nTotal: €${Number(order.total).toFixed(2)}\nView: ${base}/admin/orders/${orderId}`
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        }).catch(console.error)
      }
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (!orderId) return NextResponse.json({ received: true })

    const { data: order } = await supabase
      .from('orders')
      .select('*, customer:customers(full_name, email)')
      .eq('id', orderId)
      .single()

    if (order && order.status !== 'paid') {
      await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', orderId)

      const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer

      await fetch(`${apiBaseUrl()}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'payment_confirmed',
          orderId,
          data: {
            full_name: customer?.full_name,
            email: customer?.email,
            items: order.items,
            subtotal: order.subtotal,
            shipping_cost: order.shipping_cost,
            vat_rate: order.vat_rate,
            vat_amount: order.vat_amount,
            total: order.total,
            type: order.type,
            estimated_days: order.estimated_delivery_days ?? undefined,
            order_link: `${siteUrl()}/order/${orderId}`,
          },
        }),
      }).catch(console.error)

      // Admin email notification
      if (process.env.ADMIN_EMAIL) {
        await fetch(`${apiBaseUrl()}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: 'admin_payment_received',
            orderId,
            data: {
              full_name: customer?.full_name,
              email: customer?.email,
              items: order.items,
              subtotal: order.subtotal,
              shipping_cost: order.shipping_cost,
              vat_rate: order.vat_rate,
              vat_amount: order.vat_amount,
              total: order.total,
              admin_link: `${siteUrl()}/admin/orders/${orderId}`,
            },
          }),
        }).catch(console.error)
      }

      const token = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (token && chatId) {
        const base = siteUrl()
        const text = `💳 Payment received — Order #${orderId.slice(0, 8).toUpperCase()}\nCustomer: ${customer?.full_name} (${customer?.email})\nTotal: €${Number(order.total).toFixed(2)}\nView: ${base}/admin/orders/${orderId}`
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        }).catch(console.error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
