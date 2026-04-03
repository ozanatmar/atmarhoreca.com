import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Public-facing URL — used in the verification link inside the email
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// Internal API URL — used to call our own API routes server-to-server
function apiBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return 'http://localhost:3000'
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: customer } = await supabase
    .from('customers')
    .select('full_name, email, email_verified')
    .eq('id', user.id)
    .single()

  if (customer?.email_verified) {
    return NextResponse.json({ error: 'Already verified' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Delete any existing tokens for this user
  await serviceClient.from('email_verification_tokens').delete().eq('user_id', user.id)

  // Generate token and expiry (24h)
  const token = crypto.randomUUID() + '-' + crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await serviceClient.from('email_verification_tokens').insert({
    token,
    user_id: user.id,
    expires_at: expiresAt,
  })

  const verifyUrl = `${siteUrl()}/verify-email?token=${token}`

  const emailRes = await fetch(`${apiBaseUrl()}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'email_verification',
      orderId: '',
      data: {
        full_name: customer?.full_name ?? 'there',
        email: customer?.email ?? user.email,
        verify_url: verifyUrl,
      },
    }),
  })

  if (!emailRes.ok) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
