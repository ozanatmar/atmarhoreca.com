export default function CheckoutLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Progress bar */}
      <div className="flex items-center mb-8 gap-0">
        {[1, 2, 3, 4].map((num, i) => (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-3 w-8 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
            {i < 3 && <div className="flex-1 h-0.5 mx-2 mb-4 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step title */}
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-4" />

      {/* Cart items */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-4 p-4 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-200 animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse w-full mt-2" />
      </div>
    </div>
  )
}
