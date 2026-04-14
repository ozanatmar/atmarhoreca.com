import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { runMartellato } from '@/lib/scrape-martellato'

export async function GET(request: NextRequest) {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Respond immediately so Make.com doesn't time out — scrape runs in background
  after(async () => {
    await runMartellato(true)
  })

  return NextResponse.json({ status: 'started' })
}
