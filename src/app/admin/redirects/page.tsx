import { createServiceClient } from '@/lib/supabase/server'
import RedirectsManager from './RedirectsManager'

export default async function RedirectsPage() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('redirects')
    .select('id, from_path, to_path')
    .order('to_path', { ascending: false, nullsFirst: false }) // mapped first
    .order('from_path')

  return <RedirectsManager initialRedirects={data ?? []} />
}
