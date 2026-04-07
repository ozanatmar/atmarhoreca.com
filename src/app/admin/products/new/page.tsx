import { createClient } from '@/lib/supabase/server'
import ProductForm from '../ProductForm'

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('id, name, slug').eq('active', true)

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">New Product</h1>
      <ProductForm product={null} brands={brands ?? []} />
    </div>
  )
}
