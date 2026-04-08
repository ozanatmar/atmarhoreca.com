import type { Metadata } from 'next'
import ReturnForm from './ReturnForm'

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'Atmar Horeca return and refund conditions for B2C and B2B customers.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A1A5E] mb-3">{title}</h2>
      <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  )
}

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-2">Return &amp; Refund Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 2026</p>

      <Section title="1. Definitions">
        <p>
          <strong>Consumer (B2C):</strong> a customer who leaves both the company name and VAT number fields empty at checkout.
        </p>
        <p>
          <strong>Business customer (B2B):</strong> a customer who provides a company name and/or a VAT number at checkout. This applies regardless of whether the purchaser is a registered business.
        </p>
        <p>
          By completing a purchase, you confirm that the information provided at checkout accurately reflects your status. Providing a company name or VAT number constitutes a declaration that you are purchasing as a business and waives your consumer return rights.
        </p>
      </Section>

      <Section title="2. Consumer (B2C) Right of Withdrawal">
        <p>
          If you are a consumer, you have the right to withdraw from your purchase within <strong>14 calendar days</strong> of the date you receive your order, without giving any reason, in accordance with EU Directive 2011/83/EU.
        </p>
        <p className="font-semibold text-gray-800 mt-3">Conditions — all of the following must be met:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>The item must be <strong>completely unused</strong> — not installed, operated, assembled, or used in any way beyond what is necessary to assess its nature, characteristics, and functioning.</li>
          <li>The item must be in its <strong>original, undamaged packaging</strong>, sealed where applicable.</li>
          <li>All original <strong>accessories, manuals, and documentation</strong> must be included.</li>
          <li>The item must show <strong>no signs of use, wear, scratches, or odours</strong>.</li>
          <li>Items that show evidence of having been used for any purpose — including temporarily for an event, demonstration, or trial — will not be accepted for return and will be returned to the sender at their expense.</li>
        </ul>
        <p className="mt-3">
          We reserve the right to refuse a return or apply a deduction from the refund if the item is returned in a condition that reduces its value.
        </p>

        <p className="font-semibold text-gray-800 mt-3">Exclusions — the right of withdrawal does not apply to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Goods made to specification or clearly personalised (custom orders).</li>
          <li>Goods that have been installed or permanently connected to infrastructure.</li>
          <li>Goods returned from outside the European Union.</li>
        </ul>

        <p className="font-semibold text-gray-800 mt-3">How to return:</p>
        <ol className="list-decimal pl-5 space-y-1 mt-1">
          <li>Submit the return request form below before the 14-day deadline.</li>
          <li>We will confirm your request and provide return instructions within 2 business days.</li>
          <li>Pack the item securely in its original packaging and ship it back using a tracked service.</li>
          <li>Return shipping costs are at your expense for change-of-mind returns.</li>
        </ol>

        <p className="font-semibold text-gray-800 mt-3">Refund:</p>
        <p>
          Once we receive and inspect the returned item, we will refund the <strong>product price only</strong>. Original outbound shipping costs are non-refundable for change-of-mind returns.
          Refunds are issued to the original payment method within 14 days of receiving the returned goods.
        </p>
      </Section>

      <Section title="3. Damaged or Defective Items (B2C and B2B)">
        <p>
          If your order arrives damaged or defective, you must <strong>report the issue by the next business day after delivery</strong>. Late reports will not be accepted.
        </p>

        <p className="font-semibold text-gray-800 mt-3">Required steps on delivery:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Inspect the packaging and goods upon delivery in the presence of the carrier.</li>
          <li>If damage is visible, <strong>note it on the carrier&apos;s delivery document</strong> before signing. This protocol is required to support any claim.</li>
          <li>Photograph both the damaged packaging and the damaged item.</li>
          <li>Submit the return request form below with your order number, photos, and a description of the damage.</li>
        </ul>

        <p className="mt-2">
          For confirmed damaged or defective items, we will arrange return collection at our expense and either replace the item or issue a full refund including both-way shipping costs, depending on stock availability and your preference.
        </p>
        <p className="mt-2">
          Claims reported after the next business day following delivery, or without the required carrier protocol, may not be eligible for compensation. Damage claims are handled jointly with the carrier and the outcome may depend on the carrier&apos;s investigation.
        </p>
      </Section>

      <Section title="4. B2B Returns">
        <p>
          Business customers do not have a statutory right of withdrawal. Returns are only accepted for items that arrived damaged or defective, subject to the conditions in Section 3 above.
          No other returns are accepted from business customers regardless of reason.
        </p>
      </Section>

      <Section title="5. International Orders">
        <p>
          Returns are only accepted from customers within the European Union. We do not accept returns from addresses outside the EU.
        </p>
      </Section>

      <Section title="6. Warranty">
        <p>
          Consumer customers are entitled to a 2-year statutory guarantee under EU Directive 1999/44/EC as transposed into Bulgarian law. This guarantee covers manufacturing defects present at the time of delivery.
        </p>
        <p>
          The statutory guarantee does not cover defects caused by improper use, failure to follow the manufacturer&apos;s maintenance and cleaning instructions, normal wear and tear, or damage caused by use in conditions beyond the product&apos;s rated specifications. Professional horeca equipment requires regular maintenance and proper operation to remain functional — damage arising from neglect, improper cleaning, or misuse is not covered.
        </p>
        <p>
          No additional commercial warranty is provided by Atmar Horeca beyond the statutory guarantee. Manufacturer warranties, where offered, are separate and governed by the manufacturer&apos;s own terms.
        </p>
      </Section>

      <section className="mb-8" id="return-form">
        <h2 className="text-lg font-bold text-[#1A1A5E] mb-1">7. Submit a Return Request</h2>
        <p className="text-sm text-gray-500 mb-6">
          Fill in the form below. We will review your request and respond within 2 business days.
        </p>
        <ReturnForm />
      </section>
    </div>
  )
}
