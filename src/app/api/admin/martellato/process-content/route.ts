import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSheetCells, TEMP_ADD_SHEET } from '@/lib/google-sheets'

const SYSTEM_PROMPT = `You are an SEO copywriter for atmarhoreca.com, a professional horeca equipment e-commerce store that dropships Martellato products.

You will receive:
- EXISTING: current name, description, meta_title, meta_description on the site (may be empty or already written)
- BRAND: product name, description, and attributes scraped from Martellato's website

Your job is to produce optimized content that ranks well and converts professional buyers (pastry chefs, restaurants, hotels, cafes).

RULES:
- Treat EXISTING content as a reference, not a source of truth. Brand content takes priority for accuracy.
- Never invent specifications. Only use facts present in the input.
- Write for professionals, not home bakers. Tone: direct, technical, confident.
- Do not use filler phrases like "perfect for", "high quality", "ideal for", "discover", "innovative".
- name: concise, include the key spec (e.g. size, material, shape). Max 80 characters.
- description: HTML format. Start with a short 1-2 sentence product summary. Then use a <ul> for attributes/specs. No character limit.
- meta_title: include primary keyword + brand or category signal. Max 60 characters.
- meta_description: one sentence, action-oriented, include a key spec or differentiator. Max 155 characters.

OUTPUT: strictly valid JSON, no markdown, no explanation, no extra keys.
{"name":"...","description":"...","meta_title":"...","meta_description":"..."}`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rowNumber, row }: { rowNumber: number; row: string[] } = await req.json()
  const martellatoUrl = (row[7] ?? '').trim()

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

  // Scrape name, description, attributes
  const nameMatch = html.match(/<h1[^>]*itemprop="name"[^>]*>\s*([^<]+)/)
  const scrapedName = nameMatch ? nameMatch[1].trim() : ''

  const descMatch = html.match(/class="product-description[^"]*">([\s\S]*?)<\/div>/)
  const scrapedDescription = descMatch
    ? descMatch[1].replace(/<[^>]*>/g, '').replace(/\s{2,}/g, ' ').trim()
    : ''

  const attrMatch = html.match(/class="table attributes-table"[\s\S]*?<\/table>/)
  const scrapedAttributes = attrMatch
    ? attrMatch[0].replace(/<[^>]*>/g, ' ').replace(/[ \t]{2,}/g, ' ').replace(/\n{2,}/g, '\n').trim()
    : ''

  const userPrompt = `Existing Product name: ${row[0] ?? ''}
Existing Product description: ${row[3] ?? ''}
Existing meta title: ${row[9] ?? ''}
Existing meta description: ${row[10] ?? ''}

Product name from brand's website: ${scrapedName}
Product description from brand's website: ${scrapedDescription}
Product attributes from brand's website: ${scrapedAttributes}`

  // Call OpenAI
  let aiResult: { name: string; description: string; meta_title: string; meta_description: string }
  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!aiRes.ok) throw new Error(`OpenAI ${aiRes.status}: ${await aiRes.text()}`)
    const aiData = await aiRes.json()
    aiResult = JSON.parse(aiData.choices[0].message.content)
  } catch (e) {
    return NextResponse.json({ error: `OpenAI failed: ${(e as Error).message}` }, { status: 500 })
  }

  // Write back to sheet: A=name, D=description, J=meta_title, K=meta_description
  await updateSheetCells(TEMP_ADD_SHEET, [
    { range: `A${rowNumber}`, value: aiResult.name },
    { range: `D${rowNumber}`, value: aiResult.description },
    { range: `J${rowNumber}`, value: aiResult.meta_title },
    { range: `K${rowNumber}`, value: aiResult.meta_description },
  ])

  return NextResponse.json({ success: true, name: aiResult.name })
}
