import { createClient } from '@/lib/supabase/server'
import ShippingRatesTable from './ShippingRatesTable'

export default async function AdminShippingPage() {
  const supabase = await createClient()
  const { data: rates } = await supabase
    .from('shipping_rates')
    .select('*')
    .order('origin_country_code')
    .order('destination_country_code')

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Shipping Routes</h1>
      <ShippingRatesTable rates={rates ?? []} />
    </div>
  )
}
