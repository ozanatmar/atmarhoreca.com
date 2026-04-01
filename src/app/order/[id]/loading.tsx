export default function OrderLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-4 px-4 py-3 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse shrink-0" />
            <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 flex flex-col gap-3">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-2">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-1" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${70 - j * 10}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
