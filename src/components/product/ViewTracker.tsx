'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    createClient()
      .from('product_views')
      .insert({ product_id: productId, session_id: 'n/a' })
  }, [productId])

  return null
}
