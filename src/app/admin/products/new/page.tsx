import { createClient } from '@/lib/supabase/server'
import ProductForm from '../ProductForm'

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('id, name').eq('active', true)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">New Product</h1>
      <ProductForm product={null} brands={brands ?? []} />
    </div>
  )
}
