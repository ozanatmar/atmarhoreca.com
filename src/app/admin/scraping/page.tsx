import { createClient } from '@/lib/supabase/server'
import ScrapingPanel from './ScrapingPanel'

export default async function AdminScrapingPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('scrape_logs')
    .select('*, brand:brands(name)')
    .order('ran_at', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Scraping: Martellato</h1>
      <ScrapingPanel logs={logs ?? []} />
    </div>
  )
}
