'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { Customer } from '@/types'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { shortId, formatPrice } from '@/lib/utils'

type Tab = 'profile' | 'addresses' | 'orders'

interface OrderRow {
  id: string
  type: string
  status: string
  total: string | number
  currency: string
  created_at: string
}

interface Props {
  customer: Customer | null
  userId: string
  orders: OrderRow[]
  emailVerified: boolean
}

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
  processing: 'Processing',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

const STATUS_VARIANT: Record<string, 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
  pending_approval: 'orange',
  awaiting_payment: 'orange',
  paid: 'purple',
  processing: 'purple',
  fulfilled: 'green',
  cancelled: 'red',
}

export default function AccountForm({ customer, userId, orders, emailVerified }: Props) {
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function handleResend() {
    setResendState('sending')
    await fetch('/api/auth/send-verification', { method: 'POST' })
    setResendState('sent')
  }

  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab')
    return (t === 'orders' || t === 'addresses') ? t : 'profile'
  })

  // Profile state
  const [fullName, setFullName] = useState(customer?.full_name ?? '')
  const [companyName, setCompanyName] = useState(customer?.company_name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [vatNumber, setVatNumber] = useState(customer?.vat_number ?? '')
  const [vatStatus, setVatStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Billing address state
  const [billStreet, setBillStreet] = useState(customer?.billing_address?.street ?? '')
  const [billCity, setBillCity] = useState(customer?.billing_address?.city ?? '')
  const [billPostal, setBillPostal] = useState(customer?.billing_address?.postal_code ?? '')
  const [billCountry, setBillCountry] = useState(customer?.billing_address?.country_code ?? '')

  // Shipping address state
  const [shipStreet, setShipStreet] = useState(customer?.shipping_address?.street ?? '')
  const [shipCity, setShipCity] = useState(customer?.shipping_address?.city ?? '')
  const [shipPostal, setShipPostal] = useState(customer?.shipping_address?.postal_code ?? '')
  const [shipCountry, setShipCountry] = useState(customer?.shipping_address?.country_code ?? '')
  const [sameAsBilling, setSameAsBilling] = useState(!customer?.shipping_address)

  const [addressSaving, setAddressSaving] = useState(false)
  const [addressSaved, setAddressSaved] = useState(false)

  async function validateVat() {
    if (!vatNumber) return
    const res = await fetch(`/api/vies/validate?vat=${encodeURIComponent(vatNumber)}`)
    const json = await res.json()
    setVatStatus(json.valid ? 'valid' : 'invalid')
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    const supabase = createClient()
    await supabase.from('customers').upsert({
      id: userId,
      email: customer?.email ?? '',
      full_name: fullName,
      company_name: companyName || null,
      phone: phone || null,
      vat_number: vatNumber || null,
      vat_validated: vatStatus === 'valid',
    })
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  async function handleAddressSave(e: React.FormEvent) {
    e.preventDefault()
    setAddressSaving(true)
    const supabase = createClient()

    const billing = billStreet ? {
      street: billStreet,
      city: billCity,
      postal_code: billPostal,
      country_code: billCountry,
    } : null

    const shipping = (!sameAsBilling && shipStreet) ? {
      street: shipStreet,
      city: shipCity,
      postal_code: shipPostal,
      country_code: shipCountry,
    } : null

    await supabase.from('customers').upsert({
      id: userId,
      email: customer?.email ?? '',
      full_name: customer?.full_name ?? '',
      billing_address: billing,
      shipping_address: shipping,
    })
    setAddressSaving(false)
    setAddressSaved(true)
    setTimeout(() => setAddressSaved(false), 3000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'addresses', label: 'Addresses' },
    { key: 'orders', label: `Orders${orders.length ? ` (${orders.length})` : ''}` },
  ]

  return (
    <div>
      {/* Unverified email banner */}
      {!emailVerified && (
        <div className="flex items-center justify-between gap-4 bg-[#FFF8E7] border border-[#F0A500] rounded-xl px-4 py-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-[#7A5000]">
            <svg className="w-4 h-4 shrink-0 text-[#F0A500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
            <span>Your email address is not verified.</span>
          </div>
          {resendState === 'sent' ? (
            <span className="text-sm text-[#7AB648] font-medium">Verification email sent!</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendState === 'sending'}
              className="text-sm font-semibold text-[#6B3D8F] hover:underline disabled:opacity-50"
            >
              {resendState === 'sending' ? 'Sending...' : 'Resend verification email'}
            </button>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-[#6B3D8F] text-[#6B3D8F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <form onSubmit={handleProfileSave} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#1A1A5E]">Personal Details</h2>
          <p className="text-sm text-gray-500 -mt-2">{customer?.email}</p>
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
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="Optional"
          />
          <div>
            <Input
              label="VAT Number"
              value={vatNumber}
              onChange={(e) => { setVatNumber(e.target.value); setVatStatus('idle') }}
              onBlur={validateVat}
              hint="EU VAT number (e.g. DE123456789)"
            />
            {vatStatus === 'valid' && <p className="text-xs text-[#7AB648] mt-1">Valid VAT number</p>}
            {vatStatus === 'invalid' && <p className="text-xs text-[#C0392B] mt-1">Could not validate — standard VAT will apply</p>}
          </div>
          <div className="flex items-center justify-between mt-2">
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            {profileSaved && <p className="text-sm text-[#7AB648]">Saved successfully</p>}
          </div>
        </form>
      )}

      {/* Addresses tab */}
      {tab === 'addresses' && (
        <form onSubmit={handleAddressSave} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
          {/* Billing */}
          <div>
            <h2 className="text-lg font-bold text-[#1A1A5E] mb-4">Billing Address</h2>
            <div className="flex flex-col gap-3">
              <Input label="Street" value={billStreet} onChange={e => setBillStreet(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" value={billCity} onChange={e => setBillCity(e.target.value)} />
                <Input label="Postal Code" value={billPostal} onChange={e => setBillPostal(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={billCountry}
                  onChange={e => setBillCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
                >
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1A1A5E]">Shipping Address</h2>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={e => setSameAsBilling(e.target.checked)}
                  className="rounded"
                />
                Same as billing
              </label>
            </div>
            {!sameAsBilling && (
              <div className="flex flex-col gap-3">
                <Input label="Street" value={shipStreet} onChange={e => setShipStreet(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" value={shipCity} onChange={e => setShipCity(e.target.value)} />
                  <Input label="Postal Code" value={shipPostal} onChange={e => setShipPostal(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={shipCountry}
                    onChange={e => setShipCountry(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={addressSaving}>
              {addressSaving ? 'Saving...' : 'Save Addresses'}
            </Button>
            {addressSaved && <p className="text-sm text-[#7AB648]">Saved successfully</p>}
          </div>
        </form>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {!orders.length ? (
            <div className="p-8 text-center text-gray-500 text-sm">You have no orders yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Order</th>
                  <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}>
                    <td className="px-4 py-3">
                      <Link href={`/order/${order.id}`} className="text-[#6B3D8F] hover:underline font-mono font-semibold">
                        #{shortId(order.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[order.status] ?? 'gray'}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#1A1A5E]">
                      {formatPrice(Number(order.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
