'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { ScrapeLog } from '@/types'

interface Props {
  logs: (ScrapeLog & { brand?: { name: string } })[]
}

export default function ScrapingPanel({ logs }: Props) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState('')

  const latest = logs[0]

  async function handleRetry() {
    setRunning(true)
    setResult('')
    const res = await fetch('/api/cron/scrape-martellato', {
      headers: { 'x-cron-secret': '' }, // Will be handled via admin auth
    })
    const json = await res.json()
    setResult(res.ok ? `Done — ${json.products_updated} products updated` : `Failed: ${json.error}`)
    setRunning(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
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

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-[#1A1A5E] mb-2">Run Scrape Now</h2>
        <p className="text-sm text-gray-600 mb-4">
          Automated scraping runs every Monday at 06:00 UTC. Click below to run immediately.
        </p>
        <Button onClick={handleRetry} disabled={running}>
          {running ? 'Running...' : 'Retry Now'}
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
