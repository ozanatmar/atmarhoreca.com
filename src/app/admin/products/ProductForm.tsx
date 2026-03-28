'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { slugify } from '@/lib/utils'
import type { Product } from '@/types'

interface Props {
  product: Product | null
  suppliers: { id: string; name: string }[]
}

const STOCK_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

export default function ProductForm({ product, suppliers }: Props) {
  const router = useRouter()
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [supplierId, setSupplierId] = useState(product?.supplier_id ?? suppliers[0]?.id ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [weightKg, setWeightKg] = useState(String(product?.weight_kg ?? ''))
  const [requiresConfirmation, setRequiresConfirmation] = useState(product?.requires_confirmation ?? false)
  const [stockStatus, setStockStatus] = useState(product?.stock_status ?? 'unknown')
  const [martellatoUrl, setMartellatoUrl] = useState(product?.martellato_url ?? '')
  const [images, setImages] = useState<string[]>(product?.images ?? [''])
  const [shippingInefficient, setShippingInefficient] = useState(product?.shipping_inefficient ?? false)
  const [active, setActive] = useState(product?.active ?? true)
  const [metaTitle, setMetaTitle] = useState(product?.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(product?.meta_description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(val: string) {
    setName(val)
    if (!product) setSlug(slugify(val))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()
    const payload = {
      supplier_id: supplierId,
      name,
      slug,
      sku: sku || null,
      description: description || null,
      price: parseFloat(price),
      weight_kg: parseFloat(weightKg),
      requires_confirmation: requiresConfirmation,
      stock_status: stockStatus,
      martellato_url: martellatoUrl || null,
      images: images.filter(Boolean),
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      shipping_inefficient: shippingInefficient,
      active,
    }

    const { error: dbError } = product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    // Trigger ISR revalidation
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })

    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      {product && (
        <div>
          <label className="text-sm font-medium text-[#1A1A5E] block mb-1">ID</label>
          <p className="text-sm text-gray-500 font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 select-all">{product.id}</p>
        </div>
      )}
      <Input label="Product Name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
      <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required hint="Used in the URL: /products/[slug]" />
      <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} hint="Internal or supplier SKU" />

      <Select
        label="Supplier"
        value={supplierId}
        onChange={(e) => setSupplierId(e.target.value)}
        options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        required
      />

      <div>
        <label className="text-sm font-medium text-[#1A1A5E] block mb-1">Description (HTML supported)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Price (EUR excl. VAT)" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Input label="Weight (kg)" type="number" step="0.001" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
      </div>

      <Select
        label="Stock Status"
        value={stockStatus}
        onChange={(e) => setStockStatus(e.target.value as 'in_stock' | 'out_of_stock' | 'unknown')}
        options={STOCK_OPTIONS}
      />

      <Input
        label="Martellato URL"
        value={martellatoUrl}
        onChange={(e) => setMartellatoUrl(e.target.value)}
        hint="Full URL from Martellato's site or sitemap"
      />

      {/* Images */}
      <div>
        <label className="text-sm font-medium text-[#1A1A5E] block mb-1">Images (URLs)</label>
        {images.map((img, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="url"
              value={img}
              onChange={(e) => {
                const next = [...images]
                next[i] = e.target.value
                setImages(next)
              }}
              placeholder="https://atmar.bg/..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
            />
            <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="text-[#C0392B] text-sm">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setImages([...images, ''])} className="text-sm text-[#6B3D8F] hover:underline">
          + Add image URL
        </button>
      </div>

      <Input label="Meta Title (SEO)" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
      <Input label="Meta Description (SEO)" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />

      {/* Toggles */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
        <Toggle label="Requires Confirmation (always Type B)" checked={requiresConfirmation} onChange={setRequiresConfirmation} />
        <Toggle label="Shipping Inefficient" checked={shippingInefficient} onChange={setShippingInefficient} />
        <Toggle label="Active (visible on site)" checked={active} onChange={setActive} />
      </div>

      {product?.last_scraped_at && (
        <p className="text-xs text-gray-400">Last scraped: {new Date(product.last_scraped_at).toLocaleString()}</p>
      )}

      {error && <p className="text-sm text-[#C0392B]">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
