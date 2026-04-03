'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Create account via server route (bypasses Supabase email validation)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    // Sign in the newly created user
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Send verification email
    const verifyRes = await fetch('/api/auth/send-verification', { method: 'POST' })
    if (!verifyRes.ok) {
      setError('Account created but failed to send verification email. You can resend it from your account page.')
      setLoading(false)
      return
    }

    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-[#6B3D8F] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A5E] mb-2">Check your inbox</h1>
          <p className="text-sm text-gray-600 mb-1">
            We sent a verification link to <strong>{email}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-6">Click the link in the email to verify your account. The link expires in 24 hours.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#6B3D8F] text-white rounded-xl font-semibold hover:bg-[#5a3278] transition-colors"
          >
            Continue to site
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            hint="At least 8 characters"
            autoComplete="new-password"
          />

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 shrink-0"
              required
            />
            <span className="text-sm text-gray-600">
              I have read and agree to the{' '}
              <Link href="/privacy-policy" target="_blank" className="text-[#6B3D8F] hover:underline font-medium">Privacy Policy</Link>
              {' '}and{' '}
              <Link href="/terms" target="_blank" className="text-[#6B3D8F] hover:underline font-medium">Terms &amp; Conditions</Link>.
            </span>
          </label>

          {error && <p className="text-sm text-[#C0392B]">{error}</p>}

          <Button type="submit" size="lg" disabled={loading || !agreed} className="mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-[#6B3D8F] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
