import { NextRequest, NextResponse } from 'next/server'
import {
  orderReceivedEmail,
  proformaInvoiceEmail,
  paymentConfirmedEmail,
  orderFulfilledEmail,
  adminNewOrderEmail,
  adminPaymentReceivedEmail,
} from '@/lib/email/templates'

const FROM_EMAIL = 'orders@atmarhoreca.com'
const FROM_NAME = 'Atmar Horeca'

interface Attachment {
  content: string // base64
  name: string
}

async function sendEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  const body: Record<string, unknown> = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  }
  if (attachments?.length) body.attachment = attachments

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Brevo error ${res.status}: ${text}`)
  }
}

export async function POST(request: NextRequest) {
  const { template, orderId, data, attachments } = await request.json()

  let email: { subject: string; html: string } | null = null
  let to: string = data.email ?? process.env.ADMIN_EMAIL!

  switch (template) {
    case 'order_received':
      email = orderReceivedEmail(orderId, data)
      to = data.email
      break
    case 'proforma_invoice':
      email = proformaInvoiceEmail(orderId, data)
      to = data.email
      break
    case 'payment_confirmed':
      email = paymentConfirmedEmail(orderId, data)
      to = data.email
      break
    case 'order_fulfilled':
      email = orderFulfilledEmail(orderId, data)
      to = data.email
      break
    case 'admin_new_order':
      email = adminNewOrderEmail(orderId, data)
      to = process.env.ADMIN_EMAIL!
      break
    case 'admin_payment_received':
      email = adminPaymentReceivedEmail(orderId, data)
      to = process.env.ADMIN_EMAIL!
      break
    default:
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
  }

  if (!to) return NextResponse.json({ error: 'No recipient' }, { status: 400 })

  try {
    await sendEmail(to, email.subject, email.html, attachments)
    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('Email send error:', err)
    return NextResponse.json({ error: 'Email failed' }, { status: 500 })
  }
}
