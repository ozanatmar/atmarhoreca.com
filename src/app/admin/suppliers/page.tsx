import { createClient } from '@/lib/supabase/server'
import SupplierList from './SupplierList'

export default async function AdminSuppliersPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase.from('suppliers').select('*').order('name')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Suppliers</h1>
      <SupplierList suppliers={suppliers ?? []} />
    </div>
  )
}
