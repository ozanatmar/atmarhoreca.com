'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import type { ShippingRate } from '@/types'

interface Props {
  rates: ShippingRate[]
}

export default function ShippingRatesTable({ rates }: Props) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1_c8JN3ZwJlGPqNsJ-vC2TwGTAibQBB_JaUGDwdHgjU8/edit?gid=0#gid=0')
  const [sheetName, setSheetName] = useState('Atmar Horeca Shipping Rates')

  async function handleSync() {
    setSyncing(true)
    setMsg('')
    const res = await fetch('/api/admin/shipping/sync-gsheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sheetUrl, sheetName }),
    })
    const json = await res.json()
    if (res.ok) {
      setMsg(`Synced ${json.count} rows successfully`)
      setMsgType('success')
      router.refresh()
    } else {
      setMsg(json.error || 'Sync failed')
      setMsgType('error')
    }
    setSyncing(false)
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
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-[#1A1A5E] mb-3">Sync from Google Sheets</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Google Sheets URL</label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sheet Name</label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
              placeholder="Sheet1"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSync} disabled={syncing || !sheetUrl || !sheetName}>
              {syncing ? 'Syncing...' : 'Sync from Google Sheets'}
            </Button>
            <p className="text-xs text-gray-500">Sheet must be shared as "Anyone with the link can view"</p>
          </div>
        </div>
      </div>
      {msg && <p className={`text-sm mb-4 ${msgType === 'error' ? 'text-red-600' : 'text-[#7AB648]'}`}>{msg}</p>}

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
        <p className="text-gray-500 text-sm">No shipping rates configured yet. Sync from Google Sheets to get started.</p>
      )}
    </div>
  )
}
