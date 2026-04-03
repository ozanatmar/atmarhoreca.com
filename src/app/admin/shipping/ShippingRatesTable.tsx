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
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1_c8JN3ZwJlGPqNsJ-vC2TwGTAibQBB_JaUGDwdHgjU8/edit?gid=0#gid=0'
  const sheetName = 'Atmar Horeca Shipping Rates'

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
      setMsg(`Synced ${json.count} routes successfully`)
      setMsgType('success')
      router.refresh()
    } else {
      setMsg(json.error || 'Sync failed')
      setMsgType('error')
    }
    setSyncing(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing...' : 'Sync from Google Sheets'}
        </Button>
        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#6B3D8F] hover:underline"
        >
          Open Sheet ↗
        </a>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Sheet columns: <span className="font-mono">A: origin</span>, <span className="font-mono">B: destination</span>, <span className="font-mono">C: transit_days</span>. Shipping is free for all listed routes.
      </p>
      {msg && <p className={`text-sm mb-4 ${msgType === 'error' ? 'text-red-600' : 'text-[#7AB648]'}`}>{msg}</p>}

      {rates.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Origin</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Destination</th>
                <th className="text-right px-4 py-3 text-[#1A1A5E] font-semibold">Transit Days</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}>
                  <td className="px-4 py-2 font-mono">{r.origin_country_code}</td>
                  <td className="px-4 py-2 font-mono">{r.destination_country_code}</td>
                  <td className="px-4 py-2 text-right">{r.transit_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No routes configured yet. Sync from Google Sheets to get started.</p>
      )}
    </div>
  )
}
