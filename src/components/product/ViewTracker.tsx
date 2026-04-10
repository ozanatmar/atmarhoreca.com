'use client'
import { useEffect } from 'react'

export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    let sessionId = localStorage.getItem('atmar_sid')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('atmar_sid', sessionId)
    }

    fetch('/api/product-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, session_id: sessionId }),
    }).catch(() => {})
  }, [productId])

  return null
}
