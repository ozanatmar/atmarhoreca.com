import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { updateSheetCells, TEMP_ADD_SHEET } from '@/lib/google-sheets'

function sanitizeFilename(raw: string): string {
  return raw
    .replace(/ Ø/gi, '-')
    .replace(/ \|/g, '-')
    .replace(/ /g, '-')
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Mirrors the Google Sheets formula in column Q:
// =LOWER(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(B&"-"&A," Ø","-")," |","-")," ","-"))
function buildFilename(sku: string, name: string): string {
  return sanitizeFilename(sku + '-' + name)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rowNumber, row }: { rowNumber: number; row: string[] } = await req.json()
  const martellatoUrl = (row[7] ?? '').trim()
  const sku = (row[1] ?? '').trim()
  const filename = sanitizeFilename((row[16] ?? '').trim() || (sku + '-' + (row[0] ?? '')))

  if (!martellatoUrl) {
    return NextResponse.json({ error: 'No URL in column H' }, { status: 400 })
  }

  // Fetch the Martellato product page
  let html: string
  try {
    const res = await fetch(martellatoUrl, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch {
    await updateSheetCells(TEMP_ADD_SHEET, [{ range: `G${rowNumber}`, value: 'out_of_stock' }])
    return NextResponse.json({ skipped: true, reason: 'URL unreachable — marked out_of_stock' })
  }

  // Detect variants vs gallery
  let images: string[] = []
  let type = 'gallery'

  const variantsMatch = html.match(/var variants = (\[[\s\S]*?\]);/)
  if (variantsMatch) {
    try {
      const variants = JSON.parse(variantsMatch[1]) as Array<{ image?: string }>
      const allImages = [...new Set(variants.map(v => v.image).filter((u): u is string => !!u))]
      if (allImages.length > 0) {
        if (!sku) {
          images = allImages
          type = 'variants'
        } else {
          const skuImages = allImages.filter(url => url.toLowerCase().includes(sku.toLowerCase()))
          if (skuImages.length > 0) {
            images = skuImages
            type = 'variants'
          } else {
            // SKU not present in page variants → this variation no longer exists
            await updateSheetCells(TEMP_ADD_SHEET, [{ range: `G${rowNumber}`, value: 'out_of_stock' }])
            return NextResponse.json({ skipped: true, reason: 'SKU not found in product variants — marked out_of_stock' })
          }
        }
      }
    } catch { /* fall through to gallery */ }
  }

  if (!images.length) {
    const galleryMatches = [...html.matchAll(/data-lightbox="item-pictures"\s+href="([^"]+)"/g)]
    images = [...new Set(galleryMatches.map(m => m[1]))]
    type = 'gallery'
  }

  if (!images.length) {
    return NextResponse.json({ error: 'No images found on the page' }, { status: 422 })
  }

  // Download and upload to Supabase
  const storage = createServiceClient()
  const uploadedUrls: string[] = []

  for (let i = 0; i < images.length; i++) {
    try {
      const imgRes = await fetch(images[i], { signal: AbortSignal.timeout(15000) })
      if (!imgRes.ok) continue
      const buffer = await imgRes.arrayBuffer()
      const path = `Martellato/${filename}-${i + 1}.jpg`
      const { error } = await storage.storage
        .from('product-images')
        .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })
      if (error) continue
      uploadedUrls.push(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
      )
    } catch { continue }
  }

  if (!uploadedUrls.length) {
    return NextResponse.json({ error: 'All image uploads failed' }, { status: 500 })
  }

  // Write pipe-separated URLs to column I
  await updateSheetCells(TEMP_ADD_SHEET, [
    { range: `I${rowNumber}`, value: uploadedUrls.join('|') },
  ])

  return NextResponse.json({ success: true, count: uploadedUrls.length, type })
}
