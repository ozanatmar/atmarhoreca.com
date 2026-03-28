# atmarhoreca.com — Full Project Specification
**Version:** 1.0.0
**Date:** 2026-03-27
**Prepared for:** Claude Code
**Business:** Atmar Horeca EOOD (BG205062463), Varna, Bulgaria

---

## Table of Contents

1. [Business Context](#1-business-context)
2. [Tech Stack](#2-tech-stack)
3. [Site Structure & Pages](#3-site-structure--pages)
4. [Design & Branding](#4-design--branding)
5. [Database Schema](#5-database-schema)
6. [VAT & Pricing Rules](#6-vat--pricing-rules)
7. [Order Types](#7-order-types)
8. [Product Page](#8-product-page)
9. [Checkout Flow](#9-checkout-flow)
10. [Order Flow](#10-order-flow)
11. [Admin Panel](#11-admin-panel)
12. [Martellato Stock Scraping](#12-martellato-stock-scraping)
13. [Email Templates](#13-email-templates)
14. [Blog & Webhook](#14-blog--webhook)
15. [Make.com Automation](#15-makecom-automation)
16. [Customer Accounts & Auth](#16-customer-accounts--auth)
17. [Shipping & Delivery](#17-shipping--delivery)
18. [Payment Processing](#18-payment-processing)
19. [Notifications](#19-notifications)
20. [SEO Requirements](#20-seo-requirements)
21. [Environment Variables](#21-environment-variables)

---

## 1. Business Context

### What This Is
A dropshipping ecommerce site for professional horeca (hotel, restaurant, cafe) equipment. The business sources products from European suppliers and ships to customers across the EU and globally.

### Business Entity
- **Company:** Atmar Horeca EOOD
- **VAT Number:** BG205062463
- **Country:** Bulgaria (BG)
- **City:** Varna

### Core Philosophy
- Products must be **found on Google** and **ordered easily**. That is the entire purpose.
- There is **no browsing mechanism**, no category pages, no "about us", no contact page.
- Visitors come from Google search → land on a product page → order.
- The site should **not reveal** how many products or brands it carries.
- **Product pages are the most important pages on the site.**

### Launch Scope
- **Supplier at launch:** Martellato only (Italy)
- Mistro (Italy) and Frucosol (Spain) are planned for future phases
- Backend must be designed to support multiple suppliers from day one without code changes

### Suppliers (Overview)

| Supplier | Country | Products | Stock Behavior | Order Type |
|---|---|---|---|---|
| Martellato | IT | Chocolate/pastry tools, molds, equipment | Stock checked via sitemap scraping. Expensive items usually in stock, small items (molds, disposables) may not be. | A or B depending on stock |
| Mistro | IT | Meat slicers (custom-configured) | Always available but ~10 days lead time, customized per order | Always B (future) |
| Frucosol | ES | Bar & kitchen equipment, cleaning products | Always in stock. Some products shipping-inefficient (bulk/heavy) | A or B depending on product flag (future) |

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend + API | Next.js (App Router) | SSG for product/blog pages, API routes for backend logic |
| Database | Supabase (PostgreSQL) | All data storage |
| Auth | Supabase Auth | Customer accounts and admin authentication |
| Hosting | Vercel | With cron job support for scraping |
| Card Payments | Stripe | Payment Links per order, webhooks for status updates |
| Bank Transfer | Revolut | Manual: IBAN shown on proforma, no API integration |
| Email | Resend or Postmark | Transactional emails only |
| Notifications | Telegram Bot API + Email | Admin notified on new Type B orders |
| Image Hosting | atmar.bg via superhosting.bg | Images hotlinked by URL, not re-hosted |
| Automation | Make.com + OpenAI API | Daily blog and social media content pipeline |
| VAT Validation | EU VIES API | Free, no API key needed |
| Language | English only | No multilingual support |

### Key Architecture Decisions
- Admin panel is a **protected route within the same Next.js app**, not a separate service
- No headless CMS. Blog posts stored in Supabase, served by Next.js
- **Static generation (SSG)** for product pages and blog pages — critical for SEO performance
- ISR (Incremental Static Regeneration) used to revalidate product pages when stock or product data changes
- All country fields use **ISO 3166-1 alpha-2 codes** (BG, IT, ES, DE, FR, etc.) throughout the entire system
- Images are referenced by URL only — stored on atmar.bg, never uploaded to Supabase Storage

### Important: Verify Hotlinking
Before uploading product images to atmar.bg, verify that superhosting.bg does not block hotlinking from external domains. If it does, disable the restriction in the hosting panel.

---

## 3. Site Structure & Pages

### Public Pages

| URL | Page | Notes |
|---|---|---|
| `/` | Landing page | Search bar + 4 value proposition sections. No featured products. |
| `/products/[slug]` | Product page | Most important page. SSG. |
| `/blog` | Blog index | List of published posts, ordered by date desc. |
| `/blog/[slug]` | Blog post | SSG, auto-published via Make.com webhook. |
| `/search` | Search results | Keyword search across product names and descriptions. |
| `/login` | Login | Supabase Auth login. |
| `/register` | Register | Customer registration. |
| `/account` | Account | Order history, saved addresses. Requires login. |
| `/cart` | Cart | Current cart. Login wall before checkout. |
| `/checkout` | Checkout | Multi-step. Login required. |
| `/order/[id]` | Order confirmation | Shown after successful submit. |

### Admin Pages (Protected)

| URL | Page |
|---|---|
| `/admin` | Orders dashboard (default) |
| `/admin/orders/[id]` | Order detail |
| `/admin/products` | Product list |
| `/admin/products/[id]` | Product edit |
| `/admin/products/new` | New product |
| `/admin/suppliers` | Supplier list + edit |
| `/admin/shipping` | Shipping rate table |
| `/admin/scraping` | Scraping status + retry |
| `/admin/blog` | Blog post list |
| `/admin/blog/[id]` | Blog post edit |
| `/admin/blog/new` | New blog post |

### Pages That Do NOT Exist
- No "About Us"
- No "Our Team"
- No "Contact Us"
- No category/collection pages
- No sitemap page (XML sitemap auto-generated for SEO)

### Landing Page Content
1. Search bar (prominent, center)
2. Value proposition sections:
   - Access to professional European brands not easily available locally
   - EU-wide delivery handled end-to-end
   - B2B friendly — proper VAT invoicing, reverse charge for EU businesses
   - No minimums — order exactly what you need

---

## 4. Design & Branding

### Brand Colors

| Name | Hex | Usage |
|---|---|---|
| Red | `#C0392B` | Logo square (martini glass icon) |
| Green | `#7AB648` | Logo square (shaker icon). **Primary CTA buttons**: Add to Cart, Request Order, Submit Order, Approve. |
| Orange | `#F0A500` | Logo square (plate icon). Stock badges, highlights, accent elements. |
| Purple | `#6B3D8F` | Logo square (trolley icon). **Header, nav bar, admin panel** primary color. |
| Navy | `#1A1A5E` | Logo text color. Page headings, body text, important labels. |
| White | `#FFFFFF` | Page backgrounds, reversed text on dark/colored backgrounds. |
| Dark Gray | `#333333` | Body text. |
| Light Gray | `#F5F5F5` | Backgrounds for secondary sections, table rows. |

### Logo Files Available
All logos hosted on atmar.bg. Reference by URL.

| File | Usage |
|---|---|
| `atmar_horeca_logo_512x512.jpg` | Full color square icon (4 colored squares). Use as favicon and app icon. |
| `newlogo.jpg` | Horizontal logo (colored squares + "atmar.bg" text). Use in site header on white backgrounds. |
| `logo_square_no_bg_black.png` | Black square version. Use on dark or colored backgrounds. |
| `Atmar_Horeca_Logo_-_White.png` | White version. Use in footer or on dark/purple backgrounds. |

### Typography
- **Headings:** Nunito (Google Fonts, free, rounded sans-serif)
- **Body:** Inter (Google Fonts, free, clean sans-serif)
- Heading color: Navy `#1A1A5E`
- Body text color: Dark Gray `#333333`

### UI Direction
- Clean, professional, minimal
- White page backgrounds
- Purple (`#6B3D8F`) header and nav bar
- Green (`#7AB648`) for all primary CTA buttons
- Orange (`#F0A500`) for stock status badges and highlights
- Navy (`#1A1A5E`) for headings and important labels
- No decorative backgrounds or stock photo overlays on product pages
- Mobile-first layout
- No emojis in UI text

---

## 5. Database Schema

> All country fields use ISO 3166-1 alpha-2 codes throughout. Never use full country names in the database.

### Table: `suppliers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `name` | `text` | e.g. "Martellato" |
| `country_code` | `char(2)` | ISO alpha-2, e.g. "IT" |
| `lead_time_note` | `text` | Shown on product page to customer. e.g. "Usually ships in 5-7 business days" |
| `handling_days` | `int` | Business days for supplier to prepare and dispatch. Used in delivery estimate. |
| `default_requires_confirmation` | `boolean` | Default value for all products from this supplier. Can be overridden per product. |
| `contact_email` | `text` | Internal use only. Not shown on site. |
| `active` | `boolean` | If false, all products from this supplier are hidden from site. |
| `created_at` | `timestamptz` | Auto |

### Table: `products`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `supplier_id` | `uuid` | FK → suppliers.id |
| `name` | `text` | Product title |
| `slug` | `text` | URL slug, unique. e.g. "martellato-pear-3d-chocolate-mould" |
| `description` | `text` | Full product description. Supports basic HTML. |
| `price` | `numeric` | In EUR, **excluding VAT** |
| `weight_kg` | `numeric` | Gross shipping weight. Used for shipping rate lookup. |
| `requires_confirmation` | `boolean` | Overrides supplier default. If true, always Type B order. |
| `stock_status` | `enum` | `in_stock` / `out_of_stock` / `unknown` |
| `last_scraped_at` | `timestamptz` | Timestamp of last successful scrape that updated this product. |
| `martellato_url` | `text` | Full Martellato product URL as it appears in their sitemap. Null for non-Martellato products. e.g. `https://www.martellato.com/product/41126654/curvy-snack` |
| `images` | `text[]` | Array of image URLs hosted on atmar.bg |
| `meta_title` | `text` | SEO `<title>` tag. Falls back to `name` if empty. |
| `meta_description` | `text` | SEO meta description tag. |
| `shipping_inefficient` | `boolean` | Flag for products that are very costly to ship (e.g. heavy/cheap bulk items). Not used at Martellato launch but field must exist. |
| `active` | `boolean` | If false, hidden from site entirely. |
| `created_at` | `timestamptz` | Auto |

### Table: `customers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Matches Supabase Auth user ID |
| `email` | `text` | From Supabase Auth |
| `full_name` | `text` | |
| `company_name` | `text` | Optional |
| `vat_number` | `text` | Optional. For EU B2B reverse charge. |
| `vat_validated` | `boolean` | Result of VIES API validation. True = valid EU VAT number confirmed. |
| `country_code` | `char(2)` | ISO alpha-2 |
| `billing_address` | `jsonb` | `{ street, city, postal_code, country_code }` |
| `shipping_address` | `jsonb` | `{ street, city, postal_code, country_code }` |
| `created_at` | `timestamptz` | Auto |

### Table: `orders`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `customer_id` | `uuid` | FK → customers.id |
| `type` | `enum` | `A` (direct pay) / `B` (proforma) |
| `status` | `enum` | `pending_approval` / `awaiting_payment` / `paid` / `fulfilled` / `cancelled` |
| `items` | `jsonb` | Array of `{ product_id, name, qty, unit_price, weight_kg }` |
| `subtotal` | `numeric` | Sum of all line items, excluding VAT and shipping |
| `shipping_cost` | `numeric` | Auto-calculated for Type A. Set manually by admin for Type B. |
| `vat_rate` | `numeric` | e.g. `0.20` for 20%. Determined at checkout based on customer location and VAT number. |
| `vat_amount` | `numeric` | `(subtotal + shipping_cost) × vat_rate` |
| `total` | `numeric` | `subtotal + shipping_cost + vat_amount` |
| `currency` | `char(3)` | Default `EUR` |
| `stripe_payment_link_url` | `text` | Stripe Payment Link generated per Type B order. Sent in proforma email. |
| `proforma_pdf_url` | `text` | URL of the generated proforma invoice PDF. |
| `tracking_number` | `text` | Entered by admin when marking as fulfilled. |
| `tracking_url` | `text` | Carrier tracking link. Entered by admin when marking as fulfilled. |
| `admin_notes` | `text` | Internal only. Never shown to customer. |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto, updated on every status change |

### Table: `shipping_rates`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `origin_country_code` | `char(2)` | Pulled automatically from `suppliers.country_code` |
| `destination_country_code` | `char(2)` | e.g. "BG", "DE", "FR" |
| `weight_kg` | `int` | 1 to 30. One row per kg per route. |
| `rate_eur` | `numeric` | Shipping cost in EUR for that weight and route |
| `transit_days` | `int` | Estimated transit days for this route |

> **Over 30kg rule:** Additive logic applies.
> - 31kg = `rate(30kg) + rate(1kg)`
> - 45kg = `rate(30kg) + rate(15kg)`
> - Transit days for orders over 30kg: use `transit_days` from the 30kg row.
>
> **Origin country** is not entered manually per rate row. It is pulled from `suppliers.country_code` automatically when calculating shipping cost.

### Table: `blog_posts`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Post title |
| `slug` | `text` | URL slug, unique. e.g. "best-chocolate-mould-for-pastry-shop" |
| `content` | `text` | Full HTML or Markdown content |
| `linked_product_ids` | `uuid[]` | Array of product IDs linked/mentioned in the post |
| `meta_title` | `text` | SEO `<title>` tag. Max 60 characters. |
| `meta_description` | `text` | SEO meta description. Max 160 characters. |
| `published_at` | `timestamptz` | `null` = draft (not visible). Set to a datetime = live. |
| `created_at` | `timestamptz` | Auto |

### Table: `scrape_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `supplier_id` | `uuid` | FK → suppliers.id |
| `status` | `enum` | `success` / `failed` |
| `products_updated` | `int` | Number of products whose stock status changed during this run. |
| `error_log` | `text` | Full error output if failed. `null` if success. |
| `ran_at` | `timestamptz` | When the scrape ran |

---

## 6. VAT & Pricing Rules

### Display
- All prices on the site are displayed **excluding VAT**
- A note reads: *"VAT calculated at checkout"* on product pages and in cart

### VAT Calculation at Checkout

VAT is determined by two factors: the customer's billing country and whether a valid EU VAT number is provided.

| Customer Type | Country | VAT Number | VAT Applied |
|---|---|---|---|
| Individual or legal entity | BG (Bulgaria) | Any / None | 20% Bulgarian VAT |
| Individual | Any other EU country | None or invalid | 20% VAT (flat Bulgarian rate — valid below €10,000/year cross-border B2C threshold) |
| Legal entity | Any EU country (except BG) | Valid EU VAT number | 0% — Reverse charge |
| Any customer | Non-EU country | N/A | 0% — No VAT |

> **OSS Note:** Once annual cross-border B2C EU sales exceed €10,000/year, the business must register for EU OSS and charge the VAT rate of the customer's country (not a flat 20%). This threshold should be tracked and the system updated accordingly when reached.

### EU VIES Validation
- When a customer enters a VAT number, validate it in real time via the EU VIES API: `https://ec.europa.eu/taxation_customs/vies/`
- Free API, no key required
- If validation returns **valid**: apply 0% VAT (reverse charge)
- If validation returns **invalid** or **fails**: apply standard VAT for that country as if no VAT number was entered
- The VAT number field is optional. If left blank, treat as B2C.

### VAT on Invoices
- All invoices (proforma and final) must display: subtotal ex VAT, shipping ex VAT, VAT rate, VAT amount, total
- For 0% reverse charge: invoice must include the note *"VAT not applicable — reverse charge"*
- For Bulgarian customers: invoice shows 20% VAT line

---

## 7. Order Types

Every order in the system is either **Type A** or **Type B**. The type is determined at checkout before payment.

### Type A — Direct Pay
- Stock confirmed, no special confirmation needed
- Customer pays immediately via Stripe at checkout
- Order goes straight to "Paid" status

### Type B — Proforma
- Requires admin review before payment is taken
- Triggered when:
  - ANY item in the cart has `requires_confirmation = true`
  - ANY item in the cart has `stock_status != in_stock` (i.e. `out_of_stock` or `unknown`)
  - Destination country is **not** in the `shipping_rates` table (unmapped country)
- Customer submits order → no payment taken → admin reviews → admin approves → proforma invoice sent → customer pays

### Type Determination Logic (at checkout, before Step 3)

```
IF any cart item has requires_confirmation = true → Type B
ELSE IF any cart item has stock_status != 'in_stock' → Type B
ELSE IF destination_country_code not found in shipping_rates → Type B
ELSE → Type A
```

This check runs on the server. The cart UI reflects the determined type before the customer reaches the payment step.

---

## 8. Product Page

### URL
`/products/[slug]`

### Rendering
- Statically generated (SSG) at build time
- Revalidated via ISR when the product is updated in the admin panel
- Revalidated after each weekly scrape run

### Page Layout (top to bottom)

| # | Element | Details |
|---|---|---|
| 1 | Product name | `<h1>`. SEO-optimized. |
| 2 | Image gallery | Multiple images from `products.images[]`. Zoomable. |
| 3 | Price | Displayed ex VAT. Note: *"VAT calculated at checkout"* |
| 4 | Stock status badge | See badge states below |
| 5 | Lead time note | Pulled from `suppliers.lead_time_note` |
| 6 | CTA button | See CTA logic below |
| 7 | Product description | Full text from `products.description`. Supports basic HTML. |
| 8 | Shipping inefficiency warning | Only shown if `products.shipping_inefficient = true`. Text: *"Note: Due to the size or weight of this product, shipping costs will be calculated individually and confirmed in your proforma invoice."* Not used at Martellato launch but field and rendering logic must exist. |

### Stock Status Badge States

| `stock_status` | Badge Text | Badge Color |
|---|---|---|
| `in_stock` AND `requires_confirmation = false` | In Stock | Green (`#7AB648`) |
| `in_stock` AND `requires_confirmation = true` | Availability on Request | Orange (`#F0A500`) |
| `out_of_stock` | Out of Stock | Red (`#C0392B`) |
| `unknown` | Availability on Request | Orange (`#F0A500`) |

### CTA Button Logic

| Condition | Button Label | Resulting Order Type |
|---|---|---|
| `stock_status = in_stock` AND `requires_confirmation = false` | Add to Cart | Type A |
| `stock_status = out_of_stock` | Request Order | Type B |
| `requires_confirmation = true` | Request Order | Type B |
| `stock_status = unknown` | Request Order | Type B (safe default) |

### Login Wall
If the customer is **not logged in** and clicks "Add to Cart" or "Request Order":
- Redirect to `/login`
- After login, return to the same product page (preserve the action they were trying to take)

### SEO Requirements
- `<title>`: `products.meta_title` — falls back to `products.name` if empty
- `<meta name="description">`: `products.meta_description`
- Canonical URL: `https://atmarhoreca.com/products/[slug]`
- Schema.org structured data: `Product` type with `Offer`, including:
  - `name`, `description`, `image`, `price`, `priceCurrency: "EUR"`
  - `availability`: `https://schema.org/InStock` or `https://schema.org/OutOfStock`
  - `seller`: Atmar Horeca EOOD

---

## 9. Checkout Flow

Login is required before checkout. If not logged in, redirect to `/login` from the cart page.

### Order Type Determination
Runs server-side before Step 3. Logic documented in Section 7.

### Step 1 — Cart Review

- Shows: product name, quantity, unit price (ex VAT), line total
- Customer can update quantities (minimum 1) or remove items
- Shows subtotal (ex VAT, ex shipping)
- VAT and shipping NOT shown at this step
- No coupon/discount codes

### Step 2 — Address & Customer Details

**Fields:**

| Field | Required | Notes |
|---|---|---|
| Full name | Yes | Pre-filled from customer account if saved |
| Company name | No | Optional |
| Street address | Yes | |
| City | Yes | |
| Postal code | Yes | |
| Country | Yes | Dropdown, ISO alpha-2 codes |
| VAT number | No | Only relevant for EU customers. Triggers VIES validation in real time on blur. |
| Shipping address | Yes | Checkbox: "Same as billing address". If unchecked, separate shipping address fields appear. |

**VIES Validation (real-time):**
- Fires when the customer leaves the VAT number field (on blur)
- Calls `/api/vies/validate` which calls the EU VIES API
- Shows inline feedback: ✓ Valid VAT number / ✗ Could not validate — standard VAT will apply
- Does not block form submission. Invalid = standard VAT applied.

### Step 3 — Order Summary & Review

System displays:
- Itemized cart with quantities and line totals
- Shipping cost:
  - **Type A:** Looked up from `shipping_rates` table using `supplier.country_code` as origin, customer's destination `country_code`, and total order `weight_kg`. Additive logic for >30kg.
  - **Type B:** Shown as *"To be confirmed — will be included in your proforma invoice"*
- VAT calculation (based on country + VIES result from Step 2)
- VAT amount
- Total
- **Estimated delivery (Type A only):** `supplier.handling_days + shipping_rates.transit_days` business days from payment confirmation
- Order type label (shown to customer): *"Direct Order"* (Type A) or *"Quote Required"* (Type B)

Customer reviews everything. Can go back to edit.

### Step 4 — Payment or Submission

**Type A:**
- Stripe card payment embedded inline (Stripe Elements)
- On payment success: Stripe webhook fires → order `status` set to `paid` → confirmation email sent
- Customer redirected to `/order/[id]` confirmation page

**Type B:**
- "Submit Order" button — no payment taken
- On submit: order `status` set to `pending_approval`
- Customer sees confirmation message: *"Your order has been received. We will check availability and send you a proforma invoice within 24 hours."*
- Customer redirected to `/order/[id]` confirmation page
- Admin notified via Telegram + email (see Section 19)

---

## 10. Order Flow

### Type A — Direct Pay (Full Flow)

1. Customer pays via Stripe at checkout
2. Stripe webhook fires → order `status` → `paid`
3. **Email sent:** Payment Confirmed (Email #3)
4. Order appears in admin panel under **Paid** tab
5. Admin fulfills the order with Martellato
6. Admin enters `tracking_number` and `tracking_url` in order detail, clicks **Mark as Fulfilled**
7. Order `status` → `fulfilled`
8. **Email sent:** Order Fulfilled (Email #4) with tracking info

### Type B — Proforma (Full Flow)

1. Customer submits order — no payment taken
2. Order `status` → `pending_approval`
3. **Email sent:** Order Received (Email #1)
4. Admin receives Telegram notification + email with link to order in admin panel
5. Admin reviews order in admin panel, checks stock with Martellato
6. Admin fills in `shipping_cost` field (after getting freight quote)
7. Admin reviews the auto-generated proforma PDF — can edit line items, amounts, and notes before sending
8. Admin clicks **Approve & Send**:
   - System generates a Stripe Payment Link for the order total
   - System generates the proforma invoice PDF
   - `stripe_payment_link_url` and `proforma_pdf_url` saved to order
   - **Email sent:** Proforma Invoice (Email #2) with PDF attached and payment link
   - Order `status` → `awaiting_payment`
9. Customer pays:
   - **Via Stripe link:** Webhook fires automatically → order `status` → `paid`
   - **Via bank transfer (Revolut):** Admin manually marks as paid in admin panel after confirming bank receipt
10. **Email sent:** Payment Confirmed (Email #3)
11. Admin fulfills with Martellato
12. Admin enters `tracking_number` and `tracking_url`, clicks **Mark as Fulfilled**
13. Order `status` → `fulfilled`
14. **Email sent:** Order Fulfilled (Email #4) with tracking info

### Order Status Lifecycle

```
pending_approval → awaiting_payment → paid → fulfilled
                                    ↘ cancelled
                ↘ cancelled
```

Type A orders skip `pending_approval` and `awaiting_payment` and go directly to `paid` after Stripe webhook.

---

## 11. Admin Panel

Protected route at `/admin`. Accessible only to Supabase Auth users with admin role. All non-admin users attempting to access `/admin/*` are redirected to `/login`.

### Default Screen: Orders Dashboard

Four tabs:

| Tab | Shows |
|---|---|
| Pending Approval | Type B orders with `status = pending_approval` |
| Awaiting Payment | Orders with `status = awaiting_payment` |
| Paid | Orders with `status = paid` — ready to fulfill |
| Fulfilled | Orders with `status = fulfilled` |

**Order list columns:** Order ID (short), Customer name, Order total (EUR), Item count, Date placed, Order type badge (A/B)

Click any row → opens Order Detail.

### Order Detail Screen

Sections:

**Customer Info**
- Full name, email, company name, VAT number, VAT validation status
- Billing address, shipping address

**Items**
- Product name, qty, unit price, line total, weight (kg)
- Total weight shown

**Financials**
- Subtotal (ex VAT, ex shipping)
- Shipping cost field — **editable for Type B**, read-only for Type A
- VAT rate and VAT amount
- Order total
- Currency

**Proforma (Type B — Pending Approval status only)**
- PDF preview/editor
- Admin can edit: line items, shipping cost, notes, before sending
- **"Approve & Send"** button — generates Stripe Payment Link and sends proforma email

**Payment**
- For Type B awaiting payment: Stripe Payment Link URL shown. **"Resend Proforma"** button.
- **"Mark as Paid (Bank Transfer)"** button — manually confirms receipt of Revolut/IBAN payment. Sets status to `paid`.
- For paid orders: payment method shown (Stripe or bank transfer)

**Fulfillment**
- `Tracking number` text field
- `Tracking URL` text field
- **"Mark as Fulfilled"** button — requires tracking_number to be filled. Sets status to `fulfilled`.

**Admin Notes**
- Internal free-text field. Not shown to customer. Saved on blur.

### Products Screen (`/admin/products`)

- Searchable, sortable list of all products
- Columns: Name, Supplier, Price (EUR), Weight (kg), Stock Status, Active toggle
- Inline toggle to activate/deactivate products
- Click row → Product Edit screen

**Product Edit fields (all fields from `products` table):**
- Name, Slug (auto-generated from name, editable), Description (rich text)
- Supplier (dropdown)
- Price, Weight
- `requires_confirmation` toggle
- `stock_status` manual override dropdown (in_stock / out_of_stock / unknown)
- `martellato_url` field (text input — paste the Martellato product URL)
- Images (array of URLs — add/remove individual URLs)
- `shipping_inefficient` toggle
- `active` toggle
- Meta title, Meta description
- `last_scraped_at` (read-only, shown as info)

### Suppliers Screen (`/admin/suppliers`)

- List of all suppliers
- Add new / edit existing
- Fields: `name`, `country_code`, `lead_time_note`, `handling_days`, `default_requires_confirmation`, `contact_email`, `active`

### Shipping Rates Screen (`/admin/shipping`)

- Table view: origin country, destination country, weight (1–30 kg), rate (EUR), transit days
- Editable inline — click any cell to edit
- **CSV Import** button — bulk upload rate table (columns: origin_country_code, destination_country_code, weight_kg, rate_eur, transit_days)
- All rows grouped by origin/destination pair for readability

### Scraping Screen (`/admin/scraping`)

- **Last scraped:** Date and time
- **Status:** Success ✓ / Failed ✗
- If failed: expandable error log section showing full error message
- **"Retry Now"** button — manually triggers a scrape run
- Note: Automated scrape runs once per week via Vercel cron job

### Blog Screen (`/admin/blog`)

- List of all blog posts with status (Draft / Live)
- Shows: title, published date (or "Draft"), linked product count
- Click to edit / create new
- **Fields:** title, slug (auto-generated, editable), content (rich text/markdown editor), linked products (multi-select from products list), meta_title, meta_description, published_at (datetime picker — leave blank for draft)

---

## 12. Martellato Stock Scraping

### How Martellato Indicates Stock

Martellato has no API. Stock availability is communicated entirely through their sitemap:
- **In stock:** Product URL is present in `https://www.martellato.com/sitemap.xml`
- **Out of stock:** Product URL is removed from the sitemap. Page returns 404.

There is no "out of stock" state on Martellato's site — the page disappears entirely.

### Martellato URL Formats

Two URL formats coexist in their sitemap. There is **no rule** for which format a product uses — do not assume based on product age or category.

- **New format:** `https://www.martellato.com/product/[numeric-id]/[slug]`
  - Example: `https://www.martellato.com/product/41126654/curvy-snack`
- **Legacy format:** `https://www.martellato.com/product/[slug].html`
  - Example: `https://www.martellato.com/product/pear-jelly-mould.html`

### `martellato_url` Field

Each Martellato product in the `products` table has a `martellato_url` field containing the **exact full URL** as it appears in Martellato's sitemap. This is entered manually by admin when adding a new product (copy from Martellato's site or from their sitemap).

Do not store just the slug or just the numeric ID. Store the complete URL.

### Scraping Algorithm

```
1. Fetch https://www.martellato.com/sitemap.xml
2. Parse all <loc> values into a Set (sitemapUrls)
3. Query DB: SELECT id, martellato_url FROM products WHERE supplier_id = [martellato_id] AND martellato_url IS NOT NULL
4. For each product:
   - IF martellato_url IN sitemapUrls → SET stock_status = 'in_stock'
   - IF martellato_url NOT IN sitemapUrls → SET stock_status = 'out_of_stock'
5. UPDATE products SET last_scraped_at = NOW() for all processed products
6. INSERT into scrape_logs: status = 'success', products_updated = count, ran_at = NOW()
```

### Schedule

- **Frequency:** Once per week
- **Method:** Vercel Cron Job
- **Endpoint:** `GET /api/cron/scrape-martellato`
- **Authentication:** Secret header `x-cron-secret: [CRON_SECRET env var]`
- **Vercel config** in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/scrape-martellato",
    "schedule": "0 6 * * 1"
  }]
}
```
(Runs every Monday at 06:00 UTC)

### Fallback Behavior

If the sitemap fetch fails (network error, timeout, malformed XML, unexpected format):
1. Do **not** update any product's `stock_status`
2. Set all Martellato products' `stock_status` to `unknown` (which triggers `requires_confirmation = true` behavior at checkout)
3. Insert into `scrape_logs`: `status = 'failed'`, `error_log = [full error]`
4. Admin panel scraping screen shows failure state, error log, and Retry button

### Manual Override

Admin can manually set any product's `stock_status` to any value from the product edit screen. This overrides the scraped value. The next scrape run will overwrite the manual override unless the product's `martellato_url` is removed.

### Adding New Products

1. Admin finds the product on Martellato's website
2. Copies the full product URL (as it appears in the browser or in Martellato's sitemap)
3. Creates a new product in admin panel, pastes the URL into the `martellato_url` field
4. Next weekly scrape will automatically set the correct `stock_status`
5. Admin can also manually set `stock_status` immediately after creating the product

---

## 13. Email Templates

All emails are sent via Resend or Postmark (TBD). All emails share a common layout:
- Atmar Horeca logo (white version on dark header, or color version on white)
- Order ID prominently displayed
- Customer full name in greeting
- Itemized order summary (product name, qty, unit price, line total)
- Footer with company name and VAT number

---

### Email #1 — Order Received (Type B only)

**Trigger:** Customer submits a Type B order.

| | |
|---|---|
| **Subject** | Your order has been received — Order #[id] |
| **Body** | Dear [full_name], thank you for your order. We have received it and are currently checking product availability with our supplier. We will send you a proforma invoice within 24 hours. |
| **Contents** | Order summary: product name, qty, unit price, subtotal. Shipping and VAT shown as "To be confirmed". |

---

### Email #2 — Proforma Invoice

**Trigger:** Admin clicks "Approve & Send" on a Type B order.

| | |
|---|---|
| **Subject** | Proforma Invoice — Order #[id] |
| **Body** | Dear [full_name], please find your proforma invoice attached. You can pay by card using the button below, or by bank transfer using the details provided. |
| **Attachment** | Proforma invoice PDF |
| **Pay by Card** | Stripe Payment Link button |
| **Pay by Bank Transfer** | Revolut IBAN, BIC, account holder name, payment reference = "Order #[id]" |
| **Contents** | Full order summary including shipping cost, VAT rate, VAT amount, and total. |

---

### Email #3 — Payment Confirmed

**Trigger:** Stripe webhook fires on successful payment (both Type A and Type B). Also sent when admin manually marks Type B as paid.

| | |
|---|---|
| **Subject** | Payment confirmed — Order #[id] |
| **Body** | Dear [full_name], we have received your payment. Your order is being processed and will be dispatched soon. |
| **Estimated delivery (Type A)** | "Estimated delivery: [handling_days + transit_days] business days from today." |
| **Estimated delivery (Type B)** | "We will notify you with tracking information once your order has been dispatched." |
| **Contents** | Order summary, total paid. |

---

### Email #4 — Order Fulfilled

**Trigger:** Admin enters tracking info and clicks "Mark as Fulfilled".

| | |
|---|---|
| **Subject** | Your order has been shipped — Order #[id] |
| **Body** | Dear [full_name], your order is on its way. You can track your shipment using the information below. |
| **Tracking Number** | Displayed as plain text |
| **Track Your Order** | Clickable button linking to `tracking_url` |
| **Contents** | Order summary |

---

## 14. Blog & Webhook

### Blog URLs
- Blog index: `/blog` — lists all posts where `published_at` is not null and is in the past. Ordered by `published_at` descending.
- Blog post: `/blog/[slug]` — statically generated. Revalidated when post is published or updated.

### Blog Index Page
- Shows: post title, published date, `meta_description` as excerpt
- No pagination at launch
- No comments
- No categories or tags at launch

### Blog Post Page
- `<h1>`: post title
- Published date shown
- Full content rendered (HTML or Markdown)
- Links to `linked_product_ids` products shown as a "Related Products" section at the bottom (product name + link to product page)
- SEO: `meta_title` and `meta_description` from `blog_posts` table

### Webhook Endpoint

**Endpoint:** `POST /api/blog/create`

**Authentication:** Header `x-webhook-secret: [BLOG_WEBHOOK_SECRET env var]`

**Make.com calls this endpoint** to publish blog posts automatically. If the secret header is missing or wrong, return `401`.

**Request body (JSON):**
```json
{
  "title": "Best chocolate mould for pastry shops in 2026",
  "slug": "best-chocolate-mould-pastry-shops-2026",
  "content": "<full HTML or Markdown content of the blog post>",
  "meta_title": "Best Chocolate Mould for Pastry Shops | Atmar Horeca",
  "meta_description": "Looking for the best chocolate mould? Discover professional Martellato options at Atmar Horeca.",
  "linked_product_ids": ["uuid1", "uuid2"],
  "published_at": "2026-03-27T10:00:00Z"
}
```

**Rules:**
- `slug` must be unique. If slug already exists, return `409 Conflict`.
- `published_at` set to current time = post goes live immediately after ISR revalidation.
- `linked_product_ids` can be an empty array `[]` if no specific products are linked.
- All fields except `linked_product_ids` are required.

**Response (success):**
```json
{
  "success": true,
  "id": "uuid",
  "url": "/blog/best-chocolate-mould-pastry-shops-2026"
}
```

---

## 15. Make.com Automation

### Purpose
Fully automated daily content and social media pipeline. No manual writing.

### Trigger
Scheduled: once per day (time configurable in Make.com).

### Workflow Steps

1. **Fetch sitemap**
   - `GET https://atmarhoreca.com/sitemap.xml`
   - Extract all URLs matching `/products/[slug]`

2. **Pick random product**
   - Select one product URL at random from the extracted list

3. **Fetch product data**
   - `GET` the product page URL
   - Extract: product name, description, price

4. **Generate blog post**
   - OpenAI module (GPT-4 or later)
   - Prompt: Write a long-form, SEO-optimized blog post in English about this product. Target a relevant professional search query. Include a natural link to the product page. Mention use cases for horeca businesses (restaurants, hotels, pastry shops, etc.). Do not mention competitors. Min 600 words.

5. **Generate URL-safe slug**
   - Text transformer: lowercase, replace spaces with hyphens, remove special characters
   - Append current date to ensure uniqueness: `[slug]-[YYYY-MM-DD]`

6. **Generate meta fields**
   - Separate OpenAI call
   - meta_title: max 60 characters
   - meta_description: max 160 characters

7. **Generate social media posts**
   - Separate OpenAI module for each platform:
   - **X (Twitter):** Short, punchy, includes product link. Max 280 chars.
   - **Facebook:** Slightly longer, conversational. Includes product link.
   - **LinkedIn:** Professional tone, B2B angle. Mentions use in restaurants/hotels. Includes product link.
   - **Instagram:** Visual-first caption with relevant hashtags. Includes product link in bio note.

8. **Publish blog post**
   - `POST https://atmarhoreca.com/api/blog/create`
   - Header: `x-webhook-secret: [secret]`
   - Body: full JSON payload per Section 14 spec

9. **Post to social platforms**
   - Parallel HTTP modules / native Make.com connectors:
   - X: via X API v2
   - Facebook: via Facebook Graph API (Page post)
   - LinkedIn: via LinkedIn API (Organization post)
   - Instagram: via Meta Graph API — **requires Instagram Business account connected to a Facebook Page**

### Error Handling
- If blog webhook returns error → Make.com logs failure, sends email to admin
- If any social platform post fails → log and continue, do not block other platforms
- If OpenAI module fails → retry once, then log and skip that day

### Prerequisites Before Running
- Social media accounts connected in Make.com
- Instagram must be an Instagram Business account, connected to a Facebook Page via Meta Developer App
- `BLOG_WEBHOOK_SECRET` env var set and matching between Make.com scenario and the Next.js app

---

## 16. Customer Accounts & Auth

### Registration
- Email + password
- Fields collected at registration: email, password, full_name
- After registration, customer can add company_name, vat_number, billing_address, shipping_address in their account

### Login
- Required to place any order (both Type A and Type B)
- Guest browsing is allowed (product pages, search, blog)
- Login wall appears at cart step if not logged in
- After login, user is returned to the page they were trying to access

### Account Page (`/account`)
Customer can view and edit:
- Personal details (full_name, company_name)
- VAT number (triggers VIES re-validation on save)
- Billing address
- Shipping address (default)
- Order history (list of past orders with status and link to order detail)

### Admin Role
- Admin users are identified by a custom claim in Supabase Auth (e.g. `user_metadata.role = 'admin'`)
- Only admin users can access `/admin/*` routes
- Admin account is created manually in Supabase dashboard — no public admin registration

---

## 17. Shipping & Delivery

### Type A Orders — Automatic Shipping Calculation

1. Determine origin country: `suppliers.country_code` for the supplier of the products in the cart
2. Determine destination country: `customers.shipping_address.country_code`
3. Calculate total order weight: sum of `(items[].qty × items[].weight_kg)`
4. Look up rate: query `shipping_rates` where `origin_country_code`, `destination_country_code`, `weight_kg`
5. For weight ≤ 30kg: direct lookup
6. For weight > 30kg: additive — `rate(30) + rate(remainder)`
7. If no matching rate found → order automatically converted to Type B

### Type B Orders — Manual Shipping

- Shipping cost is not calculated automatically
- Admin fills in `shipping_cost` after getting a freight quote from the carrier
- Shipping cost is added to the proforma invoice before sending

### Estimated Delivery (Type A)

Shown at checkout Step 3 and in Email #3:
```
Estimated delivery: [supplier.handling_days + shipping_rates.transit_days] business days from payment confirmation
```

### Unmapped Countries

If a customer's country is not found in the `shipping_rates` table (including all non-EU countries):
- Order automatically becomes Type B regardless of product `requires_confirmation` flags
- Customer sees: *"Shipping to your location will be calculated individually and included in your proforma invoice."*
- No orders are blocked — all countries can order via the proforma flow

### Shipping Rate Table

Admin manages via the Shipping Rates screen (`/admin/shipping`):
- One row per: origin country + destination country + weight (1–30 kg)
- CSV import supported for bulk population
- Admin must populate real freight rates before launch (get quotes from freight forwarder for Italy → key EU markets)

---

## 18. Payment Processing

### Stripe (Card Payments)

- Used for both Type A (inline at checkout) and Type B (Payment Link sent via email)
- **Type A:** Stripe Elements embedded at checkout Step 4. Payment confirmed via webhook.
- **Type B:** Stripe Payment Link generated per order when admin clicks "Approve & Send". URL stored in `orders.stripe_payment_link_url` and included in proforma email.
- Stripe webhook endpoint: `POST /api/webhooks/stripe`
- On `payment_intent.succeeded` or `checkout.session.completed`: find order by metadata, set `status = 'paid'`, send Email #3

### Revolut / Bank Transfer (Manual)

- No Revolut API integration
- Customer receives bank details in the proforma email:
  - IBAN
  - BIC/SWIFT
  - Account holder name: Atmar Horeca EOOD
  - Payment reference: `Order #[id]`
- Admin manually confirms receipt and clicks "Mark as Paid" in admin panel
- On mark as paid: `status = 'paid'`, Email #3 sent

### Currency
- All prices and payments are in EUR
- No multi-currency support at launch

---

## 19. Notifications

### Admin Notifications (New Type B Order)

Triggered immediately when a customer submits a Type B order.

**Telegram:**
- Bot: configured via `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars
- Message format:
  ```
  🛒 New order received — Order #[id]
  Customer: [full_name] ([email])
  Items: [item count]
  Subtotal: €[subtotal]
  View order: https://atmarhoreca.com/admin/orders/[id]
  ```

**Email:**
- Sent to admin email address (`ADMIN_EMAIL` env var)
- Subject: `New order requires approval — Order #[id]`
- Body includes: customer name, email, item list, subtotal, direct link to order in admin panel

Both notifications fire simultaneously. If either fails, log the error but do not block the order submission.

---

## 20. SEO Requirements

### Product Pages
- SSG with ISR — fast load, crawlable HTML
- Unique `<title>` and `<meta name="description">` per product
- Schema.org `Product` markup with `Offer` (price, currency, availability)
- Canonical URL
- Open Graph tags (for social sharing)
- Product image in OG:image tag

### Blog Pages
- SSG with ISR
- Unique `<title>` and `<meta name="description">` per post
- Schema.org `Article` markup
- Canonical URL
- Open Graph tags

### XML Sitemap
- Auto-generated at `/sitemap.xml`
- Includes all active product pages and all published blog posts
- Submitted to Google Search Console

### Robots.txt
- `/robots.txt` — allows all crawlers on public pages, disallows `/admin/*`

### No-Index Rules
- `/admin/*` — noindex
- `/cart` — noindex
- `/checkout` — noindex
- `/account` — noindex
- `/login`, `/register` — noindex

---

## 21. Environment Variables

All environment variables must be set in Vercel project settings.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Resend or Postmark)
RESEND_API_KEY=
# or
POSTMARK_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Admin
ADMIN_EMAIL=

# Cron job security
CRON_SECRET=

# Blog webhook security
BLOG_WEBHOOK_SECRET=

# App URL
NEXT_PUBLIC_SITE_URL=https://atmarhoreca.com
```

---

## Appendix A: Decisions Log Reference

The following key decisions were made during the specification phase and are tracked in Notion at:
`https://www.notion.so/ozanatmar/atmarhoreca-com-web-app-3308996bf0588099a111f74bb0488e9e`

| Decision | Outcome |
|---|---|
| Launch suppliers | Martellato only. Mistro and Frucosol in future phases. |
| Site language | English only |
| Customer auth | Login required to place orders. Guest browsing allowed. |
| VAT display | Prices shown excluding VAT. VAT calculated at checkout. |
| B2B vs B2C | Both supported. VAT treatment differs (see Section 6). |
| VIES validation | Yes, real-time on checkout Step 2. |
| Revolut integration | Manual bank transfer only. No API. |
| Stripe for Type B | Stripe Payment Link generated per order, sent in proforma email. |
| Proforma generation | Auto-generated from order data, editable by admin before sending. |
| Scraping frequency | Weekly (Vercel cron, every Monday 06:00 UTC). |
| Scraping method | Sitemap URL presence check only — no HTML scraping. |
| Product images | Hosted on atmar.bg. Referenced by URL. Not uploaded to Supabase. |
| Admin notifications | Telegram + Email on new Type B orders. |
| Blog publishing | Automated via Make.com webhook to `/api/blog/create`. |
| Social posting | X, Facebook, LinkedIn, Instagram (requires Business account). |
| Country fields | ISO 3166-1 alpha-2 codes throughout. |
| Shipping calc | Rate table (origin + destination + weight). Additive for >30kg. |
| Unmapped countries | Auto Type B, not blocked. |
| Tracking | Admin enters tracking_number + tracking_url when fulfilling. |
| Admin panel | Protected route in same Next.js app. Not a separate service. |

---

## Appendix B: Launch Checklist (Pre-Go-Live)

- [ ] Supabase project created, all tables migrated
- [ ] Vercel project connected to GitHub repo
- [ ] All environment variables set in Vercel
- [ ] Stripe account connected, webhook endpoint configured
- [ ] Telegram bot created, chat ID confirmed, test notification sent
- [ ] Resend/Postmark account set up, domain verified for sending
- [ ] atmar.bg image hosting confirmed (hotlinking not blocked)
- [ ] Logo files uploaded to atmar.bg
- [ ] First Martellato products added to admin panel with `martellato_url` filled
- [ ] Shipping rate table populated (Italy → EU countries, 1–30 kg)
- [ ] First manual scrape run triggered and verified
- [ ] Stripe test payment completed end-to-end (Type A flow)
- [ ] Test Type B order submitted, proforma sent, payment link tested
- [ ] All 4 email templates tested and rendered correctly
- [ ] Google Search Console connected, sitemap submitted
- [ ] Make.com automation scenario built and tested (blog + social)
- [ ] Instagram Business account connected to Facebook Page for automation
- [ ] Admin panel fully tested: orders, products, suppliers, shipping, scraping, blog

---

*End of specification — Version 1.0.0*
