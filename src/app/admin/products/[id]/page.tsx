import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductForm from '../ProductForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single()
  if (!product) notFound()

  const { data: brands } = await supabase.from('brands').select('id, name, slug').eq('active', true)

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Edit Product</h1>
      <ProductForm product={product} brands={brands ?? []} />
    </div>
  )
}
