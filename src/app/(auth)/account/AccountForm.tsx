'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Customer } from '@/types'
import { COUNTRY_OPTIONS } from '@/lib/countries'

interface Props {
  customer: Customer | null
  userId: string
}

export default function AccountForm({ customer, userId }: Props) {
  const [fullName, setFullName] = useState(customer?.full_name ?? '')
  const [companyName, setCompanyName] = useState(customer?.company_name ?? '')
  const [vatNumber, setVatNumber] = useState(customer?.vat_number ?? '')
  const [vatStatus, setVatStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function validateVat() {
    if (!vatNumber) return
    const res = await fetch(`/api/vies/validate?vat=${encodeURIComponent(vatNumber)}`)
    const json = await res.json()
    setVatStatus(json.valid ? 'valid' : 'invalid')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('customers').upsert({
      id: userId,
      email: customer?.email ?? '',
      full_name: fullName,
      company_name: companyName || null,
      vat_number: vatNumber || null,
      vat_validated: vatStatus === 'valid',
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-[#1A1A5E]">Personal Details</h2>
      <Input
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        label="Company Name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        hint="Optional — for B2B invoicing"
      />
      <div>
        <Input
          label="VAT Number"
          value={vatNumber}
          onChange={(e) => { setVatNumber(e.target.value); setVatStatus('idle') }}
          onBlur={validateVat}
          hint="EU VAT number for reverse charge (e.g. DE123456789)"
        />
        {vatStatus === 'valid' && (
          <p className="text-xs text-[#7AB648] mt-1">Valid VAT number</p>
        )}
        {vatStatus === 'invalid' && (
          <p className="text-xs text-[#C0392B] mt-1">Could not validate — standard VAT will apply</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && <p className="text-sm text-[#7AB648]">Saved successfully</p>}
      </div>
    </form>
  )
}
