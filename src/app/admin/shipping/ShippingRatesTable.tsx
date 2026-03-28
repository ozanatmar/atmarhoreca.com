'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import type { ShippingRate } from '@/types'

interface Props {
  rates: ShippingRate[]
}

export default function ShippingRatesTable({ rates }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg('')

    const text = await file.text()
    const lines = text.trim().split('\n').slice(1) // skip header
    const rows = lines.map((line) => {
      const [origin, destination, weight, rate, transit] = line.split(',').map((s) => s.trim())
      return {
        origin_country_code: origin,
        destination_country_code: destination,
        weight_kg: parseInt(weight),
        rate_eur: parseFloat(rate),
        transit_days: parseInt(transit),
      }
    }).filter((r) => r.origin_country_code && r.destination_country_code && !isNaN(r.weight_kg))

    const res = await fetch('/api/admin/shipping/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    const json = await res.json()
    setMsg(res.ok ? `Imported ${json.count} rows` : json.error)
    setUploading(false)
    router.refresh()
  }

  // Group by origin+destination
  const grouped: Record<string, ShippingRate[]> = {}
  for (const rate of rates) {
    const key = `${rate.origin_country_code} → ${rate.destination_country_code}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(rate)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Importing...' : 'Import CSV'}
        </Button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
        <p className="text-xs text-gray-500">CSV format: origin_country_code, destination_country_code, weight_kg, rate_eur, transit_days</p>
      </div>
      {msg && <p className="text-sm text-[#7AB648] mb-4">{msg}</p>}

      {Object.entries(grouped).map(([route, routeRates]) => (
        <div key={route} className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="bg-[#F5F5F5] px-4 py-2 font-semibold text-[#1A1A5E] text-sm">{route}</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Weight (kg)</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Rate (EUR)</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Transit Days</th>
              </tr>
            </thead>
            <tbody>
              {routeRates.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2">{r.weight_kg} kg</td>
                  <td className="px-4 py-2 text-right">€{r.rate_eur}</td>
                  <td className="px-4 py-2 text-right">{r.transit_days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {rates.length === 0 && (
        <p className="text-gray-500 text-sm">No shipping rates configured yet. Import a CSV to get started.</p>
      )}
    </div>
  )
}
