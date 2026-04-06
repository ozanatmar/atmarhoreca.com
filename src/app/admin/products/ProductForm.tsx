'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { slugify } from '@/lib/utils'
import type { Product } from '@/types'

type RelatedProduct = { id: string; name: string; sku: string | null }

interface Props {
  product: Product | null
  brands: { id: string; name: string }[]
}

const STOCK_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

export default function ProductForm({ product, brands }: Props) {
  const router = useRouter()
  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [brandId, setBrandId] = useState(product?.brand_id ?? brands[0]?.id ?? '')
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
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [relSearch, setRelSearch] = useState('')
  const [relResults, setRelResults] = useState<RelatedProduct[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load existing relations for this product
  useEffect(() => {
    if (!product?.id) return
    const supabase = createClient()
    supabase
      .from('product_relations')
      .select('product_id, related_product_id')
      .or(`product_id.eq.${product.id},related_product_id.eq.${product.id}`)
      .then(({ data }) => {
        if (!data?.length) return
        const ids = data.map(r => r.product_id === product.id ? r.related_product_id : r.product_id)
        supabase.from('products').select('id, name, sku').in('id', ids).then(({ data: products }) => {
          setRelatedProducts(products ?? [])
        })
      })
  }, [product?.id])

  // Debounced search for related product picker
  useEffect(() => {
    if (!relSearch.trim() || !product?.id) { setRelResults([]); return }
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id, name, sku')
        .or(`name.ilike.%${relSearch.trim()}%,sku.ilike.%${relSearch.trim()}%`)
        .neq('id', product.id)
        .limit(8)
      const existing = new Set(relatedProducts.map(p => p.id))
      setRelResults((data ?? []).filter(p => !existing.has(p.id)))
    }, 300)
    return () => clearTimeout(timer)
  }, [relSearch, product?.id, relatedProducts])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const slug = slugify(name)

    const supabase = createClient()

    // Duplicate slug check
    let query = supabase.from('products').select('id').eq('slug', slug)
    if (product) query = query.neq('id', product.id)
    const { data: existing } = await query.maybeSingle()
    if (existing) {
      setError('A product with this name already exists (duplicate slug). Use a different name.')
      setSaving(false)
      return
    }

    const payload = {
      brand_id: brandId,
      name,
      slug,
      sku: sku || null,
      description: description || null,
      price: parseFloat(price),
      weight_kg: weightKg ? parseFloat(weightKg) : null,
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

    // Save related product relations (edit only)
    if (product?.id) {
      const supabase2 = createClient()
      await supabase2.from('product_relations')
        .delete()
        .or(`product_id.eq.${product.id},related_product_id.eq.${product.id}`)
      if (relatedProducts.length > 0) {
        const rows = relatedProducts.map(rel => {
          const [a, b] = product.id < rel.id ? [product.id, rel.id] : [rel.id, product.id]
          return { product_id: a, related_product_id: b }
        })
        await supabase2.from('product_relations').insert(rows)
      }
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
      <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <div>
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required hint="Brand or internal SKU — used in the product URL" />
        <p className="text-xs text-gray-400 mt-1 font-mono">
          atmarhoreca.com/products/{sku ? `${encodeURIComponent(sku)}/` : '[sku]/'}{name ? slugify(name) : '[product-name]'}
        </p>
      </div>

      <Select
        label="Brand"
        value={brandId}
        onChange={(e) => setBrandId(e.target.value)}
        options={brands.map((s) => ({ value: s.id, label: s.name }))}
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
        <Input label="Weight (kg)" type="number" step="0.001" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} hint="Optional — used for manual shipping quotes" />
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
      <div className="flex flex-col gap-4 pt-2 border-t border-gray-100">
        <Toggle
          label="Requires Confirmation"
          hint="Check this for made-to-order products, items with uncertain stock, or anything that needs manual review before the order is confirmed. Orders for this product will always be Type B (proforma invoice) — the customer pays only after you confirm availability and price."
          checked={requiresConfirmation}
          onChange={setRequiresConfirmation}
        />
        <Toggle
          label="Shipping Inefficient"
          hint="Check this for products that are oversized, very heavy, or require special freight (e.g. pallets, fragile large items). The shipping cost cannot be calculated automatically — it will be quoted manually in the proforma invoice. The product page will show a note about this."
          checked={shippingInefficient}
          onChange={setShippingInefficient}
        />
        <Toggle
          label="Active (visible on site)"
          hint="Uncheck to hide this product from search results and its product page, without deleting it. Useful for products that are temporarily unavailable or not yet ready to publish."
          checked={active}
          onChange={setActive}
        />
      </div>

      {/* Related products picker (edit only) */}
      {product && (
        <div className="pt-2 border-t border-gray-100">
          <label className="text-sm font-medium text-[#1A1A5E] block mb-1">Related Products</label>
          <p className="text-xs text-gray-400 mb-3">Manually linked products shown on the product page (e.g. spare parts, accessories).</p>

          {relatedProducts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {relatedProducts.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs rounded-full px-3 py-1">
                  {p.name}{p.sku ? ` (${p.sku})` : ''}
                  <button
                    type="button"
                    onClick={() => setRelatedProducts(prev => prev.filter(x => x.id !== p.id))}
                    className="text-gray-400 hover:text-red-500 leading-none"
                  >×</button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={relSearch}
              onChange={e => setRelSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
            />
            {relResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md text-sm divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {relResults.map(p => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => {
                        setRelatedProducts(prev => [...prev, p])
                        setRelSearch('')
                        setRelResults([])
                      }}
                    >
                      <span className="font-medium text-[#1A1A5E]">{p.name}</span>
                      {p.sku && <span className="ml-2 text-gray-400 font-mono">{p.sku}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

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

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer mb-1">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded shrink-0" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
      <p className="text-xs text-gray-400 leading-relaxed ml-6">{hint}</p>
    </div>
  )
}
