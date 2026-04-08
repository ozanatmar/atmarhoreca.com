import type { Metadata } from 'next'
import PrivacyContactForm from './PrivacyContactForm'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Atmar Horeca collects, uses, and protects your personal data.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A1A5E] mb-3">{title}</h2>
      <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 2026</p>

      <Section title="1. Data Controller">
        <p>
          The data controller responsible for your personal data is:
        </p>
        <p className="mt-2">
          <strong>Atmar Horeca EOOD</strong><br />
          str. Manol Lazarov 67, 9022 Varna, Bulgaria<br />
          VAT: BG205062463<br />
          Email: <a href="mailto:privacy@atmarhoreca.com" className="text-[#6B3D8F] hover:underline">privacy@atmarhoreca.com</a>
        </p>
      </Section>

      <Section title="2. Data We Collect">
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Account data:</strong> full name, email address, and password (stored as a secure hash by Supabase).</li>
          <li><strong>Profile data:</strong> company name, phone number, and VAT number (optional, provided by you).</li>
          <li><strong>Address data:</strong> billing and shipping addresses.</li>
          <li><strong>Order data:</strong> items ordered, quantities, prices, order status, and transaction history.</li>
          <li><strong>Payment data:</strong> payments are processed by Stripe. We store payment status and reference IDs, but we never store your card details.</li>
          <li><strong>Technical data:</strong> IP address, browser type, device information, and pages visited — collected by Google Analytics only if you consent to analytics cookies.</li>
        </ul>
      </Section>

      <Section title="3. Legal Basis for Processing">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Contract performance (Art. 6(1)(b) GDPR):</strong> processing your orders, managing your account, and providing customer support.</li>
          <li><strong>Legal obligation (Art. 6(1)(c) GDPR):</strong> issuing invoices and retaining financial records as required by Bulgarian and EU law.</li>
          <li><strong>Consent (Art. 6(1)(a) GDPR):</strong> analytics cookies. You may withdraw consent at any time via the cookie banner or by contacting us.</li>
          <li><strong>Legitimate interest (Art. 6(1)(f) GDPR):</strong> fraud prevention and service security.</li>
        </ul>
      </Section>

      <Section title="4. How We Use Your Data">
        <ul className="list-disc pl-5 space-y-1">
          <li>Processing and fulfilling your orders.</li>
          <li>Sending transactional emails (order confirmations, shipping updates, invoices).</li>
          <li>Managing your account and customer profile.</li>
          <li>Responding to enquiries and support requests.</li>
          <li>Issuing VAT invoices and complying with tax obligations.</li>
          <li>Analysing site usage to improve our service (with your consent).</li>
        </ul>
      </Section>

      <Section title="5. Third-Party Processors">
        <p>We share your data only with the following trusted processors, each bound by data processing agreements:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Supabase Inc. (USA)</strong> — database and authentication hosting. Data is stored on EU servers (AWS eu-west-3). Covered by standard contractual clauses.</li>
          <li><strong>Stripe Inc. (USA)</strong> — payment processing. Covered by the EU–US Data Privacy Framework and standard contractual clauses.</li>
          <li><strong>Brevo SAS (France)</strong> — transactional email delivery. EU-based processor.</li>
          <li><strong>Google LLC (USA)</strong> — analytics (Google Analytics 4), only when you have accepted analytics cookies. Covered by the EU–US Data Privacy Framework.</li>
          <li><strong>Eurosender d.o.o. (Slovenia)</strong> — shipping logistics. Your name, address, and phone number are shared to arrange delivery.</li>
        </ul>
        <p className="mt-2">We do not sell your data or share it with any other third parties for marketing purposes.</p>
      </Section>

      <Section title="6. Data Retention">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account and profile data:</strong> retained as long as your account is active. You may request deletion at any time.</li>
          <li><strong>Order and invoice data:</strong> retained for 5 years as required by the Bulgarian Accountancy Act.</li>
          <li><strong>Analytics data:</strong> retained for 26 months as per Google Analytics default settings.</li>
        </ul>
      </Section>

      <Section title="7. Your Rights Under GDPR">
        <p>You have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Right of access:</strong> request a copy of the data we hold about you.</li>
          <li><strong>Right to rectification:</strong> request correction of inaccurate data.</li>
          <li><strong>Right to erasure:</strong> request deletion of your data, where no legal obligation requires us to retain it.</li>
          <li><strong>Right to restriction:</strong> request that we limit how we use your data in certain circumstances.</li>
          <li><strong>Right to data portability:</strong> receive your data in a structured, machine-readable format.</li>
          <li><strong>Right to object:</strong> object to processing based on legitimate interest.</li>
          <li><strong>Right to withdraw consent:</strong> withdraw analytics consent at any time without affecting prior processing.</li>
        </ul>
        <p className="mt-2">
          To exercise any of these rights, use the contact form at the bottom of this page. We will respond within 30 days.
        </p>
      </Section>

      <Section title="8. Supervisory Authority">
        <p>
          If you believe your data has been processed unlawfully, you have the right to lodge a complaint with the Bulgarian supervisory authority:
        </p>
        <p className="mt-2">
          <strong>Commission for Personal Data Protection (CPDP)</strong><br />
          2 Prof. Tsvetan Lazarov Blvd., 1592 Sofia, Bulgaria<br />
          <a href="https://www.cpdp.bg" target="_blank" rel="noopener noreferrer" className="text-[#6B3D8F] hover:underline">www.cpdp.bg</a>
        </p>
      </Section>

      <Section title="9. Cookies">
        <p>
          We use cookies for session management and, with your consent, for analytics. See our{' '}
          <a href="/cookie-policy" className="text-[#6B3D8F] hover:underline">Cookie Policy</a> for full details.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. The date at the top of this page reflects the most recent revision.
          Continued use of our site after changes constitutes acceptance of the updated policy.
        </p>
      </Section>

      <section className="mb-8" id="privacy-request">
        <h2 className="text-lg font-bold text-[#1A1A5E] mb-1">11. Submit a Privacy Request</h2>
        <p className="text-sm text-gray-500 mb-6">
          Use this form to exercise your rights under GDPR or to ask any privacy-related question. We will respond within 30 days.
        </p>
        <PrivacyContactForm />
      </section>
    </div>
  )
}
