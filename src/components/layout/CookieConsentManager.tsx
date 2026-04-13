'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import Link from 'next/link'

type ConsentState = {
  analytics: boolean
}

export default function CookieConsentManager() {
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [analyticsChecked, setAnalyticsChecked] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cookie_consent_v2')
      if (stored) setConsent(JSON.parse(stored) as ConsentState)
    } catch {}
  }, [])

  function saveConsent(state: ConsentState) {
    localStorage.setItem('cookie_consent_v2', JSON.stringify(state))
    setConsent(state)
  }

  return (
    <>
      {consent?.analytics && (
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A5E] border-t border-white/10 shadow-xl">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-white mb-1">We use cookies</p>
                <p className="text-sm text-gray-300">
                  We use cookies to improve your experience and analyse site usage.{' '}
                  <Link href="/cookie-policy" className="underline text-white hover:text-gray-200">
                    Cookie Policy
                  </Link>
                </p>
              </div>

              {showDetails && (
                <div className="flex flex-col gap-3 border border-white/20 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Necessary</p>
                      <p className="text-xs text-gray-400 mt-0.5">Required for the site to function. Cannot be disabled.</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mt-1">Always active</span>
                  </div>
                  <div className="border-t border-white/10" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Analytics</p>
                      <p className="text-xs text-gray-400 mt-0.5">Helps us understand how visitors use the site (Google Analytics).</p>
                    </div>
                    <button
                      onClick={() => setAnalyticsChecked(v => !v)}
                      className={`relative shrink-0 mt-1 w-10 h-5 rounded-full transition-colors ${
                        analyticsChecked ? 'bg-[#6B3D8F]' : 'bg-gray-600'
                      }`}
                      aria-label={analyticsChecked ? 'Disable analytics cookies' : 'Enable analytics cookies'}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        analyticsChecked ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => saveConsent({ analytics: false })}
                  className="text-sm px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Reject All
                </button>
                {showDetails ? (
                  <button
                    onClick={() => saveConsent({ analytics: analyticsChecked })}
                    className="text-sm px-4 py-2 border border-white/40 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Save Preferences
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-sm px-4 py-2 border border-white/40 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Manage Preferences
                  </button>
                )}
                <button
                  onClick={() => saveConsent({ analytics: true })}
                  className="text-sm px-4 py-2 bg-[#6B3D8F] text-white rounded-lg hover:bg-[#5a3278] transition-colors font-semibold"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
