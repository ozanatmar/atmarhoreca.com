import 'server-only'
import crypto from 'crypto'

const SHEET_ID = '1_c8JN3ZwJlGPqNsJ-vC2TwGTAibQBB_JaUGDwdHgjU8'
export const EDIT_SHEET = 'Atmar Horeca Edit Products'

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function getAccessToken(): Promise<string> {
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const signature = base64url(sign.sign(sa.private_key))
  const jwt = `${header}.${payload}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Google auth failed: ${await res.text()}`)
  const data = await res.json()
  return data.access_token
}

async function ensureSheetExists(token: string): Promise<void> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  const exists = data.sheets?.some(
    (s: { properties: { title: string } }) => s.properties.title === EDIT_SHEET
  )
  if (!exists) {
    const r = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: EDIT_SHEET } } }] }),
      }
    )
    if (!r.ok) throw new Error(`Could not create sheet tab: ${await r.text()}`)
  }
}

export async function writeToSheet(rows: string[][]): Promise<void> {
  const token = await getAccessToken()
  await ensureSheetExists(token)
  const range = encodeURIComponent(`${EDIT_SHEET}!A1`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  )
  if (!res.ok) throw new Error(`Sheets write failed: ${await res.text()}`)
}

export async function readFromSheet(): Promise<string[][]> {
  const token = await getAccessToken()
  await ensureSheetExists(token)
  const range = encodeURIComponent(`${EDIT_SHEET}!A1:Z1000`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Sheets read failed: ${await res.text()}`)
  const data = await res.json()
  return data.values ?? []
}

export async function clearSheetData(): Promise<void> {
  const token = await getAccessToken()
  await ensureSheetExists(token)
  const range = encodeURIComponent(`${EDIT_SHEET}!A2:Z1000`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  if (!res.ok) throw new Error(`Sheets clear failed: ${await res.text()}`)
}
