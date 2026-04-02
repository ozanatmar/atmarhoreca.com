import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AccountForm from './AccountForm'

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, type, status, total, currency, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-8">My Account</h1>
      <Suspense>
        <AccountForm customer={customer} userId={user.id} orders={orders ?? []} />
      </Suspense>
    </div>
  )
}
