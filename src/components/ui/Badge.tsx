import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'green' | 'orange' | 'red' | 'purple' | 'gray'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        {
          'bg-[#7AB648] text-white': variant === 'green',
          'bg-[#F0A500] text-white': variant === 'orange',
          'bg-[#C0392B] text-white': variant === 'red',
          'bg-[#6B3D8F] text-white': variant === 'purple',
          'bg-gray-200 text-gray-700': variant === 'gray',
        },
        className,
      )}
    >
      {children}
    </span>
  )
}
