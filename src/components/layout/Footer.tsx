import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#1A1A5E] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
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
          <div className="text-sm text-gray-400 text-center sm:text-right">
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
