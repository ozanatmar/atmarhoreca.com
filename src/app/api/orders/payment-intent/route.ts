import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, amount } = await request.json()

  // Verify order belongs to user
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('customer_id', user.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const paymentIntent = await getStripe().paymentIntents.create({
    amount,
    currency: 'eur',
    metadata: { orderId },
    automatic_payment_methods: { enabled: true },
  })

  // Save payment intent ID
  await supabase.from('orders').update({
    stripe_payment_intent_id: paymentIntent.id,
  }).eq('id', orderId)

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
