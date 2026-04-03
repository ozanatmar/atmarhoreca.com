import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1A1A5E] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <Image
              src="/logo_white_no_bg.png"
              alt="Atmar Horeca"
              width={200}
              height={56}
              className="h-12 w-auto mb-3"
            />
            <p className="text-sm text-gray-300">
              Professional horeca equipment from Europe&apos;s best brands.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 text-sm">
            <div>
              <p className="font-semibold text-white mb-2">Legal</p>
              <ul className="space-y-1">
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Orders</p>
              <ul className="space-y-1">
                <li><Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Policy</Link></li>
                <li><Link href="/returns" className="text-gray-400 hover:text-white transition-colors">Returns &amp; Refunds</Link></li>
              </ul>
            </div>
          </div>

          <div className="text-sm text-gray-400 sm:text-right">
            <p>Atmar Horeca EOOD</p>
            <p>VAT: BG205062463</p>
            <p>Varna, Bulgaria</p>
            <p className="mt-2">
              &copy; {new Date().getFullYear()} atmarhoreca.com. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
