import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Verify Email',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect('/')

  const supabase = createServiceClient()

  const { data: record } = await supabase
    .from('email_verification_tokens')
    .select('user_id, expires_at')
    .eq('token', token)
    .single()

  if (!record) {
    return <Result success={false} message="This verification link is invalid or has already been used." />
  }

  if (new Date(record.expires_at) < new Date()) {
    await supabase.from('email_verification_tokens').delete().eq('token', token)
    return <Result success={false} message="This verification link has expired. Please request a new one from your account page." />
  }

  // Mark verified and delete token
  await Promise.all([
    supabase.from('customers').update({ email_verified: true }).eq('id', record.user_id),
    supabase.from('email_verification_tokens').delete().eq('token', token),
  ])

  return <Result success message="Your email address has been verified. You're all set!" />
}

function Result({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${success ? 'bg-[#7AB648]' : 'bg-[#C0392B]'}`}>
          {success ? (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h1 className="text-xl font-bold text-[#1A1A5E] mb-2">
          {success ? 'Email Verified' : 'Verification Failed'}
        </h1>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <Link
          href={success ? '/account' : '/account'}
          className="inline-flex items-center justify-center px-6 py-3 bg-[#6B3D8F] text-white rounded-xl font-semibold hover:bg-[#5a3278] transition-colors"
        >
          Go to My Account
        </Link>
      </div>
    </div>
  )
}
