import { NextRequest, NextResponse } from 'next/server'
import { runMartellato } from '@/lib/scrape-martellato'

export async function GET(request: NextRequest) {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runMartellato(true)

  if ('skipped' in result) return NextResponse.json(result)
  if (!result.success) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}
