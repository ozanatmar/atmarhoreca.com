import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: shippingRates } = await supabase
    .from('shipping_rates')
    .select('*')

  return (
    <CheckoutFlow
      customer={customer}
      userId={user.id}
      shippingRates={shippingRates ?? []}
    />
  )
}
