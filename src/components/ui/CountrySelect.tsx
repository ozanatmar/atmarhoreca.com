import { cn } from '@/lib/utils'
import type { SelectHTMLAttributes } from 'react'
import { EU_COUNTRIES, OTHER_COUNTRIES } from '@/lib/countries'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export default function CountrySelect({ label, error, className, id, ...props }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#1A1A5E]">
          {label}
          {props.required && <span className="text-[#C0392B] ml-1">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B3D8F] transition',
          error ? 'border-[#C0392B]' : 'border-gray-300',
          className,
        )}
        {...props}
      >
        <option value="">Select country...</option>
        <optgroup label="EU Countries — Free Delivery">
          {EU_COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </optgroup>
        <optgroup label="Other Countries — Shipping Quote Required">
          {OTHER_COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </optgroup>
      </select>
      {error && <p className="text-xs text-[#C0392B]">{error}</p>}
    </div>
  )
}
