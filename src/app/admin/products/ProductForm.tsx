'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { slugify, productUrl } from '@/lib/utils'
import type { Product, ProductDocument, ProductOptionGroup } from '@/types'

type RelatedProduct = { id: string; name: string; slug: string; sku: string | null }

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
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(product?.specs ?? [])
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>(product?.option_groups ?? [])
  const [metaTitle, setMetaTitle] = useState(product?.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(product?.meta_description ?? '')
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [relSearch, setRelSearch] = useState('')
  const [relResults, setRelResults] = useState<RelatedProduct[]>([])
  const [documents, setDocuments] = useState<ProductDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
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
        supabase.from('products').select('id, name, slug, sku').in('id', ids).then(({ data: products }) => {
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
        .select('id, name, slug, sku')
        .or(`name.ilike.%${relSearch.trim()}%,sku.ilike.%${relSearch.trim()}%`)
        .neq('id', product.id)
        .limit(8)
      const existing = new Set(relatedProducts.map(p => p.id))
      setRelResults((data ?? []).filter(p => !existing.has(p.id)))
    }, 300)
    return () => clearTimeout(timer)
  }, [relSearch, product?.id, relatedProducts])

  // Load existing documents
  useEffect(() => {
    if (!product?.id) return
    createClient()
      .from('product_documents')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at')
      .then(({ data }) => setDocuments(data ?? []))
  }, [product?.id])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !product?.id) return
    if (file.type !== 'application/pdf') { setUploadError('Only PDF files are supported.'); return }

    setUploading(true)
    setUploadError('')

    const brandName = brands.find(b => b.id === brandId)?.name ?? 'unknown'
    const safeBrand = brandName.replace(/[^a-zA-Z0-9-_]/g, '_')
    const safeFile = file.name.replace(/[^a-zA-Z0-9-_.]/g, '_')
    const filePath = `${safeBrand}/${product.id}-${Date.now()}-${safeFile}`

    const supabase = createClient()
    const { error: storageError } = await supabase.storage
      .from('product-documents')
      .upload(filePath, file, { contentType: 'application/pdf' })

    if (storageError) { setUploadError(storageError.message); setUploading(false); return }

    const displayName = file.name.replace(/\.pdf$/i, '')
    const { data: doc, error: dbError } = await supabase
      .from('product_documents')
      .insert({ product_id: product.id, name: displayName, file_path: filePath })
      .select()
      .single()

    if (dbError) { setUploadError(dbError.message); setUploading(false); return }

    setDocuments(prev => [...prev, doc])
    setUploading(false)
  }

  async function handleDeleteDocument(doc: ProductDocument) {
    const supabase = createClient()
    await supabase.storage.from('product-documents').remove([doc.file_path])
    await supabase.from('product_documents').delete().eq('id', doc.id)
    setDocuments(prev => prev.filter(d => d.id !== doc.id))
  }

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
      specs: specs.filter(s => s.key.trim()),
      option_groups: optionGroups.filter(g => g.name.trim()),
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

    // Revalidate this product + all related products
    await Promise.all([
      { sku: sku || null, slug },
      ...relatedProducts.map(r => ({ sku: r.sku, slug: r.slug })),
    ].map(p =>
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: productUrl(p) }),
      })
    ))

    router.push('/admin/products')
    router.refresh()
  }

  const selectedBrandName = brands.find(b => b.id === brandId)?.name ?? ''
  const showMartellatoUrl = !!martellatoUrl || selectedBrandName.toLowerCase() === 'martellato'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Column 1: core product info ── */}
        <div className="flex flex-col gap-4">
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

          <div>
            <label className="text-sm font-medium text-[#1A1A5E] block mb-1">Description (HTML supported)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
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
        </div>

        {/* ── Column 2: settings, relations, docs ── */}
        <div className="flex flex-col gap-5">
          <Select
            label="Brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            options={brands.map((s) => ({ value: s.id, label: s.name }))}
            required
          />

          {showMartellatoUrl && (
            <Input
              label="Martellato URL"
              value={martellatoUrl}
              onChange={(e) => setMartellatoUrl(e.target.value)}
              hint="Full URL from Martellato's site or sitemap"
            />
          )}

          {/* Technical Specs */}
          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
            <label className="text-sm font-medium text-[#1A1A5E] block">Technical Specifications</label>
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={spec.key}
                  onChange={e => { const next = [...specs]; next[i] = { ...next[i], key: e.target.value }; setSpecs(next) }}
                  placeholder="e.g. Power"
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={e => { const next = [...specs]; next[i] = { ...next[i], value: e.target.value }; setSpecs(next) }}
                  placeholder="e.g. 1500W"
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
                />
                <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="text-[#C0392B] text-sm shrink-0">×</button>
              </div>
            ))}
            <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '' }])} className="text-sm text-[#6B3D8F] hover:underline text-left">
              + Add spec
            </button>
          </div>

          {/* Option Groups */}
          <div className="flex flex-col gap-3 pt-1 border-t border-gray-100">
            <label className="text-sm font-medium text-[#1A1A5E] block">Product Options</label>
            {optionGroups.map((group, gi) => (
              <div key={gi} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={group.name}
                    onChange={e => {
                      const next = [...optionGroups]
                      next[gi] = { ...next[gi], name: e.target.value }
                      setOptionGroups(next)
                    }}
                    placeholder="e.g. Size, Color…"
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
                  />
                  <button type="button" onClick={() => setOptionGroups(optionGroups.filter((_, i) => i !== gi))} className="text-xs text-red-500 hover:underline shrink-0">Remove group</button>
                </div>
                {group.options.map((opt, oi) => (
                  <div key={oi} className="flex gap-2 items-center pl-3">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={e => {
                        const next = [...optionGroups]
                        next[gi].options[oi] = { ...next[gi].options[oi], label: e.target.value }
                        setOptionGroups(next)
                      }}
                      placeholder="Option label"
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={opt.price_modifier}
                      onChange={e => {
                        const next = [...optionGroups]
                        next[gi].options[oi] = { ...next[gi].options[oi], price_modifier: parseFloat(e.target.value) || 0 }
                        setOptionGroups(next)
                      }}
                      placeholder="±€"
                      className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F]"
                    />
                    <button type="button" onClick={() => {
                      const next = [...optionGroups]
                      next[gi].options = next[gi].options.filter((_, i) => i !== oi)
                      setOptionGroups(next)
                    }} className="text-[#C0392B] text-sm shrink-0">×</button>
                  </div>
                ))}
                <button type="button" onClick={() => {
                  const next = [...optionGroups]
                  next[gi].options = [...next[gi].options, { label: '', price_modifier: 0 }]
                  setOptionGroups(next)
                }} className="text-xs text-[#6B3D8F] hover:underline text-left pl-3">+ Add option</button>
              </div>
            ))}
            <button type="button" onClick={() => setOptionGroups([...optionGroups, { name: '', options: [] }])} className="text-sm text-[#6B3D8F] hover:underline text-left">
              + Add option group
            </button>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-4 pt-1 border-t border-gray-100">
            <Toggle
              label="Requires Confirmation"
              hint="Orders for this product will always be Type B (proforma invoice) — the customer pays only after you confirm availability and price."
              checked={requiresConfirmation}
              onChange={setRequiresConfirmation}
            />
            <Toggle
              label="Shipping Inefficient"
              hint="Oversized or very heavy product — shipping cost will be quoted manually in the proforma invoice."
              checked={shippingInefficient}
              onChange={setShippingInefficient}
            />
            <Toggle
              label="Active (visible on site)"
              hint="Uncheck to hide this product from search results and its product page without deleting it."
              checked={active}
              onChange={setActive}
            />
          </div>

          {/* Related products picker (edit only) */}
          {product && (
            <div className="flex flex-col gap-3 pt-1 border-t border-gray-100">
              <div>
                <label className="text-sm font-medium text-[#1A1A5E] block mb-0.5">Related Products</label>
                <p className="text-xs text-gray-400">Spare parts, accessories, etc.</p>
              </div>

              {relatedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
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

          {/* Documents (edit only) */}
          {product && (
            <div className="flex flex-col gap-3 pt-1 border-t border-gray-100">
              <div>
                <label className="text-sm font-medium text-[#1A1A5E] block mb-0.5">Documents</label>
                <p className="text-xs text-gray-400">PDF files shown as downloads on the product page.</p>
              </div>

              {documents.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {documents.map(doc => (
                    <li key={doc.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-gray-400">📄</span>
                      <span className="flex-1 truncate">{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-xs text-red-500 hover:underline shrink-0"
                      >Remove</button>
                    </li>
                  ))}
                </ul>
              )}

              <label className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'border-gray-300 hover:border-[#6B3D8F] text-gray-600 hover:text-[#6B3D8F]'}`}>
                <span>{uploading ? 'Uploading…' : '+ Upload PDF'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>

              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
          )}

          {product?.last_scraped_at && (
            <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">Last scraped: {new Date(product.last_scraped_at).toLocaleString()}</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-[#C0392B]">{error}</p>}

      <div className="flex gap-3">
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
