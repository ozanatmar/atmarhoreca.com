import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function extractSheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return m ? m[1] : null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url, sheetName } = await request.json()
  const sheetId = extractSheetId(url)
  if (!sheetId) return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 })

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`

  let csvText: string
  try {
    const res = await fetch(csvUrl, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return NextResponse.json({ error: `Google Sheets returned ${res.status}` }, { status: 502 })
    csvText = await res.text()
    if (csvText.trimStart().startsWith('<')) {
      return NextResponse.json({ error: 'Sheet is not publicly accessible. Share it as "Anyone with the link can view".' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Could not reach Google Sheets' }, { status: 502 })
  }

  const lines = csvText.trim().split('\n').slice(1) // skip header row
  const rows = lines
    .map((line) => {
      const cols = line.split(',').map((s) => s.replace(/^"|"$/g, '').trim())
      const [origin, destination, transit] = cols
      return {
        origin_country_code: origin?.toUpperCase(),
        destination_country_code: destination?.toUpperCase(),
        transit_days: parseInt(transit),
      }
    })
    .filter((r) => r.origin_country_code && r.destination_country_code && !isNaN(r.transit_days))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid rows found. Check column order: A: origin, B: destination, C: transit_days' }, { status: 400 })
  }

  const { error } = await supabase
    .from('shipping_rates')
    .upsert(rows, { onConflict: 'origin_country_code,destination_country_code' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ count: rows.length })
}
