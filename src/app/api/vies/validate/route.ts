import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const vat = request.nextUrl.searchParams.get('vat')?.trim()
  if (!vat) return NextResponse.json({ valid: false, error: 'No VAT number provided' })

  // EU VAT format: 2-letter country code + digits
  const match = vat.match(/^([A-Z]{2})(.+)$/i)
  if (!match) return NextResponse.json({ valid: false, error: 'Invalid format' })

  const countryCode = match[1].toUpperCase()
  const vatNumber = match[2]

  try {
    // EU VIES SOAP API
    const soapBody = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
        <soapenv:Header/>
        <soapenv:Body>
          <urn:checkVat>
            <urn:countryCode>${countryCode}</urn:countryCode>
            <urn:vatNumber>${vatNumber}</urn:vatNumber>
          </urn:checkVat>
        </soapenv:Body>
      </soapenv:Envelope>
    `

    const response = await fetch(
      'https://ec.europa.eu/taxation_customs/vies/services/checkVatService',
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: soapBody,
        signal: AbortSignal.timeout(8000),
      }
    )

    const text = await response.text()
    const valid = text.includes('valid>true</') && text.includes('valid>')

    return NextResponse.json({ valid })
  } catch {
    // If VIES API fails, treat as invalid (standard VAT applies)
    return NextResponse.json({ valid: false, error: 'Validation service unavailable' })
  }
}
