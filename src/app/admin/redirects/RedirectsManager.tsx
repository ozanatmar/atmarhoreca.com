'use client'
import { useState, useRef, useEffect } from 'react'
import { importFromSitemap, searchProducts, saveRedirect } from './actions'

interface Redirect {
  id: string
  from_path: string
  to_path: string | null
}

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
}

export default function RedirectsManager({ initialRedirects }: { initialRedirects: Redirect[] }) {
  const [redirects, setRedirects] = useState(initialRedirects)
  const [filter, setFilter] = useState('')
  const [unmappedOnly, setUnmappedOnly] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const mapped = redirects.filter(r => r.to_path).length
  const total = redirects.length
  const pct = total > 0 ? Math.round((mapped / total) * 100) : 0

  async function handleImport() {
    setImporting(true)
    setImportMsg(null)
    const { count, error } = await importFromSitemap()
    if (error) {
      setImportMsg(`Error: ${error}`)
    } else {
      setImportMsg(`Imported ${count} URLs. Reloading…`)
      setTimeout(() => window.location.reload(), 800)
    }
    setImporting(false)
  }

  const filtered = redirects.filter(r => {
    if (unmappedOnly && r.to_path) return false
    if (filter && !r.from_path.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  function handleSaved(fromPath: string, toPath: string) {
    setRedirects(prev => prev.map(r => r.from_path === fromPath ? { ...r, to_path: toPath } : r))
  }

  function handleCleared(fromPath: string) {
    setRedirects(prev => prev.map(r => r.from_path === fromPath ? { ...r, to_path: null } : r))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A5E]">Redirects</h1>
          {total > 0 ? (
            <div className="mt-2">
              <p className="text-sm text-gray-500">{mapped} / {total} mapped ({pct}%)</p>
              <div className="mt-1.5 h-2 w-48 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#6B3D8F] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No URLs imported yet.</p>
          )}
          {importMsg && <p className="text-xs text-gray-500 mt-2">{importMsg}</p>}
        </div>
        <button
          onClick={handleImport}
          disabled={importing}
          className="bg-[#6B3D8F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a3278] disabled:opacity-50 transition-colors shrink-0"
        >
          {importing ? 'Importing…' : 'Import from sitemap'}
        </button>
      </div>

      {/* Filters */}
      {total > 0 && (
        <div className="flex gap-3 mb-4 items-center">
          <input
            type="text"
            placeholder="Filter by old URL…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unmappedOnly}
              onChange={e => setUnmappedOnly(e.target.checked)}
              className="accent-[#6B3D8F]"
            />
            Unmapped only
          </label>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} shown</span>
        </div>
      )}

      {/* Empty states */}
      {total === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
          Click "Import from sitemap" to load all old product URLs.
        </div>
      )}
      {total > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
          No results match the current filter.
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold w-1/2">Old path</th>
                <th className="text-left px-4 py-3 text-[#1A1A5E] font-semibold">Redirects to</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className={i % 2 === 1 ? 'bg-[#F5F5F5]' : ''}>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500 truncate max-w-xs">
                    {r.from_path.replace('/product-page/', '')}
                  </td>
                  <td className="px-4 py-2">
                    <ProductSearch
                      fromPath={r.from_path}
                      currentToPath={r.to_path}
                      onSaved={toPath => handleSaved(r.from_path, toPath)}
                      onCleared={() => handleCleared(r.from_path)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductSearch({
  fromPath,
  currentToPath,
  onSaved,
  onCleared,
}: {
  fromPath: string
  currentToPath: string | null
  onSaved: (toPath: string) => void
  onCleared: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    clearTimeout(timer.current)
    if (!val.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await searchProducts(val)
      setResults(res)
      setOpen(res.length > 0)
    }, 250)
  }

  async function handleSelect(product: Product) {
    setSaving(true)
    setOpen(false)
    setQuery('')
    const toPath = `/products/${product.slug}`
    await saveRedirect(fromPath, toPath)
    onSaved(toPath)
    setSaving(false)
  }

  async function handleClear() {
    await saveRedirect(fromPath, '')
    onCleared()
  }

  // Showing mapped state
  if (currentToPath && !query) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-[#6B3D8F] truncate">{currentToPath}</span>
        <button
          onClick={handleClear}
          className="text-gray-300 hover:text-red-400 text-xs leading-none shrink-0"
          title="Clear mapping"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        placeholder={saving ? 'Saving…' : 'Search product…'}
        disabled={saving}
        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B3D8F] disabled:opacity-50"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-20 left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map(p => (
            <li key={p.id}>
              <button
                onMouseDown={() => handleSelect(p)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2"
              >
                {p.images[0] && (
                  <img src={p.images[0]} alt="" className="w-8 h-8 object-contain rounded shrink-0" />
                )}
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
