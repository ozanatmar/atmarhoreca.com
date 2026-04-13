'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, productUrl } from '@/lib/utils'
import StockBadge from '@/components/product/StockBadge'

type SortKey = 'popular' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'
type AvailabilityKey = 'in_stock' | 'on_request' | 'out_of_stock'

interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  price: number
  images: string[]
  stock_status: string
  requires_confirmation: boolean
  brand_id: string | null
  tags: string[]
  views?: number
  brand: { name: string; default_requires_confirmation?: boolean; lead_time_note?: string | null } | { name: string; default_requires_confirmation?: boolean; lead_time_note?: string | null }[] | null
}

interface Props {
  products: Product[]
  fallbackProducts: Product[]
  initialQuery: string
  hideBrandFilter?: boolean
}

const AVAILABILITY_OPTIONS: { key: AvailabilityKey; label: string }[] = [
  { key: 'in_stock',    label: 'In Stock' },
  { key: 'on_request', label: 'On Request' },
  { key: 'out_of_stock', label: 'Out of Stock' },
]

const PER_PAGE_OPTIONS = [18, 36, 72]

function effectiveRequiresConfirmation(p: Product): boolean {
  const b = Array.isArray(p.brand) ? p.brand[0] : p.brand
  return p.requires_confirmation || (b?.default_requires_confirmation ?? false)
}

function matchesAvailability(p: Product, filters: Set<AvailabilityKey>): boolean {
  if (filters.size === 0) return true
  const onRequest = effectiveRequiresConfirmation(p)
  if (filters.has('in_stock')     && p.stock_status === 'in_stock'     && !onRequest) return true
  if (filters.has('on_request')   && onRequest)                                       return true
  if (filters.has('out_of_stock') && p.stock_status === 'out_of_stock')               return true
  return false
}

function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set<number>()
  set.add(1); set.add(2)
  set.add(total - 1); set.add(total)
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) set.add(i)
  const sorted = Array.from(set).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...')
    result.push(sorted[i])
  }
  return result
}

export default function SearchResultsClient({ products, fallbackProducts, initialQuery, hideBrandFilter }: Props) {
  const allBrands = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) {
      if (!p.brand_id) continue
      const b = Array.isArray(p.brand) ? p.brand[0] : p.brand
      if (b) map.set(p.brand_id, b.name)
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const [globalMin, globalMax] = useMemo(() => {
    if (!products.length) return [0, 1000]
    const prices = products.map(p => Number(p.price))
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [products])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) for (const t of (p.tags ?? [])) set.add(t)
    return Array.from(set).sort()
  }, [products])

  const pathname = usePathname()
  const storageKey = `search-filters:${pathname}`
  // Tracks restoration so the save effect skips one stale run after mount
  const restoreGen = useRef(0)
  const saveGen    = useRef(0)

  const [text, setText]                         = useState('')
  const [selectedBrands, setSelectedBrands]     = useState<Set<string>>(new Set())
  const [selectedAvail, setSelectedAvail]       = useState<Set<AvailabilityKey>>(new Set())
  const [selectedTags, setSelectedTags]         = useState<Set<string>>(new Set())
  const [priceMin, setPriceMin]                 = useState(() => globalMin)
  const [priceMax, setPriceMax]                 = useState(() => globalMax)
  const [sort, setSort]                         = useState<SortKey>('popular')
  const [filtersOpen, setFiltersOpen]           = useState(false)
  const [page, setPage]                         = useState(1)
  const [perPage, setPerPage]                   = useState(18)

  // Restore filter state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (!saved) return
      const s = JSON.parse(saved) as Record<string, unknown>
      restoreGen.current++
      if (typeof s.text === 'string') setText(s.text)
      if (Array.isArray(s.brands)) setSelectedBrands(new Set(s.brands as string[]))
      if (Array.isArray(s.avail))  setSelectedAvail(new Set(s.avail as AvailabilityKey[]))
      if (Array.isArray(s.tags))   setSelectedTags(new Set(s.tags as string[]))
      if (typeof s.sort === 'string') setSort(s.sort as SortKey)
      if (typeof s.page === 'number') setPage(s.page)
      if (typeof s.perPage === 'number') setPerPage(s.perPage)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist filter state to sessionStorage (skips the first stale run after restoration)
  useEffect(() => {
    if (saveGen.current < restoreGen.current) {
      saveGen.current = restoreGen.current
      return
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        text,
        brands: Array.from(selectedBrands),
        avail:  Array.from(selectedAvail),
        tags:   Array.from(selectedTags),
        sort, page, perPage,
      }))
    } catch {}
  }, [storageKey, text, selectedBrands, selectedAvail, selectedTags, sort, page, perPage])

  // Step 1: filter by everything except price — used to derive dynamic price bounds
  const filteredWithoutPrice = useMemo(() => {
    let result = products

    if (text.trim()) {
      const t = text.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(t) ||
        (p.sku?.toLowerCase().includes(t) ?? false)
      )
    }

    if (selectedBrands.size > 0) {
      result = result.filter(p => p.brand_id && selectedBrands.has(p.brand_id))
    }

    if (selectedAvail.size > 0) {
      result = result.filter(p => matchesAvailability(p, selectedAvail))
    }

    if (selectedTags.size > 0) {
      result = result.filter(p => (p.tags ?? []).some(t => selectedTags.has(t)))
    }

    return result
  }, [products, text, selectedBrands, selectedAvail, selectedTags])

  // Dynamic price bounds derived from currently filtered products
  const [dynamicMin, dynamicMax] = useMemo(() => {
    if (!filteredWithoutPrice.length) return [globalMin, globalMax]
    const prices = filteredWithoutPrice.map(p => Number(p.price))
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [filteredWithoutPrice, globalMin, globalMax])

  // Reset price range to full dynamic bounds whenever filters change the product set
  useEffect(() => {
    setPriceMin(dynamicMin)
    setPriceMax(dynamicMax)
  }, [dynamicMin, dynamicMax])

  // Step 2: apply price filter + sort
  const filtered = useMemo(() => {
    return [...filteredWithoutPrice]
      .filter(p => Number(p.price) >= priceMin && Number(p.price) <= priceMax)
      .sort((a, b) => {
        switch (sort) {
          case 'popular':    return (b.views ?? 0) - (a.views ?? 0)
          case 'price_asc':  return Number(a.price) - Number(b.price)
          case 'price_desc': return Number(b.price) - Number(a.price)
          case 'name_asc':   return a.name.localeCompare(b.name)
          case 'name_desc':  return b.name.localeCompare(a.name)
          default:           return 0
        }
      })
  }, [filteredWithoutPrice, priceMin, priceMax, sort])

  // Reset to page 1 whenever filters or per-page changes
  useEffect(() => { setPage(1) }, [text, selectedBrands, selectedAvail, selectedTags, priceMin, priceMax, sort, perPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, safePage, perPage])

  function toggleBrand(id: string) {
    setSelectedBrands(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  function toggleAvail(key: AvailabilityKey) {
    setSelectedAvail(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const activeFilterCount =
    (text.trim() ? 1 : 0) +
    selectedBrands.size +
    selectedAvail.size +
    selectedTags.size +
    (priceMin > dynamicMin || priceMax < dynamicMax ? 1 : 0)

  const pct = (v: number) =>
    dynamicMax === dynamicMin ? 0 : ((v - dynamicMin) / (dynamicMax - dynamicMin)) * 100

  const FiltersPanel = (
    <div className="flex flex-col gap-6">
      {/* Name / SKU */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Name / SKU
        </label>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. mould, MAR-001…"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]/30"
        />
      </div>

      {/* Price range */}
      {dynamicMin < dynamicMax && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Price range</p>
          <div className="relative flex items-center h-5 mb-3">
            <div className="absolute w-full h-1.5 bg-gray-200 rounded-full pointer-events-none">
              <div
                className="absolute h-full bg-[#6B3D8F] rounded-full"
                style={{ left: `${pct(priceMin)}%`, right: `${100 - pct(priceMax)}%` }}
              />
            </div>
            <input
              type="range" min={dynamicMin} max={dynamicMax} step={1}
              value={priceMin}
              onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax))}
              className="absolute w-full h-1.5 appearance-none bg-transparent
                pointer-events-none
                [&::-webkit-slider-thumb]:pointer-events-auto
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#6B3D8F] [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:pointer-events-auto
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#6B3D8F]
                [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-track]:bg-transparent"
              style={{ zIndex: 5 }}
            />
            <input
              type="range" min={dynamicMin} max={dynamicMax} step={1}
              value={priceMax}
              onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin))}
              className="absolute w-full h-1.5 appearance-none bg-transparent
                pointer-events-none
                [&::-webkit-slider-thumb]:pointer-events-auto
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#6B3D8F] [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:pointer-events-auto
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#6B3D8F]
                [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-track]:bg-transparent"
              style={{ zIndex: 4 }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatPrice(priceMin)}</span>
            <span>{formatPrice(priceMax)}</span>
          </div>
        </div>
      )}

      {/* Brand */}
      {!hideBrandFilter && allBrands.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Brand</p>
          <div className="flex flex-col gap-2">
            {allBrands.map(b => (
              <label key={b.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={selectedBrands.has(b.id)}
                  onChange={() => toggleBrand(b.id)}
                  className="rounded border-gray-300 text-[#6B3D8F] focus:ring-[#6B3D8F]"
                />
                {b.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Availability</p>
        <div className="flex flex-col gap-2">
          {AVAILABILITY_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={selectedAvail.has(key)}
                onChange={() => toggleAvail(key)}
                className="rounded border-gray-300 text-[#6B3D8F] focus:ring-[#6B3D8F]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort by</p>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]/30 bg-white"
        >
          <option value="popular">Most Popular</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <button
          onClick={() => {
            setText('')
            setSelectedBrands(new Set())
            setSelectedAvail(new Set())
            setSelectedTags(new Set())
            setPriceMin(dynamicMin)
            setPriceMax(dynamicMax)
            setSort('popular')
          }}
          className="text-xs text-[#6B3D8F] hover:underline text-left"
        >
          Clear all filters
        </button>
      )}
    </div>
  )

  const Pagination = totalPages > 1 && (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={safePage === 1}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed hidden sm:block"
      >
        ← Previous
      </button>
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={safePage === 1}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed sm:hidden"
      >
        ←
      </button>
      {pageNumbers(safePage, totalPages).map((n, i) =>
        n === '...'
          ? <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400 select-none">…</span>
          : <button
              key={n}
              onClick={() => setPage(n)}
              className={`min-w-[40px] px-3 py-2 text-sm rounded-lg border transition-colors ${
                n === safePage
                  ? 'bg-[#6B3D8F] text-white border-[#6B3D8F] font-semibold'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
      )}
      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={safePage === totalPages}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed hidden sm:block"
      >
        Next →
      </button>
      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={safePage === totalPages}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed sm:hidden"
      >
        →
      </button>
    </div>
  )

  return (
    <div className="flex gap-10 items-start">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 sticky top-6">
        {FiltersPanel}
      </aside>

      {/* Results column */}
      <div className="flex-1 min-w-0">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-[#6B3D8F] border border-[#6B3D8F] rounded-lg px-4 py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6" />
            </svg>
            Filters &amp; Sort
            {activeFilterCount > 0 && (
              <span className="bg-[#6B3D8F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {filtersOpen && (
            <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              {FiltersPanel}
            </div>
          )}
        </div>

        {/* Count + per-page selector */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {initialQuery && <> for &ldquo;{initialQuery}&rdquo;</>}
            {totalPages > 1 && (
              <span className="ml-1 text-gray-400">
                — page {safePage} of {totalPages}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>Show</span>
            {PER_PAGE_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setPerPage(n)}
                className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
                  perPage === n
                    ? 'bg-[#6B3D8F] text-white'
                    : 'text-gray-500 hover:text-[#6B3D8F]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mb-4">
            {Pagination}
          </div>
        )}

        {filtered.length === 0 && fallbackProducts.length === 0 && (
          <p className="text-gray-500">No products found.</p>
        )}

        {filtered.length === 0 && fallbackProducts.length > 0 && (
          <div>
            <p className="text-gray-500 mb-6">
              We don&apos;t carry <strong>&ldquo;{initialQuery}&rdquo;</strong>, but you might be interested in these:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {fallbackProducts.map(p => {
                const brandName = p.brand
                  ? Array.isArray(p.brand) ? p.brand[0]?.name : p.brand.name
                  : null
                return (
                  <Link
                    key={p.id}
                    href={productUrl(p)}
                    className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      <Image
                        src={p.images[0] ?? 'https://atmar.bg/atmar_horeca_logo_512x512.jpg'}
                        alt={p.name}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-1 gap-1.5">
                      <div className="flex items-center gap-2">
                        {brandName && (
                          <span className="text-xs font-semibold text-[#6B3D8F] uppercase tracking-wide">{brandName}</span>
                        )}
                        {p.sku && <span className="text-xs text-gray-400 font-mono">{p.sku}</span>}
                      </div>
                      <h2 className="text-sm font-semibold text-[#1A1A5E] line-clamp-2 flex-1">{p.name}</h2>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-[#1A1A5E]">{formatPrice(Number(p.price))}</span>
                        <StockBadge
                          stockStatus={p.stock_status as 'in_stock' | 'out_of_stock' | 'unknown'}
                          requiresConfirmation={effectiveRequiresConfirmation(p)}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {paginated.map(p => {
            const brandObj = Array.isArray(p.brand) ? p.brand[0] : p.brand
            const brandName = brandObj?.name ?? null
            const leadTime = brandObj?.lead_time_note ?? null
            return (
              <Link
                key={p.id}
                href={productUrl(p)}
                className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Image
                    src={p.images[0] ?? 'https://atmar.bg/atmar_horeca_logo_512x512.jpg'}
                    alt={p.name}
                    fill
                    className={`object-contain p-3 transition-opacity duration-300 ${p.images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105 transition-transform'}`}
                    unoptimized
                  />
                  {p.images[1] && (
                    <Image
                      src={p.images[1]}
                      alt={p.name}
                      fill
                      className="object-contain p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      unoptimized
                    />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    {brandName && (
                      <span className="text-xs font-semibold text-[#6B3D8F] uppercase tracking-wide">
                        {brandName}
                      </span>
                    )}
                    {p.sku && (
                      <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                    )}
                  </div>
                  <h2 className="text-sm font-semibold text-[#1A1A5E] line-clamp-2 flex-1">{p.name}</h2>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-[#1A1A5E]">{formatPrice(Number(p.price))}</span>
                    <StockBadge
                      stockStatus={p.stock_status as 'in_stock' | 'out_of_stock' | 'unknown'}
                      requiresConfirmation={effectiveRequiresConfirmation(p)}
                    />
                  </div>
                  {leadTime && (
                    <p className="text-xs text-gray-400 mt-0.5">{leadTime}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {Pagination}
      </div>
    </div>
  )
}
