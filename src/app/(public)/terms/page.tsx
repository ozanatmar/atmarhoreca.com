import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions governing the use of atmarhoreca.com and the purchase of products.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A1A5E] mb-3">{title}</h2>
      <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 2026</p>

      <Section title="1. About Us">
        <p>
          atmarhoreca.com is operated by <strong>Atmar Horeca EOOD</strong>, a company incorporated under
          Bulgarian law, registered at str. Manol Lazarov 67, 9022 Varna, Bulgaria (VAT: BG205062463).
        </p>
        <p>
          By using this website or placing an order, you agree to these Terms &amp; Conditions in full.
          If you do not agree, please do not use our site.
        </p>
      </Section>

      <Section title="2. Who Can Buy">
        <p>
          Our products are available to both business customers (B2B) and consumers (B2C) within the
          European Union and, on a case-by-case basis, internationally.
        </p>
        <p>
          <strong>Business customers</strong> are persons or entities purchasing in the course of a trade,
          business, or profession. By checking out without indicating personal consumer use, or by
          providing a VAT number, you confirm you are acting as a business customer.
        </p>
        <p>
          <strong>Consumers</strong> are natural persons purchasing for personal, non-commercial use.
          Consumers have additional rights under EU consumer protection law, as set out in these terms
          and our Return &amp; Refund Policy.
        </p>
        <p>
          You must be at least 18 years old to place an order.
        </p>
      </Section>

      <Section title="3. Products and Pricing">
        <p>
          All prices are displayed in Euros (EUR). Applicable VAT is shown at checkout based on your
          delivery country and customer type (B2B with valid EU VAT number may qualify for 0% VAT
          under reverse charge).
        </p>
        <p>
          We make every effort to ensure product descriptions and prices are accurate. In the event of
          a pricing error, we reserve the right to cancel the order and provide a full refund. We will
          notify you promptly in such cases.
        </p>
        <p>
          Product images are for illustrative purposes. Minor variations in colour or appearance may
          occur due to photography and screen calibration.
        </p>
      </Section>

      <Section title="4. Order Process">
        <p>
          Placing an order constitutes an offer to purchase. Your order is accepted when we send you
          an order confirmation email. For quote-based orders (Type B), acceptance occurs when we send
          you a proforma invoice.
        </p>
        <p>
          We reserve the right to refuse or cancel any order at our discretion, including in cases of
          suspected fraud, pricing errors, or stock unavailability. If we cancel your order after payment,
          a full refund will be issued within 5 business days.
        </p>
      </Section>

      <Section title="5. Payment">
        <p>The following payment methods are accepted:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li><strong>Card payment:</strong> processed securely via Stripe. Accepted cards include Visa, Mastercard, and American Express.</li>
          <li><strong>Bank transfer:</strong> available for quote-based orders. Payment details are provided on the proforma invoice.</li>
        </ul>
        <p>
          Ownership of goods passes to you only once full payment has been received and confirmed.
        </p>
      </Section>

      <Section title="6. Delivery">
        <p>
          Delivery is subject to our{' '}
          <a href="/shipping" className="text-[#6B3D8F] hover:underline">Shipping Policy</a>,
          which forms part of these Terms &amp; Conditions. Risk of loss and damage to goods passes to
          you upon delivery.
        </p>
        <p>
          Delivery dates shown at checkout and on your order page are estimates. We are not liable for
          delays caused by carriers, customs, or circumstances beyond our control.
        </p>
      </Section>

      <Section title="7. Returns and Refunds">
        <p>
          Returns and refunds are governed by our{' '}
          <a href="/returns" className="text-[#6B3D8F] hover:underline">Return &amp; Refund Policy</a>,
          which forms part of these Terms &amp; Conditions.
        </p>
        <p>
          Consumer customers have a 14-day right of withdrawal under EU law. Business customers have
          no right of return except for damaged or defective items.
        </p>
      </Section>

      <Section title="8. Warranty">
        <p>
          Consumers are entitled to the 2-year statutory guarantee under Bulgarian and EU law for
          manufacturing defects. This guarantee does not cover damage caused by improper use,
          inadequate maintenance, or normal wear and tear.
        </p>
        <p>
          The equipment sold on atmarhoreca.com is primarily designed for professional commercial
          environments. It requires regular maintenance and proper operation in accordance with
          manufacturer guidelines. Defects arising from neglect, misuse, failure to follow
          maintenance schedules, or use outside the product&apos;s rated specifications are not
          covered by the statutory guarantee.
        </p>
        <p>
          No additional commercial warranty is offered by Atmar Horeca beyond what is required by law.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          To the fullest extent permitted by applicable law, Atmar Horeca&apos;s liability for any claim
          arising from the purchase of goods shall not exceed the total amount paid for the relevant order.
        </p>
        <p>
          We are not liable for indirect, consequential, or economic losses, including loss of profit,
          loss of business, or loss of data, whether arising from breach of contract, negligence, or otherwise.
        </p>
        <p>
          Nothing in these terms excludes or limits liability for death or personal injury caused by
          our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot
          be excluded by law.
        </p>
      </Section>

      <Section title="10. Intellectual Property">
        <p>
          All content on this website — including text, images, logos, and product descriptions — is
          the property of Atmar Horeca EOOD or its licensors and is protected by copyright and
          intellectual property law. You may not reproduce, distribute, or use any content without
          our prior written consent.
        </p>
      </Section>

      <Section title="11. Use of the Website">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Use the site for any unlawful purpose or in violation of applicable law.</li>
          <li>Attempt to gain unauthorised access to any part of the site or its infrastructure.</li>
          <li>Submit false or misleading information when creating an account or placing an order.</li>
          <li>Use automated tools to scrape, crawl, or harvest data from the site without our consent.</li>
        </ul>
      </Section>

      <Section title="12. Governing Law and Jurisdiction">
        <p>
          These Terms &amp; Conditions are governed by the laws of the Republic of Bulgaria. Any disputes
          arising from or in connection with these terms or any purchase made through our site shall
          be subject to the exclusive jurisdiction of the competent courts of Varna, Bulgaria.
        </p>
        <p>
          Consumer customers in other EU member states retain the right to bring proceedings in their
          country of residence where required by local consumer protection law.
        </p>
      </Section>

      <Section title="13. Changes to These Terms">
        <p>
          We may update these Terms &amp; Conditions from time to time. The date at the top of this page
          reflects the most recent revision. Continued use of the site after changes are posted
          constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          For any questions regarding these terms:{' '}
          <a href="mailto:privacy@atmarhoreca.com" className="text-[#6B3D8F] hover:underline">
            privacy@atmarhoreca.com
          </a>
        </p>
      </Section>
    </div>
  )
}
