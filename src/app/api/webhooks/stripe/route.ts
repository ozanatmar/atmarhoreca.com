import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

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

    const { data: order } = await supabase
      .from('orders')
      .select('*, customer:customers(full_name, email)')
      .eq('id', orderId)
      .single()

    if (order && order.status !== 'paid') {
      await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)

      const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer
      // Send payment confirmed email
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'payment_confirmed',
          orderId,
          data: {
            full_name: customer?.full_name,
            email: customer?.email,
            items: order.items,
            total: order.total,
            type: order.type,
          },
        }),
      }).catch(console.error)
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (!orderId) return NextResponse.json({ received: true })

    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)
  }

  return NextResponse.json({ received: true })
}
