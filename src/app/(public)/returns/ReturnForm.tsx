'use client'

import { useState, useRef } from 'react'

const RETURN_TYPES = [
  { value: 'withdrawal', label: 'Right of withdrawal (unused item, within 14 days of delivery)' },
  { value: 'damaged', label: 'Item arrived damaged or defective' },
  { value: 'other', label: 'Other' },
]

const HINTS: Record<string, string> = {
  withdrawal:
    'Confirm the item is completely unused, in its original sealed packaging, and all accessories are included. Returns of used items will not be accepted.',
  damaged:
    "You must report damage by the next business day after delivery. Please attach photos of the damaged packaging and item, and mention whether you noted the damage on the carrier's delivery document.",
  other: 'Describe your situation and we will get back to you.',
}

interface PendingFile { file: File; name: string }

export default function ReturnForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => {
      const combined = [...prev, ...selected.map((f) => ({ file: f, name: f.name }))]
      return combined.slice(0, 5)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) { setError('Please select a return type.'); return }
    setSubmitting(true)
    setError('')

    const subject = `Return request — ${RETURN_TYPES.find((t) => t.value === type)?.label ?? type}`
    const body = `Order number: ${orderNumber}\nType: ${RETURN_TYPES.find((t) => t.value === type)?.label ?? type}\n\n${description}`

    const form = new FormData()
    form.append('inbox', 'returns')
    form.append('name', name)
    form.append('email', email)
    form.append('subject', subject)
    form.append('body', body)
    for (const f of files) form.append('files', f.file)

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
          We will review your request and respond to <strong>{email}</strong> within 2 business days.
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
            placeholder="As on your order"
            className={inputCls}
          />
        </Field>
        <Field label="Email address" required>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="The email used when ordering"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Order number" required hint="Found in your order confirmation email (e.g. ORD-3A2F1B)">
        <input
          type="text"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="ORD-XXXXXX"
          className={inputCls}
        />
      </Field>

      <Field label="Reason for return" required>
        <select
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputCls}
        >
          <option value="">Select a reason…</option>
          {RETURN_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Field>

      {type && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          {HINTS[type]}
        </div>
      )}

      <Field
        label="Description"
        required
        hint={
          type === 'damaged'
            ? 'Describe the damage in detail. Include whether the outer packaging was visibly damaged on delivery.'
            : 'Describe the item(s) you wish to return and any relevant details.'
        }
      >
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe your situation in detail…"
          className={inputCls}
        />
      </Field>

      <Field
        label="Attachments (optional)"
        hint="Required for damaged/defective claims. Photos of the item and packaging. Max 4 MB per file, up to 5 files."
      >
        <div className="space-y-2">
          {files.length > 0 && (
            <ul className="text-sm space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="truncate max-w-xs">{f.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">({(f.file.size / 1024).toFixed(0)} KB)</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {files.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-[#6B3D8F] hover:underline"
            >
              + Add file
            </button>
          )}
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFiles} />
        </div>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-[#6B3D8F] hover:bg-[#5a3278] text-white font-semibold text-sm px-6 py-3 rounded-xl disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit return request'}
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
