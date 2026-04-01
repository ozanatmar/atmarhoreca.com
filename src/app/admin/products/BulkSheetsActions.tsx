'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface Props {
  brands: { id: string; name: string }[]
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1_c8JN3ZwJlGPqNsJ-vC2TwGTAibQBB_JaUGDwdHgjU8/edit#gid=0'

export default function BulkSheetsActions({ brands }: Props) {
  const router = useRouter()
  const [brandId, setBrandId] = useState(brands[0]?.id ?? '')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  async function handleExport() {
    setExporting(true)
    setMsg('')
    const res = await fetch('/api/admin/products/export-to-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    })
    const json = await res.json()
    if (res.ok) {
      setMsg(`Exported ${json.count} products to Google Sheets`)
      setMsgType('success')
    } else {
      setMsg(json.error || 'Export failed')
      setMsgType('error')
    }
    setExporting(false)
  }

  async function handleImport() {
    setImporting(true)
    setMsg('')
    const res = await fetch('/api/admin/products/import-from-sheets', { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      setMsg(json.count === 0 ? 'No rows found in the sheet' : `Updated ${json.count} products`)
      setMsgType(json.count === 0 ? 'error' : 'success')
      router.refresh()
    } else {
      setMsg(json.error || 'Import failed')
      setMsgType('error')
    }
    setImporting(false)
  }

  async function handleAdd() {
    setAdding(true)
    setMsg('')
    const res = await fetch('/api/admin/products/add-from-sheets', { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      setMsg(json.count === 0 ? 'No rows found in the sheet' : `Added ${json.count} products`)
      setMsgType(json.count === 0 ? 'error' : 'success')
      if (json.count > 0) router.refresh()
    } else {
      setMsg(json.error || 'Add failed')
      setMsgType('error')
    }
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col gap-3">
      <p className="text-xs font-semibold text-[#1A1A5E] uppercase tracking-wide">Bulk Edit via Google Sheets</p>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
        >
          {brands.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <Button variant="outline" onClick={handleExport} disabled={exporting || importing || adding}>
          {exporting ? 'Exporting...' : 'Export to Sheets'}
        </Button>
        <Button onClick={handleImport} disabled={importing || exporting || adding}>
          {importing ? 'Importing...' : 'Import Edits from Sheets'}
        </Button>
        <Button onClick={handleAdd} disabled={adding || importing || exporting}>
          {adding ? 'Adding...' : 'Add New Products from Sheet'}
        </Button>
        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#6B3D8F] hover:underline"
        >
          Open Sheet ↗
        </a>
      </div>
      {msg && (
        <p className={`text-sm ${msgType === 'error' ? 'text-red-600' : 'text-[#7AB648]'}`}>{msg}</p>
      )}
    </div>
  )
}
