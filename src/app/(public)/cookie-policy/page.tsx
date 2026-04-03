import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Atmar Horeca uses cookies and how to manage your preferences.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A1A5E] mb-3">{title}</h2>
      <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  )
}

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-2">Cookie Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 2026</p>

      <Section title="1. What Are Cookies">
        <p>
          Cookies are small text files stored on your device when you visit a website. They allow the site to
          remember information about your visit, such as your login session or preferences. Some cookies are
          essential for the site to function; others are optional and require your consent.
        </p>
      </Section>

      <Section title="2. Cookies We Use">
        <p className="font-semibold text-gray-800">Strictly Necessary Cookies</p>
        <p>These cookies are required for the website to function and cannot be disabled.</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Cookie</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Provider</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Purpose</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-3 py-2 font-mono">sb-*</td>
                <td className="px-3 py-2">Supabase</td>
                <td className="px-3 py-2">Maintains your login session so you stay signed in.</td>
                <td className="px-3 py-2">Session / 1 week</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="font-semibold text-gray-800 mt-6">Analytics Cookies (Consent Required)</p>
        <p>These cookies are only set if you click <strong>Accept</strong> on the cookie banner. They help us understand how visitors use our site so we can improve it.</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Cookie</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Provider</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Purpose</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-3 py-2 font-mono">_ga</td>
                <td className="px-3 py-2">Google Analytics</td>
                <td className="px-3 py-2">Distinguishes unique users by assigning a randomly generated number as a client identifier.</td>
                <td className="px-3 py-2">2 years</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="px-3 py-2 font-mono">_ga_*</td>
                <td className="px-3 py-2">Google Analytics</td>
                <td className="px-3 py-2">Stores and counts page views for the GA4 property (G-2TV9ZD1BF4).</td>
                <td className="px-3 py-2">2 years</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-gray-500">
          Google Analytics data is processed by Google LLC (USA) under the EU–US Data Privacy Framework.
          For more information, see{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#6B3D8F] hover:underline">
            Google&apos;s Privacy Policy
          </a>.
        </p>
      </Section>

      <Section title="3. No Marketing Cookies">
        <p>
          We do not use advertising, tracking, or social media cookies. No data from this site is shared
          with advertising networks or used for targeted marketing.
        </p>
      </Section>

      <Section title="4. Managing Your Preferences">
        <p>
          When you first visit our site, a banner will ask for your consent to analytics cookies.
          Your choice is stored in your browser&apos;s local storage.
        </p>
        <p>
          To change your preference at any time, clear your browser&apos;s local storage for this site
          (via your browser&apos;s developer tools or privacy settings) and reload the page — the banner
          will appear again.
        </p>
        <p>
          You can also disable cookies entirely through your browser settings. Note that disabling
          strictly necessary cookies will prevent you from logging in.
        </p>
      </Section>

      <Section title="5. Changes to This Policy">
        <p>
          We may update this Cookie Policy as our site evolves or as legal requirements change.
          The date at the top of this page reflects the most recent revision.
        </p>
      </Section>

      <Section title="6. Contact">
        <p>
          For questions about our use of cookies, contact us at{' '}
          <a href="mailto:privacy@atmarhoreca.com" className="text-[#6B3D8F] hover:underline">
            privacy@atmarhoreca.com
          </a>.
        </p>
      </Section>
    </div>
  )
}
