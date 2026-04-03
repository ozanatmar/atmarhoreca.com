'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import Link from 'next/link'

export default function CookieConsentManager() {
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent') as 'accepted' | 'rejected' | null
    setConsent(stored)
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    setConsent('accepted')
  }

  function reject() {
    localStorage.setItem('cookie_consent', 'rejected')
    setConsent('rejected')
  }

  return (
    <>
      {consent === 'accepted' && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-2TV9ZD1BF4"
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2TV9ZD1BF4');
          `}</Script>
        </>
      )}

      {consent === null && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A5E] border-t border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-300 text-center sm:text-left">
              We use cookies to analyse site usage and improve your experience.{' '}
              <Link href="/cookie-policy" className="underline text-white hover:text-gray-200">
                Cookie Policy
              </Link>
            </p>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={reject}
                className="text-sm px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={accept}
                className="text-sm px-4 py-2 bg-[#6B3D8F] text-white rounded-lg hover:bg-[#5a3278] transition-colors font-semibold"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
