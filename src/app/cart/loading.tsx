export default function CartLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="h-8 w-36 bg-gray-200 rounded animate-pulse mb-6" />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-4 p-4 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-200 animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-3 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse w-full" />
      </div>
    </div>
  )
}
