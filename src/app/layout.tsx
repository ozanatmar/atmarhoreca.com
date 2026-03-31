import type { Metadata } from 'next'
import { Inter, Nunito } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Atmar Horeca — Professional Equipment for Hotels, Restaurants & Cafes',
    template: '%s | Atmar Horeca',
  },
  description:
    'Professional horeca equipment from top European brands. EU-wide delivery, B2B VAT invoicing, no minimums.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://atmarhoreca.com'),
robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  )
}
