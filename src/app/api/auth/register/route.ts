import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, password, full_name } = await request.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Use admin API to bypass Supabase's email validation
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true, // Supabase-level confirmation — we handle our own via Brevo
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Create customer record
  await supabase.from('customers').insert({
    id: data.user.id,
    email,
    full_name,
    email_verified: false,
  })

  return NextResponse.json({ userId: data.user.id })
}
