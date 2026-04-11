/**
 * Checks whether a Martellato product (or specific variant) is in stock
 * by fetching the product page and inspecting its variant data.
 *
 * Logic:
 * 1. No URL → out_of_stock
 * 2. URL unreachable / non-200 → out_of_stock
 * 3. Page has variants + SKU provided → check if SKU appears in variant image URLs
 *    - SKU not found → out_of_stock (variant discontinued)
 *    - SKU found → in_stock
 * 4. Page has no variants (gallery product) → in_stock
 */
export async function checkMartellatoStock(
  url: string | null | undefined,
  sku: string | null | undefined,
): Promise<'in_stock' | 'out_of_stock'> {
  if (!url) return 'out_of_stock'

  let html: string
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return 'out_of_stock'
    html = await res.text()
  } catch {
    return 'out_of_stock'
  }

  const variantsMatch = html.match(/var variants = (\[[\s\S]*?\]);/)
  if (!variantsMatch) return 'in_stock' // gallery product — URL reachable is enough

  try {
    const variants = JSON.parse(variantsMatch[1]) as Array<{ image?: string }>
    const allImages = [...new Set(variants.map(v => v.image).filter((u): u is string => !!u))]

    if (!allImages.length) return 'in_stock' // variants block but no images — treat as in_stock
    if (!sku) return 'in_stock' // no SKU to match against

    const skuLower = sku.toLowerCase()
    const skuVariants = [
      skuLower,
      skuLower.replace(/\//g, ':'),
      skuLower.replace(/\//g, '%3a'),
      skuLower.replace(/\//g, '%2f'),
    ]
    const found = allImages.some(imgUrl => {
      const u = imgUrl.toLowerCase()
      return skuVariants.some(v => u.includes(v))
    })

    return found ? 'in_stock' : 'out_of_stock'
  } catch {
    return 'in_stock' // parse error — don't false-positive as OOS
  }
}
