import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body

  const { data: order } = await supabase
    .from('orders')
    .select('*, customer:customers(*)')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer

  switch (action) {
    case 'save_notes': {
      await supabase.from('orders').update({ admin_notes: body.admin_notes }).eq('id', id)
      return NextResponse.json({ message: 'Notes saved' })
    }

    case 'approve': {
      const shippingCost = parseFloat(body.shipping_cost ?? 0)
      const newSubtotal = order.subtotal
      const vatAmount = (newSubtotal + shippingCost) * order.vat_rate
      const newTotal = newSubtotal + shippingCost + vatAmount

      // Generate Stripe Payment Link
      const paymentLink = await getStripe().paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(newTotal * 100),
              product_data: { name: `Order #${id.slice(0, 8).toUpperCase()} — Atmar Horeca` },
            },
            quantity: 1,
          },
        ],
        metadata: { orderId: id },
        payment_intent_data: { metadata: { orderId: id } },
      })

      await supabase.from('orders').update({
        status: 'awaiting_payment',
        shipping_cost: shippingCost,
        vat_amount: vatAmount,
        total: newTotal,
        stripe_payment_link_url: paymentLink.url,
      }).eq('id', id)

      // Send proforma email
      await sendEmail('proforma_invoice', id, {
        full_name: customer?.full_name,
        email: customer?.email,
        items: order.items,
        subtotal: newSubtotal,
        shipping_cost: shippingCost,
        vat_rate: order.vat_rate,
        vat_amount: vatAmount,
        total: newTotal,
        stripe_payment_link_url: paymentLink.url,
      })

      return NextResponse.json({ message: 'Order approved and proforma sent' })
    }

    case 'resend_proforma': {
      if (!order.stripe_payment_link_url) {
        return NextResponse.json({ error: 'No payment link available' }, { status: 400 })
      }
      await sendEmail('proforma_invoice', id, {
        full_name: customer?.full_name,
        email: customer?.email,
        items: order.items,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        vat_rate: order.vat_rate,
        vat_amount: order.vat_amount,
        total: order.total,
        stripe_payment_link_url: order.stripe_payment_link_url,
      })
      return NextResponse.json({ message: 'Proforma resent' })
    }

    case 'mark_paid_bank': {
      await supabase.from('orders').update({ status: 'paid' }).eq('id', id)
      await sendEmail('payment_confirmed', id, {
        full_name: customer?.full_name,
        email: customer?.email,
        items: order.items,
        total: order.total,
        type: order.type,
      })
      return NextResponse.json({ message: 'Order marked as paid' })
    }

    case 'fulfill': {
      const { tracking_number, tracking_url } = body
      if (!tracking_number) {
        return NextResponse.json({ error: 'Tracking number required' }, { status: 400 })
      }
      await supabase.from('orders').update({
        status: 'fulfilled',
        tracking_number,
        tracking_url: tracking_url || null,
      }).eq('id', id)
      await sendEmail('order_fulfilled', id, {
        full_name: customer?.full_name,
        email: customer?.email,
        items: order.items,
        tracking_number,
        tracking_url: tracking_url || null,
      })
      return NextResponse.json({ message: 'Order marked as fulfilled' })
    }

    case 'cancel': {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
      return NextResponse.json({ message: 'Order cancelled' })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendEmail(template: string, orderId: string, data: Record<string, any>) {
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, orderId, data }),
  }).catch(console.error)
}
