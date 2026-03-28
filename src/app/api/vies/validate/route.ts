import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const vat = request.nextUrl.searchParams.get('vat')?.trim()
  if (!vat) return NextResponse.json({ valid: false, error: 'No VAT number provided' })

  const match = vat.match(/^([A-Z]{2})(.+)$/i)
  if (!match) return NextResponse.json({ valid: false, error: 'Invalid format' })

  const countryCode = match[1].toUpperCase()
  const vatNumber = match[2]

  try {
    const response = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${vatNumber}`,
      { signal: AbortSignal.timeout(8000) }
    )

    if (!response.ok) {
      return NextResponse.json({ valid: false, error: 'Validation service unavailable' })
    }

    const data = await response.json()
    return NextResponse.json({ valid: data.isValid === true })
  } catch {
    return NextResponse.json({ valid: false, error: 'Validation service unavailable' })
  }
}
