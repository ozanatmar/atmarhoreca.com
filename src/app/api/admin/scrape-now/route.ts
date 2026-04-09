import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runMartellato } from '@/lib/scrape-martellato'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runMartellato(true) // force=true: bypass frequency check

  if (!('success' in result)) return NextResponse.json(result) // skipped (shouldn't happen with force=true)
  if (!result.success) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}
