'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { ScrapeLog } from '@/types'

type Frequency = 'daily' | 'weekly' | 'monthly'

interface Props {
  logs: (ScrapeLog & { brand?: { name: string } })[]
  frequency: Frequency
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export default function ScrapingPanel({ logs, frequency: initialFrequency }: Props) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState('')
  const [frequency, setFrequency] = useState<Frequency>(initialFrequency)
  const [savingFreq, setSavingFreq] = useState(false)
  const [freqSaved, setFreqSaved] = useState(false)

  const latest = logs[0]

  async function handleRetry() {
    setRunning(true)
    setResult('')
    const res = await fetch('/api/admin/scrape-now', { method: 'POST' })
    const json = await res.json()
    setResult(res.ok ? `Done — ${json.products_updated} products updated` : `Failed: ${json.error}`)
    setRunning(false)
    router.refresh()
  }

  async function handleSaveFrequency() {
    setSavingFreq(true)
    setFreqSaved(false)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'scrape_frequency', value: frequency }),
    })
    setSavingFreq(false)
    setFreqSaved(true)
    setTimeout(() => setFreqSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Frequency */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-[#1A1A5E] mb-1">Scrape Frequency</h2>
        <p className="text-sm text-gray-500 mb-4">
          The cron runs daily — this setting controls how often it actually scrapes.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={frequency}
            onChange={e => { setFrequency(e.target.value as Frequency); setFreqSaved(false) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]/30 bg-white"
          >
            {FREQUENCY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button size="sm" onClick={handleSaveFrequency} disabled={savingFreq}>
            {savingFreq ? 'Saving…' : 'Save'}
          </Button>
          {freqSaved && <span className="text-sm text-[#7AB648]">Saved</span>}
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-[#1A1A5E] mb-3">Last Scrape Run</h2>
        {latest ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Badge variant={latest.status === 'success' ? 'green' : 'red'}>
                {latest.status === 'success' ? 'Success' : 'Failed'}
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date(latest.ran_at).toLocaleString()}
              </span>
            </div>
            {latest.status === 'success' && (
              <p className="text-sm text-gray-600">{latest.products_updated} products updated</p>
            )}
            {latest.status === 'failed' && latest.error_log && (
              <details className="mt-2">
                <summary className="text-sm text-[#C0392B] cursor-pointer">View error log</summary>
                <pre className="mt-2 text-xs bg-[#F5F5F5] p-3 rounded-lg overflow-auto max-h-40 text-gray-700">
                  {latest.error_log}
                </pre>
              </details>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No scrape runs recorded yet.</p>
        )}
      </div>

      {/* Run now */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-[#1A1A5E] mb-2">Run Scrape Now</h2>
        <p className="text-sm text-gray-600 mb-4">
          Triggers the scrape immediately, ignoring the frequency setting.
        </p>
        <Button onClick={handleRetry} disabled={running}>
          {running ? 'Running...' : 'Run Now'}
        </Button>
        {result && <p className="text-sm text-[#7AB648] mt-3">{result}</p>}
      </div>

      {/* Log history */}
      {logs.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-[#F5F5F5] font-semibold text-[#1A1A5E] text-sm">History</div>
          <table className="w-full text-sm">
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-500">{new Date(log.ran_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <Badge variant={log.status === 'success' ? 'green' : 'red'}>{log.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{log.products_updated} updated</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
