'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, User, Search, Loader2, LogOut, UserCircle } from 'lucide-react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useCartStore } from '@/lib/cart-store'

function SearchBar({ className }: { className: string }) {
  const [searching, setSearching] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => { setSearching(false) }, [pathname, searchParams])

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
        if (!q) return
        setSearching(true)
        router.push(`/search?q=${encodeURIComponent(q)}`)
      }}
    >
      <div className="relative w-full">
        <input
          type="search"
          name="q"
          placeholder="Search products..."
          className="w-full py-2 pl-4 pr-10 rounded-lg bg-white/15 border border-white/40 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0A500] focus:bg-white focus:text-gray-900 focus:placeholder-gray-400"
          onChange={() => setSearching(false)}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
          aria-label="Search"
        >
          {searching
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Search className="w-4 h-4" />
          }
        </button>
      </div>
    </form>
  )
}

function HeaderSearchBar() {
  return <SearchBar className="hidden sm:flex flex-1 max-w-lg mx-6" />
}

function MobileSearchBar() {
  return <SearchBar className="flex w-full" />
}

function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 hover:text-[#F0A500] transition-colors"
        aria-label="Account"
      >
        <User className="w-6 h-6" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <UserCircle className="w-4 h-4 text-[#6B3D8F]" />
            My Account
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0))

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <header className="bg-[#6B3D8F] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: logo + icons */}
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo_white_no_bg.png"
              alt="Atmar Horeca"
              width={200}
              height={56}
              className="h-12 w-auto"
            />
          </Link>

          {/* Search bar — inline on sm+ */}
          <Suspense fallback={
            <div className="hidden sm:flex flex-1 max-w-lg mx-6">
              <div className="relative w-full">
                <input
                  type="search"
                  placeholder="Search products..."
                  className="w-full py-2 pl-4 pr-10 rounded-lg text-gray-900 text-sm focus:outline-none"
                  disabled
                />
              </div>
            </div>
          }>
            <HeaderSearchBar />
          </Suspense>

          {/* Nav icons */}
          <nav className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative p-2 hover:text-[#F0A500] transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F0A500] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            {user ? <UserMenu /> : (
              <Link href="/login" className="p-2 hover:text-[#F0A500] transition-colors" aria-label="Login">
                <User className="w-6 h-6" />
              </Link>
            )}
          </nav>
        </div>

        {/* Search bar — full width row on mobile only */}
        <div className="sm:hidden pb-3">
          <Suspense fallback={null}>
            <MobileSearchBar />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
