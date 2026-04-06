export default function CountryFlag({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} rounded-sm ${className ?? ''}`}
      title={code}
    />
  )
}
