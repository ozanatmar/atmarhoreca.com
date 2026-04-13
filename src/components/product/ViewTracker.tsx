'use client'
import { useEffect } from 'react'

export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    fetch('/api/products/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
  }, [productId])

  return null
}
