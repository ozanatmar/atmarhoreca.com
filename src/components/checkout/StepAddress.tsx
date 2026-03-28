'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import type { StepProps } from './types'
import type { CheckoutAddress } from '@/types'

export default function StepAddress({
  address,
  setAddress,
  sameShipping,
  setSameShipping,
  shippingAddress,
  setShippingAddress,
  setStep,
}: StepProps) {
  const [vatStatus, setVatStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [validating, setValidating] = useState(false)

  async function validateVat() {
    const vat = address.vat_number?.trim()
    if (!vat) return
    setValidating(true)
    try {
      const res = await fetch(`/api/vies/validate?vat=${encodeURIComponent(vat)}`)
      const json = await res.json()
      setVatStatus(json.valid ? 'valid' : 'invalid')
      setAddress({ ...address, vat_validated: json.valid })
    } catch {
      setVatStatus('invalid')
      setAddress({ ...address, vat_validated: false })
    } finally {
      setValidating(false)
    }
  }

  function update(field: keyof CheckoutAddress, value: string) {
    setAddress({ ...address, [field]: value })
  }

  function updateShipping(field: keyof CheckoutAddress, value: string) {
    setShippingAddress({ ...shippingAddress, [field]: value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sameShipping) setShippingAddress(address)
    setStep(3)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-[#1A1A5E] mb-4">Step 2 — Address &amp; Details</h2>

      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 mb-6">
        <h3 className="font-semibold text-[#1A1A5E]">Billing Address</h3>

        <Input label="Full Name" value={address.full_name} onChange={(e) => update('full_name', e.target.value)} required />
        <Input label="Company Name" value={address.company_name ?? ''} onChange={(e) => update('company_name', e.target.value)} />
        <Input label="Street Address" value={address.street} onChange={(e) => update('street', e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" value={address.city} onChange={(e) => update('city', e.target.value)} required />
          <Input label="Postal Code" value={address.postal_code} onChange={(e) => update('postal_code', e.target.value)} required />
        </div>
        <Select
          label="Country"
          value={address.country_code}
          onChange={(e) => update('country_code', e.target.value)}
          options={COUNTRY_OPTIONS}
          required
        />

        {/* VAT number */}
        <div>
          <Input
            label="VAT Number"
            value={address.vat_number ?? ''}
            onChange={(e) => { update('vat_number', e.target.value); setVatStatus('idle') }}
            onBlur={validateVat}
            hint="EU VAT number for reverse charge — optional"
          />
          {validating && <p className="text-xs text-gray-500 mt-1">Validating...</p>}
          {vatStatus === 'valid' && <p className="text-xs text-[#7AB648] mt-1">Valid VAT number — reverse charge applies</p>}
          {vatStatus === 'invalid' && <p className="text-xs text-[#C0392B] mt-1">Could not validate — standard VAT will apply</p>}
        </div>

        {/* Same shipping */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sameShipping}
            onChange={(e) => setSameShipping(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Shipping address same as billing</span>
        </label>

        {!sameShipping && (
          <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-[#1A1A5E]">Shipping Address</h3>
            <Input label="Full Name" value={shippingAddress.full_name} onChange={(e) => updateShipping('full_name', e.target.value)} required />
            <Input label="Street Address" value={shippingAddress.street} onChange={(e) => updateShipping('street', e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" value={shippingAddress.city} onChange={(e) => updateShipping('city', e.target.value)} required />
              <Input label="Postal Code" value={shippingAddress.postal_code} onChange={(e) => updateShipping('postal_code', e.target.value)} required />
            </div>
            <Select
              label="Country"
              value={shippingAddress.country_code}
              onChange={(e) => updateShipping('country_code', e.target.value)}
              options={COUNTRY_OPTIONS}
              required
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Continue
        </Button>
      </div>
    </form>
  )
}
