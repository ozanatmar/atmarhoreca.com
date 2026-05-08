import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Atmar Horeca EOOD is a Bulgarian company connecting the hospitality industry with professional equipment from Europe\'s top brands, delivered across the EU.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-10">About Atmar Horeca</h1>

      <div className="space-y-10 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-[#1A1A5E] mb-3">Who We Are</h2>
          <p className="leading-relaxed">
            Atmar Horeca EOOD is a company registered in Varna, Bulgaria (VAT: BG205062463),
            specialising in professional equipment for the hospitality and food service industry.
            We source products directly from established European manufacturers and distributors,
            making premium horeca equipment accessible to businesses across the EU.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1A1A5E] mb-3">What We Offer</h2>
          <p className="leading-relaxed">
            Our catalogue covers a wide range of professional kitchen, pastry, and catering equipment —
            from chocolate and confectionery moulds to professional kitchen accessories and specialty tools.
            We work with industry-leading brands, giving you access to products that are often unavailable locally.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1A1A5E] mb-3">How We Work</h2>
          <p className="leading-relaxed">
            We operate on a B2B model with no minimum order quantities. Once you place an order,
            we coordinate directly with our suppliers across Italy, Spain, and other EU countries
            to arrange delivery. Products are shipped from supplier warehouses and delivered to
            your door anywhere in the EU mainland.
          </p>
          <p className="leading-relaxed mt-3">
            Some products are dispatched within a few business days; others, particularly large or
            specialised items, may require a lead time which we communicate clearly on each product page.
            We handle all logistics so you don&apos;t have to.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1A1A5E] mb-3">B2B Invoicing</h2>
          <p className="leading-relaxed">
            All orders are issued with a proper VAT invoice. Prices on our site are displayed
            excluding VAT, which is calculated and shown at checkout. EU businesses with a valid,
            VIES-verified VAT number are automatically charged 0% VAT at checkout.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1A1A5E] mb-3">Get in Touch</h2>
          <p className="leading-relaxed">
            For questions, quotes, or anything else, reach us at{' '}
            <a href="mailto:info@atmarhoreca.com" className="text-[#6B3D8F] hover:underline">
              info@atmarhoreca.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link href="/search" className="text-sm text-[#6B3D8F] hover:underline">
          ← Browse our products
        </Link>
      </div>
    </div>
  )
}
