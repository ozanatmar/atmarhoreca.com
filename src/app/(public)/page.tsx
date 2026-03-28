import { Globe, FileText, Package, Search } from 'lucide-react'
import SearchForm from './SearchForm'

export default function LandingPage() {
  return (
    <div>
      {/* Hero / Search */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A5E] mb-4">
            Professional Horeca Equipment
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Top European brands, delivered across the EU. B2B invoicing, no minimums.
          </p>
          <SearchForm />
        </div>
      </section>

      {/* Value propositions */}
      <section className="bg-[#F5F5F5] py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <ValueCard
            icon={<Globe className="w-8 h-8 text-[#6B3D8F]" />}
            title="European Brands"
            description="Access professional equipment from Italy, Spain, and across Europe — brands not easily available locally."
          />
          <ValueCard
            icon={<Package className="w-8 h-8 text-[#F0A500]" />}
            title="EU-Wide Delivery"
            description="We handle shipping end-to-end to every EU country and beyond. Just order and we take care of the rest."
          />
          <ValueCard
            icon={<FileText className="w-8 h-8 text-[#7AB648]" />}
            title="B2B Friendly"
            description="Proper VAT invoicing for businesses, including EU reverse charge for registered companies."
          />
          <ValueCard
            icon={<Search className="w-8 h-8 text-[#C0392B]" />}
            title="No Minimums"
            description="Order exactly what you need — one item or one hundred. No minimum order quantities."
          />
        </div>
      </section>
    </div>
  )
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-3">
      <div>{icon}</div>
      <h3 className="text-lg font-bold text-[#1A1A5E]">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
