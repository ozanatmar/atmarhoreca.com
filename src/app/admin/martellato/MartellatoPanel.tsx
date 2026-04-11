'use client'
import { useState, useRef } from 'react'

type RowStatus = 'idle' | 'running' | 'done' | 'skipped' | 'error'

interface SheetRow {
  sheetRowNumber: number
  row: string[]
  sku: string
  name: string
  url: string
}

interface RowState {
  contentStatus: RowStatus
  contentMsg: string
  imageStatus: RowStatus
  imageMsg: string
}

export default function MartellatoPanel({
  initialRows,
  sheetError,
}: {
  initialRows: string[][]
  sheetError: string | null
}) {
  const inStockRows: SheetRow[] = initialRows
    .map((row, idx) => ({
      sheetRowNumber: idx + 1,
      row,
      sku: row[1] ?? '',
      name: row[0] ?? '',
      url: row[7] ?? '',
    }))
    .filter(r => r.row[6] === 'in_stock' && (r.url.startsWith('http')))

  const [states, setStates] = useState<Record<number, RowState>>(() => {
    const s: Record<number, RowState> = {}
    for (const r of inStockRows) {
      s[r.sheetRowNumber] = { contentStatus: 'idle', contentMsg: '', imageStatus: 'idle', imageMsg: '' }
    }
    return s
  })

  const [runningContent, setRunningContent] = useState(false)
  const [runningImages, setRunningImages] = useState(false)
  const stopRef = useRef(false)

  function setContentStatus(rowNumber: number, status: RowStatus, msg = '') {
    setStates(prev => ({ ...prev, [rowNumber]: { ...prev[rowNumber], contentStatus: status, contentMsg: msg } }))
  }

  function setImageStatus(rowNumber: number, status: RowStatus, msg = '') {
    setStates(prev => ({ ...prev, [rowNumber]: { ...prev[rowNumber], imageStatus: status, imageMsg: msg } }))
  }

  async function runContentWriter() {
    stopRef.current = false
    setRunningContent(true)
    for (const r of inStockRows) {
      if (stopRef.current) break
      setContentStatus(r.sheetRowNumber, 'running')
      try {
        const res = await fetch('/api/admin/martellato/process-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowNumber: r.sheetRowNumber, row: r.row }),
        })
        const json = await res.json()
        if (json.skipped) setContentStatus(r.sheetRowNumber, 'skipped', json.reason)
        else if (!res.ok || json.error) setContentStatus(r.sheetRowNumber, 'error', json.error)
        else setContentStatus(r.sheetRowNumber, 'done', json.name)
      } catch (e) {
        setContentStatus(r.sheetRowNumber, 'error', (e as Error).message)
      }
    }
    setRunningContent(false)
  }

  async function runImageUploader() {
    stopRef.current = false
    setRunningImages(true)
    for (const r of inStockRows) {
      if (stopRef.current) break
      setImageStatus(r.sheetRowNumber, 'running')
      try {
        const res = await fetch('/api/admin/martellato/process-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowNumber: r.sheetRowNumber, row: r.row }),
        })
        const json = await res.json()
        if (json.skipped) setImageStatus(r.sheetRowNumber, 'skipped', json.reason)
        else if (!res.ok || json.error) setImageStatus(r.sheetRowNumber, 'error', json.error)
        else setImageStatus(r.sheetRowNumber, 'done', `${json.count} image(s) · ${json.type}`)
      } catch (e) {
        setImageStatus(r.sheetRowNumber, 'error', (e as Error).message)
      }
    }
    setRunningImages(false)
  }

  const isRunning = runningContent || runningImages
  const contentDone = Object.values(states).filter(s => s.contentStatus === 'done').length
  const imageDone = Object.values(states).filter(s => s.imageStatus === 'done').length

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A5E]">Martellato Import Enrichment</h1>
          <p className="text-sm text-gray-500 mt-1">
            {inStockRows.length} in_stock rows with URL in TEMP sheet
          </p>
        </div>
        <div className="flex gap-2">
          {isRunning && (
            <button
              onClick={() => { stopRef.current = true }}
              className="text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1.5 transition-colors"
            >
              Stop
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            disabled={isRunning}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-50"
          >
            Refresh sheet
          </button>
        </div>
      </div>

      {sheetError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          Sheet error: {sheetError}
        </div>
      )}

      {/* Run buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#1A1A5E] mb-1">Content Writer</h2>
          <p className="text-xs text-gray-500 mb-3">
            Scrapes Martellato page → OpenAI → writes name, description, meta_title, meta_description to sheet.
            {contentDone > 0 && <span className="text-[#7AB648] ml-1">{contentDone} done</span>}
          </p>
          <button
            onClick={runContentWriter}
            disabled={isRunning || inStockRows.length === 0}
            className="bg-[#6B3D8F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a3278] disabled:opacity-50 transition-colors"
          >
            {runningContent ? 'Running…' : `Run for ${inStockRows.length} rows`}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#1A1A5E] mb-1">Image Uploader</h2>
          <p className="text-xs text-gray-500 mb-3">
            Scrapes product images → uploads to Supabase → writes URLs to column I.
            {imageDone > 0 && <span className="text-[#7AB648] ml-1">{imageDone} done</span>}
          </p>
          <button
            onClick={runImageUploader}
            disabled={isRunning || inStockRows.length === 0}
            className="bg-[#F0A500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d4930a] disabled:opacity-50 transition-colors"
          >
            {runningImages ? 'Running…' : `Run for ${inStockRows.length} rows`}
          </button>
        </div>
      </div>

      {/* Progress table */}
      {inStockRows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold text-xs w-12">Row</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">SKU</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Content</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Images</th>
              </tr>
            </thead>
            <tbody>
              {inStockRows.map((r, i) => {
                const s = states[r.sheetRowNumber]
                return (
                  <tr key={r.sheetRowNumber} className={i % 2 === 1 ? 'bg-[#F5F5F5]' : ''}>
                    <td className="px-4 py-2 text-gray-400 text-xs">{r.sheetRowNumber}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{r.sku || '—'}</td>
                    <td className="px-4 py-2 text-gray-700 max-w-xs truncate">{r.name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2 max-w-xs">
                      <StatusCell status={s.contentStatus} message={s.contentMsg} />
                    </td>
                    <td className="px-4 py-2 max-w-xs">
                      <StatusCell status={s.imageStatus} message={s.imageMsg} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {inStockRows.length === 0 && !sheetError && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
          No in_stock rows with a URL found in the TEMP sheet.
        </div>
      )}
    </div>
  )
}

function StatusCell({ status, message }: { status: RowStatus; message: string }) {
  if (status === 'idle') return <span className="text-gray-300 text-xs">—</span>
  if (status === 'running') return <span className="text-yellow-500 text-xs animate-pulse">running…</span>
  if (status === 'done') return <span className="text-[#7AB648] text-xs truncate block" title={message}>✓ {message}</span>
  if (status === 'skipped') return <span className="text-orange-400 text-xs" title={message}>skipped</span>
  return <span className="text-red-500 text-xs truncate block" title={message}>✗ {message}</span>
}
