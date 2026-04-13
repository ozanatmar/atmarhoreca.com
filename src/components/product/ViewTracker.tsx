'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const supabase = createClient()

    // Never count views from logged-in (admin) users
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) return

      // Client-side dedup: only count 1 view per product per 24h per browser
      const key = `atmar_view_${productId}`
      const last = localStorage.getItem(key)
      if (last && Date.now() - Number(last) < 24 * 60 * 60 * 1000) return

      let sessionId = localStorage.getItem('atmar_sid')
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem('atmar_sid', sessionId)
      }

      localStorage.setItem(key, String(Date.now()))

      supabase
        .from('product_views')
        .insert({ product_id: productId, session_id: sessionId })
        .then(({ error }) => {
          if (error) localStorage.removeItem(key) // rollback on failure
        })
    })
  }, [productId])

  return null
}
