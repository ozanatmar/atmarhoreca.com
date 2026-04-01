import { createClient } from '@/lib/supabase/server'
import BrandList from './BrandList'

export default async function AdminBrandsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('*').order('name')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Brands</h1>
      <BrandList brands={brands ?? []} />
    </div>
  )
}
