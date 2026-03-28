'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
  supplier: { name: string } | { name: string }[] | null
}

type SortCol = 'name' | 'sku' | 'supplier' | 'price' | 'weight_kg' | 'stock_status' | 'active'

function getSupplierName(supplier: Product['supplier']): string {
  if (!supplier) return ''
  return Array.isArray(supplier) ? (supplier[0]?.name ?? '') : supplier.name
}

export default function ProductsTable({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('')
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

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
            getSupplierName(p.supplier).toLowerCase().includes(q)
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
      else if (sortCol === 'supplier') { av = getSupplierName(a.supplier); bv = getSupplierName(b.supplier) }
      else if (sortCol === 'price') { av = a.price; bv = b.price }
      else if (sortCol === 'weight_kg') { av = a.weight_kg; bv = b.weight_kg }
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
          placeholder="Filter by name, SKU or supplier..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] border-b border-gray-200">
            <tr>
              <Th col="name" className="text-left">Name</Th>
              <Th col="sku" className="text-left">SKU</Th>
              <Th col="supplier" className="text-left">Supplier</Th>
              <Th col="price" className="text-right">Price</Th>
              <Th col="weight_kg" className="text-right">Weight</Th>
              <Th col="stock_status" className="text-left">Stock</Th>
              <Th col="active" className="text-left">Active</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const stock = STOCK_BADGE[p.stock_status as StockStatus]
              return (
                <tr key={p.id} className={`hover:bg-purple-50 ${i % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-[#6B3D8F] hover:underline font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{getSupplierName(p.supplier)}</td>
                  <td className="px-4 py-3 text-right">{p.price.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right">{p.weight_kg} kg</td>
                  <td className="px-4 py-3">
                    <Badge variant={stock.variant}>{stock.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${p.active ? 'text-[#7AB648]' : 'text-gray-400'}`}>
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No products match your filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
