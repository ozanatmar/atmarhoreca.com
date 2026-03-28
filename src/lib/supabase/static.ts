/**
 * A plain Supabase client for use at build time (generateStaticParams),
 * where no request context (cookies) is available.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
