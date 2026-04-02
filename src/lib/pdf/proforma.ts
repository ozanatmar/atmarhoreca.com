import PDFDocument from 'pdfkit'

const PURPLE = '#6B3D8F'
const DARK_BLUE = '#1A1A5E'
const GRAY = '#555555'
const LIGHT_GRAY = '#F5F5F5'
const LINE_GRAY = '#DDDDDD'

interface ProformaItem {
  name: string
  qty: number
  unit_price: number
}

interface BillingAddress {
  street: string
  city: string
  postal_code: string
  country_code: string
}

export interface ProformaPDFData {
  orderId: string
  // Buyer
  buyer_name: string
  buyer_company?: string | null
  buyer_vat?: string | null
  buyer_address?: BillingAddress | null
  // Items
  items: ProformaItem[]
  // Financials
  subtotal: number
  shipping_cost: number
  vat_rate: number
  vat_amount: number
  total: number
  // Payment
  stripe_payment_link_url: string
  iban: string
  bic: string
  account_holder: string
}

export async function generateProformaPDF(data: ProformaPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const shortId = data.orderId.slice(0, 8).toUpperCase()
    const pageWidth = doc.page.width - 100 // 50 margin each side
    const col2 = 310

    // ── Header bar ──────────────────────────────────────────────
    doc.rect(50, 50, pageWidth, 55).fill(PURPLE)
    doc.fillColor('white').font('Helvetica-Bold').fontSize(20).text('PROFORMA INVOICE', 65, 65)
    doc.fontSize(9).text(
      `Order #${shortId}   ·   ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      65, 88
    )

    // ── Seller / Buyer columns ───────────────────────────────────
    let leftY = 128
    let rightY = 128

    doc.fillColor(DARK_BLUE).font('Helvetica-Bold').fontSize(8).text('FROM', 50, leftY)
    leftY += 13
    doc.fontSize(10).text('Atmar Horeca EOOD', 50, leftY)
    leftY += 14
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
    doc.text('VAT: BG205062463', 50, leftY); leftY += 11
    doc.text('Varna, Bulgaria', 50, leftY); leftY += 11
    doc.text('orders@atmarhoreca.com', 50, leftY); leftY += 11
    doc.text('atmarhoreca.com', 50, leftY)

    doc.fillColor(DARK_BLUE).font('Helvetica-Bold').fontSize(8).text('BILL TO', col2, rightY)
    rightY += 13
    doc.fontSize(10).text(data.buyer_name, col2, rightY)
    rightY += 14
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
    if (data.buyer_company) { doc.text(data.buyer_company, col2, rightY); rightY += 11 }
    if (data.buyer_vat) { doc.text(`VAT: ${data.buyer_vat}`, col2, rightY); rightY += 11 }
    if (data.buyer_address) {
      doc.text(data.buyer_address.street, col2, rightY); rightY += 11
      doc.text(`${data.buyer_address.postal_code} ${data.buyer_address.city}`, col2, rightY); rightY += 11
      doc.text(data.buyer_address.country_code, col2, rightY); rightY += 11
    }

    // ── Items table ──────────────────────────────────────────────
    let y = Math.max(leftY, rightY) + 24

    // Table header
    doc.rect(50, y, pageWidth, 18).fill(DARK_BLUE)
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8)
    doc.text('PRODUCT', 56, y + 5, { width: 260 })
    doc.text('QTY', 318, y + 5, { width: 40, align: 'right' })
    doc.text('UNIT PRICE', 362, y + 5, { width: 80, align: 'right' })
    doc.text('TOTAL', 446, y + 5, { width: 98, align: 'right' })
    y += 18

    // Table rows
    data.items.forEach((item, i) => {
      // Auto page break
      if (y > doc.page.height - 200) {
        doc.addPage()
        y = 50
      }
      if (i % 2 === 0) {
        doc.rect(50, y, pageWidth, 18).fill(LIGHT_GRAY)
      }
      doc.fillColor('#333333').font('Helvetica').fontSize(8.5)
      // Truncate long names
      const maxNameLen = 55
      const name = item.name.length > maxNameLen ? item.name.slice(0, maxNameLen - 1) + '…' : item.name
      doc.text(name, 56, y + 5, { width: 260 })
      doc.text(String(item.qty), 318, y + 5, { width: 40, align: 'right' })
      doc.text(`€${Number(item.unit_price).toFixed(2)}`, 362, y + 5, { width: 80, align: 'right' })
      doc.text(`€${(Number(item.unit_price) * item.qty).toFixed(2)}`, 446, y + 5, { width: 98, align: 'right' })
      y += 18
    })

    // ── Totals block ─────────────────────────────────────────────
    y += 12
    const totalsX = 360

    const addTotalRow = (label: string, value: string, bold = false, color = GRAY) => {
      doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
      doc.text(label, totalsX, y, { width: 120 })
      doc.text(value, totalsX + 124, y, { width: 60, align: 'right' })
      y += 13
    }

    doc.moveTo(totalsX, y).lineTo(544, y).strokeColor(LINE_GRAY).lineWidth(0.5).stroke()
    y += 6
    addTotalRow('Subtotal (excl. VAT)', `€${Number(data.subtotal).toFixed(2)}`)
    addTotalRow('Shipping', `€${Number(data.shipping_cost).toFixed(2)}`)
    if (data.vat_rate > 0) {
      addTotalRow(`VAT (${(data.vat_rate * 100).toFixed(0)}%)`, `€${Number(data.vat_amount).toFixed(2)}`)
    } else {
      addTotalRow('VAT', '0% (reverse charge)')
    }
    y += 3
    doc.moveTo(totalsX, y).lineTo(544, y).strokeColor(DARK_BLUE).lineWidth(1).stroke()
    y += 6
    doc.fillColor(DARK_BLUE).font('Helvetica-Bold').fontSize(10)
    doc.text('TOTAL', totalsX, y, { width: 120 })
    doc.text(`€${Number(data.total).toFixed(2)}`, totalsX + 124, y, { width: 60, align: 'right' })

    // ── Payment details ──────────────────────────────────────────
    y += 36
    if (y > doc.page.height - 160) { doc.addPage(); y = 50 }

    doc.rect(50, y, pageWidth, 18).fill(PURPLE)
    doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text('PAYMENT DETAILS', 56, y + 5)
    y += 26

    // Bank transfer
    doc.fillColor(DARK_BLUE).font('Helvetica-Bold').fontSize(9).text('Bank Transfer', 50, y)
    y += 14
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
    const bankDetails = [
      ['IBAN', data.iban || '—'],
      ['BIC / SWIFT', data.bic || '—'],
      ['Account Holder', data.account_holder],
      ['Payment Reference', `Order #${shortId}  (please include this reference)`],
    ]
    bankDetails.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fillColor(DARK_BLUE).text(`${label}: `, 50, y, { continued: true, width: 460 })
      doc.font('Helvetica').fillColor(GRAY).text(value)
      y += 13
    })

    // Online payment
    y += 8
    doc.fillColor(DARK_BLUE).font('Helvetica-Bold').fontSize(9).text('Pay by Card (Online)', 50, y)
    y += 14
    doc.fillColor(PURPLE).font('Helvetica').fontSize(8.5).text(data.stripe_payment_link_url, 50, y, {
      link: data.stripe_payment_link_url,
      underline: true,
      width: pageWidth,
    })

    // ── Footer ────────────────────────────────────────────────────
    const footerY = doc.page.height - 40
    doc.rect(50, footerY, pageWidth, 22).fill(DARK_BLUE)
    doc.fillColor('white').font('Helvetica').fontSize(7.5).text(
      'Atmar Horeca EOOD  ·  VAT: BG205062463  ·  Varna, Bulgaria  ·  orders@atmarhoreca.com  ·  atmarhoreca.com',
      50, footerY + 7,
      { align: 'center', width: pageWidth }
    )

    doc.end()
  })
}
