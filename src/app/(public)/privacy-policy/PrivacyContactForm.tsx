'use client'

import { useState } from 'react'

const REQUEST_TYPES = [
  { value: 'access', label: 'Data access — request a copy of your personal data we hold' },
  { value: 'deletion', label: 'Data deletion — request erasure of your personal data' },
  { value: 'correction', label: 'Data correction — correct inaccurate or incomplete data' },
  { value: 'complaint', label: 'Privacy complaint — report a concern about how we handle your data' },
  { value: 'other', label: 'Other privacy question' },
]

export default function PrivacyContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) { setError('Please select a request type.'); return }
    setSubmitting(true)
    setError('')

    const selectedLabel = REQUEST_TYPES.find((t) => t.value === type)?.label ?? type
    const subject = `Privacy request — ${selectedLabel}`
    const body = `Request type: ${selectedLabel}\n\n${message}`

    const form = new FormData()
    form.append('inbox', 'privacy')
    form.append('name', name)
    form.append('email', email)
    form.append('subject', subject)
    form.append('body', body)

    try {
      const res = await fetch('/api/contact', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); return }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="font-semibold text-green-800 mb-1">Request received</p>
        <p className="text-sm text-green-700">
          We will respond to <strong>{email}</strong> within <strong>30 days</strong>, as required by GDPR.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your legal name"
            className={inputCls}
          />
        </Field>
        <Field label="Email address" required hint="We will respond to this address">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Type of request" required>
        <select
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputCls}
        >
          <option value="">Select a request type…</option>
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Field>

      <Field
        label="Details"
        required
        hint="Be as specific as possible. For data access or deletion requests, describe what data you are referring to (e.g. account email, order history)."
      >
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Describe your request in detail…"
          className={inputCls}
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-[#6B3D8F] hover:bg-[#5a3278] text-white font-semibold text-sm px-6 py-3 rounded-xl disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  )
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F] bg-white'

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
