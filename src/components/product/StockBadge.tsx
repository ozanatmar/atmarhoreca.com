import Badge from '@/components/ui/Badge'
import type { StockStatus } from '@/types'

interface StockBadgeProps {
  stockStatus: StockStatus
  requiresConfirmation: boolean
}

export default function StockBadge({ stockStatus, requiresConfirmation }: StockBadgeProps) {
  if (stockStatus === 'in_stock' && !requiresConfirmation) {
    return <Badge variant="green">In Stock</Badge>
  }
  if (stockStatus === 'out_of_stock') {
    return <Badge variant="red">Out of Stock</Badge>
  }
  // in_stock + requires_confirmation, or unknown
  return <Badge variant="orange">Availability on Request</Badge>
}
