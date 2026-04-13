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

async function recordProductView(pathname: string) {
  // URL pattern is either /products/[sku]/[name] or /products/[slug]
  const parts = pathname.replace('/products/', '').split('/')
  const isTwoSegment = parts.length >= 2
  const column = isTwoSegment ? 'sku' : 'slug'
  const value = decodeURIComponent(parts[0])
  if (!value) return

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=id&${column}=eq.${encodeURIComponent(value)}&limit=1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) return
    const rows: Array<{ id: string }> = await res.json()
    if (!rows.length) return

    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/product_views`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ product_id: rows[0].id, session_id: 'n/a' }),
        cache: 'no-store',
      }
    )
  } catch {
    // Never block the request
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check DB-driven redirects for old Wix product-page paths
  if (pathname.startsWith('/product-page/')) {
    const map = await getRedirectMap()
    const dest = map[pathname] ?? '/'
    return NextResponse.redirect(new URL(dest, request.url), { status: 301 })
  }

  // Count product page views only on real user navigations:
  // - Hard navigate: browser sets sec-fetch-dest: document
  // - SPA click (App Router RSC request): rsc: 1 without next-router-prefetch
  // Excludes: prefetches, ISR revalidation, bots, crawlers
  if (pathname.startsWith('/products/')) {
    const isHardNav = request.headers.get('sec-fetch-dest') === 'document'
    const isSpaNav = request.headers.get('rsc') === '1' && !request.headers.get('next-router-prefetch')
    if (isHardNav || isSpaNav) {
      recordProductView(pathname)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
