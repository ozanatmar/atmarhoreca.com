'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, User, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useCartStore } from '@/lib/cart-store'

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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="https://atmar.bg/newlogo.jpg"
              alt="Atmar Horeca"
              width={140}
              height={40}
              className="h-10 w-auto"
              unoptimized
            />
          </Link>

          {/* Search bar */}
          <form action="/search" className="hidden sm:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <input
                type="search"
                name="q"
                placeholder="Search products..."
                className="w-full py-2 pl-4 pr-10 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0A500]"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6B3D8F]"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

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
            <Link
              href={user ? '/account' : '/login'}
              className="p-2 hover:text-[#F0A500] transition-colors"
              aria-label={user ? 'Account' : 'Login'}
            >
              <User className="w-6 h-6" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
