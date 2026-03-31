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
      {/* Sidebar */}
      <aside className="w-56 bg-[#6B3D8F] text-white flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-purple-700">
          <span className="font-bold text-lg">Admin</span>
        </div>
        <nav className="flex flex-col p-3 gap-1 flex-1">
          <NavLink href="/admin">Orders</NavLink>
          <NavLink href="/admin/products">Products</NavLink>
          <NavLink href="/admin/suppliers">Suppliers</NavLink>
          <NavLink href="/admin/shipping">Shipping Rates</NavLink>
          <NavLink href="/admin/scraping">Scraping</NavLink>
          <NavLink href="/admin/blog">Blog</NavLink>
        </nav>
        <div className="p-3 border-t border-purple-700 flex flex-col gap-2">
          <Link href="/" className="text-xs text-purple-300 hover:text-white">
            View site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-500">Atmar Horeca Admin Panel</p>
        </header>
        <main className="flex-1 bg-[#F5F5F5] p-6">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm font-medium text-purple-100 hover:bg-purple-700 hover:text-white transition-colors"
    >
      {children}
    </Link>
  )
}
