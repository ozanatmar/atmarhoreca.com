import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Module-level cache: persists within a warm Edge Function instance
let redirectCache: Record<string, string> = {}
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getRedirectMap(): Promise<Record<string, string>> {
  const now = Date.now()
  if (cacheTime > 0 && now - cacheTime < CACHE_TTL) return redirectCache

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/redirects?select=from_path,to_path&to_path=not.is.null`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: 'no-store',
      }
    )
    if (res.ok) {
      const rows: Array<{ from_path: string; to_path: string }> = await res.json()
      redirectCache = Object.fromEntries(
        rows.filter(r => r.to_path).map(r => [r.from_path, r.to_path])
      )
      cacheTime = now
    }
  } catch {
    // Use stale cache on error
  }

  return redirectCache
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check DB-driven redirects for old Wix product-page paths
  if (pathname.startsWith('/product-page/')) {
    const map = await getRedirectMap()
    const dest = map[pathname] ?? '/'
    return NextResponse.redirect(new URL(dest, request.url), { status: 301 })
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
