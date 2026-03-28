'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'

export default function SearchForm() {
  const [searching, setSearching] = useState(false)
  const router = useRouter()

  return (
    <form
      className="flex items-center gap-2 max-w-lg mx-auto"
      onSubmit={(e) => {
        e.preventDefault()
        const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
        if (!q) return
        setSearching(true)
        router.push(`/search?q=${encodeURIComponent(q)}`)
      }}
    >
      <div className="relative flex-1">
        <input
          type="search"
          name="q"
          placeholder="Search for equipment, tools, molds..."
          required
          className="w-full py-3 pl-5 pr-12 rounded-xl border border-gray-300 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-[#6B3D8F] shadow-sm"
          onChange={() => setSearching(false)}
        />
      </div>
      <button
        type="submit"
        className="bg-[#7AB648] hover:bg-[#669e3e] text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
      >
        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Search
      </button>
    </form>
  )
}
