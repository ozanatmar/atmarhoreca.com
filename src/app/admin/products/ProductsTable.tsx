'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import type { StockStatus } from '@/types'

const STOCK_BADGE: Record<StockStatus, { label: string; variant: 'green' | 'red' | 'orange' }> = {
  in_stock: { label: 'In Stock', variant: 'green' },
  out_of_stock: { label: 'Out of Stock', variant: 'red' },
  unknown: { label: 'Unknown', variant: 'orange' },
}

type SortDir = 'asc' | 'desc' | null

interface Product {
  id: string
  name: string
  sku: string | null
  price: number
  weight_kg: number
  stock_status: string
  active: boolean
  images: string[] | null
  brand: { name: string } | { name: string }[] | null
}

type SortCol = 'name' | 'sku' | 'brand' | 'price' | 'stock_status' | 'active'

function getBrandName(brand: Product['brand']): string {
  if (!brand) return ''
  return Array.isArray(brand) ? (brand[0]?.name ?? '') : brand.name
}

export default function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', id)
    setDeletingId(null)
    if (error) {
      alert(`Delete failed: ${error.message}`)
    } else {
      router.refresh()
    }
  }

  function handleSort(col: SortCol) {
    if (sortCol !== col) {
      setSortCol(col)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortCol(null)
      setSortDir(null)
    }
  }

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            getBrandName(p.brand).toLowerCase().includes(q)
        )
      : products
  }, [products, filter])

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sortCol === 'name') { av = a.name; bv = b.name }
      else if (sortCol === 'sku') { av = a.sku ?? ''; bv = b.sku ?? '' }
      else if (sortCol === 'brand') { av = getBrandName(a.brand); bv = getBrandName(b.brand) }
      else if (sortCol === 'price') { av = a.price; bv = b.price }
      else if (sortCol === 'stock_status') { av = a.stock_status; bv = b.stock_status }
      else if (sortCol === 'active') { av = a.active ? 1 : 0; bv = b.active ? 1 : 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortCol, sortDir])

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1 text-[#6B3D8F]">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  function Th({ col, children, className }: { col: SortCol; children: React.ReactNode; className?: string }) {
    return (
      <th
        className={`px-4 py-3 text-[#1A1A5E] font-semibold cursor-pointer select-none hover:bg-gray-200 ${className ?? ''}`}
        onClick={() => handleSort(col)}
      >
        {children}<SortIcon col={col} />
      </th>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by name, SKU or brand..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-14" />
              <Th col="name" className="text-left">Name</Th>
              <Th col="sku" className="text-left">SKU</Th>
              <Th col="brand" className="text-left">Brand</Th>
              <Th col="price" className="text-right">Price</Th>
              <Th col="stock_status" className="text-left">Stock</Th>
              <Th col="active" className="text-left">Active</Th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const stock = STOCK_BADGE[p.stock_status as StockStatus]
              return (
                <tr key={p.id} className={`hover:bg-purple-50 ${i % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                  <td className="px-2 py-2 pl-4">
                    {p.images?.[0] ? (
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        <Image src={p.images[0]} alt={p.name} width={40} height={40} className="object-contain w-full h-full" unoptimized />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-[#6B3D8F] hover:underline font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{getBrandName(p.brand)}</td>
                  <td className="px-4 py-3 text-right">{p.price.toFixed(2)} €</td>
                  <td className="px-4 py-3">
                    <Badge variant={stock.variant}>{stock.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${p.active ? 'text-[#7AB648]' : 'text-gray-400'}`}>
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="text-xs text-[#C0392B] hover:underline disabled:opacity-40"
                    >
                      {deletingId === p.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No products match your filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
