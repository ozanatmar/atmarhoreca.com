import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — collapsed by default, expands on hover */}
      <aside className="group fixed left-0 top-0 h-screen w-14 hover:w-56 transition-[width] duration-200 bg-[#6B3D8F] text-white flex flex-col z-50 overflow-hidden shrink-0">
        {/* Logo mark */}
        <div className="h-14 flex items-center px-4 border-b border-purple-700 shrink-0">
          <span className="font-bold text-lg shrink-0">A</span>
          <span className="ml-1 font-bold text-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">dmin</span>
        </div>

        <nav className="flex flex-col p-2 gap-0.5 flex-1 overflow-hidden">
          <NavLink href="/admin" icon={<IconOrders />}>Orders</NavLink>
          <NavLink href="/admin/inbox" icon={<IconInbox />}>Inbox</NavLink>
          <NavLink href="/admin/products" icon={<IconProducts />}>Products</NavLink>
          <NavLink href="/admin/brands" icon={<IconBrands />}>Brands</NavLink>
          <NavLink href="/admin/shipping" icon={<IconShipping />}>Shipping Rates</NavLink>
          <NavLink href="/admin/scraping" icon={<IconScraping />}>Scraping: Martellato</NavLink>
          <NavLink href="/admin/blog" icon={<IconBlog />}>Blog</NavLink>
          <NavLink href="/admin/redirects" icon={<IconRedirects />}>Redirects</NavLink>
          <NavLink href="/admin/martellato" icon={<IconMartellato />}>Martellato</NavLink>
        </nav>

        <div className="p-2 border-t border-purple-700 flex flex-col gap-0.5 shrink-0">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-purple-300 hover:text-white hover:bg-purple-700 transition-colors">
            <IconViewSite className="w-5 h-5 shrink-0" />
            <span className="text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">View site</span>
          </Link>
          <LogoutButtonWrapper />
        </div>
      </aside>

      {/* Main content — offset by collapsed sidebar width */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto ml-14">
        <main className="flex-1 bg-[#F5F5F5] p-6">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-purple-100 hover:bg-purple-700 hover:text-white transition-colors"
    >
      <span className="w-5 h-5 shrink-0 flex items-center justify-center">{icon}</span>
      <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">{children}</span>
    </Link>
  )
}

// Wrapper so LogoutButton icon is consistent
function LogoutButtonWrapper() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className="w-5 h-5 shrink-0 flex items-center justify-center text-purple-300">
        <IconLogout />
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <LogoutButton />
      </span>
    </div>
  )
}

// ── Icons (inline SVG, 20×20 viewport) ─────────────────────────────────────

function IconOrders() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <line x1="7" y1="7" x2="13" y2="7" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="7" y1="13" x2="10" y2="13" />
    </svg>
  )
}

function IconInbox() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <polyline points="2,4 10,11 18,4" />
    </svg>
  )
}

function IconProducts() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10 2L2 6v8l8 4 8-4V6L10 2z" />
      <line x1="10" y1="10" x2="10" y2="18" />
      <line x1="2" y1="6" x2="10" y2="10" />
      <line x1="18" y1="6" x2="10" y2="10" />
    </svg>
  )
}

function IconBrands() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 3h6l8 8-6 6L3 9V3z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconShipping() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="1" y="6" width="12" height="9" rx="1" />
      <path d="M13 9h3l3 3v3h-6V9z" />
      <circle cx="5" cy="16.5" r="1.5" />
      <circle cx="15" cy="16.5" r="1.5" />
    </svg>
  )
}

function IconScraping() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="1,4 1,9 6,9" />
      <path d="M3.5 14A7.5 7.5 0 1 0 4.5 6.5L1 9" />
    </svg>
  )
}

function IconBlog() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <polyline points="12,3 12,8 17,8" />
      <line x1="7" y1="11" x2="13" y2="11" />
      <line x1="7" y1="14" x2="10" y2="14" />
    </svg>
  )
}

function IconViewSite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 3h6v6" />
      <path d="M17 3L9 11" />
      <path d="M9 5H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5" />
    </svg>
  )
}

function IconMartellato() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="10" cy="10" r="7" />
      <path d="M7 10l2 2 4-4" />
    </svg>
  )
}

function IconRedirects() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 10h14" />
      <polyline points="12,5 17,10 12,15" />
      <path d="M3 5v10" strokeDasharray="2 2" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M13 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
      <polyline points="16,13 19,10 16,7" />
      <line x1="7" y1="10" x2="19" y2="10" />
    </svg>
  )
}
