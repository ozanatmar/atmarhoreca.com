import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-[#7AB648] text-white hover:bg-[#669e3e]': variant === 'primary',
          'bg-[#6B3D8F] text-white hover:bg-[#5a3278]': variant === 'secondary',
          'bg-[#C0392B] text-white hover:bg-[#a93226]': variant === 'danger',
          'border border-[#6B3D8F] text-[#6B3D8F] hover:bg-[#6B3D8F] hover:text-white':
            variant === 'outline',
        },
        {
          'text-sm px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-base px-6 py-3': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
