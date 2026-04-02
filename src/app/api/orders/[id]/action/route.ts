import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { generateProformaPDF } from '@/lib/pdf/proforma'
import { calculateShipping } from '@/lib/shipping'
import { addBusinessDays } from '@/lib/utils'

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

  // Supabase returns numeric columns as strings — parse once here
  const orderSubtotal = Number(order.subtotal)
  const orderShippingCost = Number(order.shipping_cost)
  const orderVatRate = Number(order.vat_rate)
  const orderVatAmount = Number(order.vat_amount)
  const orderTotal = Number(order.total)

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

      // Look up transit days + brand handling days for delivery estimate
      const destCountry = customer?.billing_address?.country_code
      const totalWeight = (order.items as { weight_kg: number; qty: number }[])
        .reduce((sum, i) => sum + i.weight_kg * i.qty, 0)
      let estimatedDeliveryDays: number | null = null
      let maxHandlingDays = 1
      if (destCountry) {
        const productIds = (order.items as { product_id: string }[]).map(i => i.product_id)
        const [{ data: shippingRates }, { data: products }] = await Promise.all([
          supabase.from('shipping_rates').select('*'),
          supabase.from('products').select('id, brand:brands(handling_days)').in('id', productIds),
        ])
        maxHandlingDays = Math.max(
          1,
          ...((products ?? []).map((p: { brand?: { handling_days?: number } | { handling_days?: number }[] | null }) => {
            const brand = Array.isArray(p.brand) ? p.brand[0] : p.brand
            return brand?.handling_days ?? 1
          }))
        )
        const shippingResult = calculateShipping(shippingRates ?? [], 'IT', destCountry, totalWeight)
        if (shippingResult) estimatedDeliveryDays = maxHandlingDays + shippingResult.transitDays
      }

      // Compute estimated dates
      let estimated_ship_date: string | null = null
      let estimated_delivery_date: string | null = null
      if (estimatedDeliveryDays != null) {
        const now = new Date()
        estimated_ship_date = addBusinessDays(now, maxHandlingDays).toISOString().slice(0, 10)
        estimated_delivery_date = addBusinessDays(now, estimatedDeliveryDays).toISOString().slice(0, 10)
      }

      // Update order with financials + dates
      await supabase.from('orders').update({
        status: 'awaiting_payment',
        shipping_cost: shippingCost,
        vat_amount: vatAmount,
        total: newTotal,
        stripe_payment_link_url: paymentLink.url,
        estimated_delivery_days: estimatedDeliveryDays,
        estimated_ship_date,
        estimated_delivery_date,
      }).eq('id', id)

      // Generate proforma PDF
      const pdfBuffer = await generateProformaPDF({
        orderId: id,
        buyer_name: customer?.full_name ?? '',
        buyer_company: customer?.company_name ?? null,
        buyer_vat: customer?.vat_number ?? null,
        buyer_address: customer?.billing_address ?? null,
        items: order.items,
        subtotal: newSubtotal,
        shipping_cost: shippingCost,
        vat_rate: order.vat_rate,
        vat_amount: vatAmount,
        total: newTotal,
        stripe_payment_link_url: paymentLink.url,
        estimated_delivery_days: estimatedDeliveryDays,
        iban: process.env.REVOLUT_EUR_IBAN ?? '',
        bic: process.env.REVOLUT_EUR_BIC ?? '',
        account_holder: process.env.REVOLUT_ACCOUNT_HOLDER ?? 'Atmar Horeca EOOD',
      }).catch(() => null)

      // Send proforma email with PDF attachment
      await sendEmail(
        'proforma_invoice',
        id,
        {
          full_name: customer?.full_name,
          email: customer?.email,
          items: order.items,
          subtotal: newSubtotal,
          shipping_cost: shippingCost,
          vat_rate: order.vat_rate,
          vat_amount: vatAmount,
          total: newTotal,
          stripe_payment_link_url: paymentLink.url,
        },
        pdfBuffer
          ? [{ content: pdfBuffer.toString('base64'), name: `Proforma_${id.slice(0, 8).toUpperCase()}.pdf` }]
          : undefined,
      )

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
        subtotal: orderSubtotal,
        shipping_cost: orderShippingCost,
        vat_rate: orderVatRate,
        vat_amount: orderVatAmount,
        total: orderTotal,
        stripe_payment_link_url: order.stripe_payment_link_url,
      })
      return NextResponse.json({ message: 'Proforma resent' })
    }

    case 'mark_paid_bank': {
      await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
      await sendEmail('payment_confirmed', id, {
        full_name: customer?.full_name,
        email: customer?.email,
        items: order.items,
        subtotal: orderSubtotal,
        shipping_cost: orderShippingCost,
        vat_rate: orderVatRate,
        vat_amount: orderVatAmount,
        total: orderTotal,
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
        subtotal: orderSubtotal,
        shipping_cost: orderShippingCost,
        vat_rate: orderVatRate,
        vat_amount: orderVatAmount,
        total: orderTotal,
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

function apiBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return 'http://localhost:3000'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendEmail(template: string, orderId: string, data: Record<string, any>, attachments?: { content: string; name: string }[]) {
  await fetch(`${apiBaseUrl()}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, orderId, data, attachments }),
  }).catch(console.error)
}
