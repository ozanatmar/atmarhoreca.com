export default function AccountLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Page title */}
      <div className="h-8 w-36 bg-gray-200 rounded animate-pulse mb-8" />

      {/* Personal Details form skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Company Name */}
        <div className="flex flex-col gap-1">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* VAT Number */}
        <div className="flex flex-col gap-1">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Save button */}
        <div className="flex items-center mt-2">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Order History skeleton */}
      <section className="mt-12">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="bg-[#F5F5F5] grid grid-cols-4 px-4 py-3 gap-4">
            {['w-16', 'w-20', 'w-16', 'w-12'].map((w, i) => (
              <div key={i} className={`h-4 ${w} bg-gray-300 rounded animate-pulse ${i === 3 ? 'ml-auto' : ''}`} />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`grid grid-cols-4 px-4 py-3 gap-4 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'}`}>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
