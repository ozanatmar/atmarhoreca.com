import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Delivery times, carriers, and shipping conditions for Atmar Horeca orders.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A1A5E] mb-3">{title}</h2>
      <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  )
}

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1A1A5E] mb-2">Shipping Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 2026</p>

      <Section title="1. Where We Ship">
        <p>
          We ship to all EU member states with pre-calculated shipping rates available at checkout.
          We also ship to non-EU countries — for international orders outside the EU, please contact us
          for a shipping quote before placing your order.
        </p>
        <p>
          All delivery estimates are for business days (Monday–Friday, excluding public holidays).
        </p>
      </Section>

      <Section title="2. Order Processing">
        <p>
          Orders are processed once payment is confirmed (for direct payment orders) or once your order
          has been approved and invoiced (for quote-based orders).
        </p>
        <p>
          Processing and handling times depend on the brand and product. Estimated dispatch and delivery
          dates are shown on your order page after your order is confirmed. These are estimates based on
          typical supplier lead times and carrier transit times, and may vary.
        </p>
      </Section>

      <Section title="3. Delivery Arrangement">
        <p>
          All deliveries are arranged exclusively by Atmar Horeca. We do not offer collection in person
          and customers may not arrange their own courier or freight service to collect goods.
          There is no facility for pickup from our office, warehouse, or any other location.
        </p>
        <p>
          Orders are shipped only to the delivery address provided at checkout.
        </p>
      </Section>

      <Section title="4. Carriers">
        <p>
          We ship via <strong>Eurosender</strong>, a logistics platform that selects the most suitable
          carrier for each shipment — typically <strong>FedEx</strong> or <strong>DHL</strong>.
          The specific carrier is confirmed at the time of dispatch.
        </p>
        <p>
          Tracking information is provided once your order has been dispatched.
        </p>
      </Section>

      <Section title="5. Delivery Times">
        <p>Estimated transit times after dispatch:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li><strong>Bulgaria:</strong> 1–2 business days</li>
          <li><strong>Central Europe (DE, AT, CZ, PL, HU, etc.):</strong> 2–4 business days</li>
          <li><strong>Western Europe (FR, NL, BE, IT, ES, etc.):</strong> 3–5 business days</li>
          <li><strong>Northern Europe (SE, FI, DK, NO, etc.):</strong> 3–6 business days</li>
          <li><strong>Non-EU countries:</strong> 5–10 business days (varies by destination and customs)</li>
        </ul>
        <p className="mt-2">
          These are estimates only. Atmar Horeca is not liable for delays caused by carrier operations,
          customs processing, adverse weather, or other circumstances beyond our control.
        </p>
      </Section>

      <Section title="6. Shipping Costs">
        <p>
          <strong>Shipping is free to all EU mainland destinations</strong>, subject to the minimum
          order requirements per brand shown at checkout.
        </p>
        <p>
          For non-EU destinations, shipping costs are calculated individually and will be confirmed
          before your order is dispatched. You will have the option to accept the shipping cost or
          cancel the order for a full refund.
        </p>
        <p>
          <strong>Pre-set free shipping applies to mainland destinations only.</strong> Deliveries to
          islands (including but not limited to Greek islands, the Canary Islands, the Balearic Islands,
          and other offshore territories) may incur additional carrier surcharges. If your delivery
          address is on an island, we will contact you before dispatch to confirm any additional
          cost. You will have the option to accept the surcharge or cancel the order for a full refund.
        </p>
      </Section>

      <Section title="7. Customs and Import Duties">
        <p>
          For deliveries within the EU, no customs duties apply. All prices include VAT where applicable,
          or are shown with the applicable VAT rate at checkout.
        </p>
        <p>
          For deliveries outside the EU, the recipient is responsible for any import duties, taxes,
          or customs clearance fees charged by the destination country. Atmar Horeca has no control
          over these charges and cannot predict their amount.
        </p>
      </Section>

      <Section title="8. Damaged or Lost Shipments">
        <p>
          Risk of loss and damage passes to you upon delivery. If your order arrives damaged or appears
          to have been lost in transit, follow these steps:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            <strong>Damaged on delivery:</strong> inspect the goods in the presence of the carrier and
            note any visible damage on the carrier&apos;s delivery document before signing. Photograph
            both the outer packaging and the damaged item. Report to us at{' '}
            <a href="mailto:returns@atmarhoreca.com" className="text-[#6B3D8F] hover:underline">
              returns@atmarhoreca.com
            </a>{' '}
            by the <strong>next business day after delivery</strong>, including photos and the carrier
            protocol.
          </li>
          <li>
            <strong>Lost shipment:</strong> if your order has not arrived by the estimated delivery date,
            contact us and we will open an investigation with the carrier on your behalf.
          </li>
        </ul>
        <p className="mt-2">
          We handle damage and loss claims directly with the carrier. The outcome of a claim depends on
          the carrier&apos;s investigation and may take time to resolve. We will keep you informed throughout
          the process.
        </p>
        <p className="mt-2">
          Claims for damaged goods reported after the next business day following delivery, or without a
          signed carrier protocol noting the damage, may not be eligible for compensation.
        </p>
      </Section>

      <Section title="9. Delivery Address">
        <p>
          Please ensure your delivery address is accurate at the time of ordering. We are not responsible
          for failed deliveries due to incorrect or incomplete addresses. Re-delivery or address correction
          fees charged by the carrier will be passed on to the customer.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For shipping enquiries:{' '}
          <a href="mailto:returns@atmarhoreca.com" className="text-[#6B3D8F] hover:underline">
            returns@atmarhoreca.com
          </a>
        </p>
      </Section>
    </div>
  )
}
