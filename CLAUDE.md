# Claude Code Instructions

## Keep CLAUDE.md in Sync

**Any time you add, change, or remove something on the site — a feature, a route, a business rule, a field, a flow — update the relevant section, sentence, or wording in CLAUDE.md in the same commit.** CLAUDE.md must always reflect the current state of the codebase, not a past state.

---

## Branch Policy

- **All changes must be pushed to the `main` branch** — this is the production branch that Vercel deploys automatically.
- Never push to `master`.
- When committing and pushing, always target `origin/main`.

---

## Business Overview

**Atmar Horeca EOOD** (VAT: BG205062463, Varna, Bulgaria) sells professional horeca (hotel, restaurant, café) equipment from European suppliers to B2B customers across the EU. English-only site.

- Prices shown **excluding VAT** everywhere on the site
- Login is **required to place orders** — guests can browse freely
- Customers do not need to know anything about the supply chain

---

## Suppliers / Brands

Stored in the `brands` table. Key fields:

| Field | Purpose |
|---|---|
| `default_requires_confirmation` | If true, all orders for this brand's products become Type B |
| `minimum_order_amount` | Minimum order value for this brand (nullable = no minimum) |
| `handling_days` | Days needed before dispatch |
| `lead_time_note` | Human-readable lead time shown to customer |
| `slug` | Used in `/brands/[slug]` URLs |

---

## VAT Rules

VAT is calculated at checkout only. Four cases:

| Case | Condition | VAT Treatment |
|---|---|---|
| 1 | Customer in **Bulgaria** (BG) | 20% Bulgarian VAT |
| 2 | Customer in **EU** (non-BG), **no valid VAT number** | 20% Bulgarian VAT |
| 3 | Customer in **EU** (non-BG), **valid VAT number** (VIES verified) | Zero-rated |
| 4 | Customer **outside EU** | Zero-rated |

VAT number validation uses the EU VIES API in real time at checkout. If VIES is down, allow the customer to proceed but flag for manual verification.

---

## Order Types

Every order is either **Type A** or **Type B**.

**Type B triggers** — the order becomes Type B if ANY of the following is true for any item in the cart:
- `products.stock_status != 'in_stock'`
- `products.requires_confirmation = true`
- `brands.default_requires_confirmation = true`

If none of the above are true for any item, the order is Type A.

**Type A — Direct Payment**
- Customer pays via Stripe checkout or bank transfer
- If Stripe: payment captured immediately, order confirmed automatically
- If bank transfer: a proforma invoice is generated automatically and emailed to the customer; order moves to `awaiting_payment` until payment is confirmed by admin

**Type B — Requires Admin Approval**
- Admin reviews and approves first
- Proforma PDF invoice generated and emailed to customer
- Customer pays via Stripe Payment Link or Revolut bank transfer
- Admin manually marks as paid after verifying

---

## Free Shipping

Free shipping applies to a product **only when all three of these are false**:
- `brands.default_requires_confirmation = false`
- `products.requires_confirmation = false`
- `products.shipping_inefficient = false`

If a product is eligible for free shipping, show a **"Free shipping to EU" badge** on the product page.

Shipping is **not calculated automatically**. It is either free (see above) or quoted manually (admin sets `shipping_cost` on the order). The `shipping_rates` table currently stores transit days by route — used for informational estimates, not price calculation. Product `weight_kg` is for internal logistics use only, not shown to customers.

---

## Stock Statuses

| DB value | Display label |
|---|---|
| `in_stock` | In Stock |
| `out_of_stock` | Out of Stock |
| `unknown` | On Request |

---

## Product Views

Individual view events are stored in `product_views` (per session). A Make.com scenario aggregates these and updates the `views` column on `products` — this is what the "Best Sellers" feature reads from. Do not read view counts directly from `product_views` at render time.

---

## Martellato Stock Scraping

Checks Martellato's sitemap for product URL presence:
- URL present → `in_stock`
- URL absent → `out_of_stock`

Two coexisting URL formats in their sitemap (both must be handled):
1. `/en/product/[numeric-id]`
2. `/en/[category-slug]/[product-slug]`

Scrape is triggered via Make.com calling:
`GET /api/cron/scrape-martellato` — secured with `Authorization: Bearer <CRON_SECRET>` header (Vercel cron style).

Results logged in `scrape_logs` table.

---

## Payments

- **Stripe** — Type A direct checkout + Type B Payment Link
- **Revolut bank transfer** — EUR IBAN: LT85 3250 0987 1154 1132. No API. Admin marks as paid manually.

---

## Admin Notifications

Triggered on **every new order** (both Type A and Type B):
- **Telegram** message via `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — includes order type label
- **Email** to `ADMIN_EMAIL`

Customer `order_received` email is only sent for Type B orders at creation time. For Type A, the customer email is handled by the payment webhook after payment completes.

---

## Database Tables

| Table | Purpose |
|---|---|
| `products` | All products. Key fields: `brand_id`, `sku`, `slug`, `price`, `stock_status`, `requires_confirmation`, `shipping_inefficient`, `weight_kg`, `images`, `specs`, `option_groups`, `pack_size`, `views`, `meta_title`, `meta_description`, `martellato_url` |
| `brands` | Supplier/brand records. Key fields: `slug`, `default_requires_confirmation`, `minimum_order_amount`, `handling_days`, `lead_time_note` |
| `customers` | Registered customers. Linked to Supabase Auth via `id`. Fields include `vat_number`, `vat_validated`, `country_code`, billing/shipping addresses |
| `orders` | All orders. Includes `type` (A/B), `status`, `items` (JSONB), VAT fields, Stripe fields, proforma PDF URL, tracking, `shipping_cost` |
| `shipping_rates` | Origin + destination country pairs with `transit_days`. Used for delivery estimates, not price calculation |
| `blog_posts` | Blog content. Published via Make.com webhook. Fields: `title`, `slug`, `content`, `linked_product_ids`, `meta_title`, `meta_description`, `published_at` |
| `product_views` | Per-session view events. Used to populate `products.views` for "Best Sellers" |
| `product_relations` | Many-to-many. Used for "More from [Brand]" or related product suggestions |
| `product_documents` | PDFs/files attached to products (e.g. data sheets) |
| `redirects` | Old path → new path. **Never drop or truncate this table — 608 rows, critical for SEO** |
| `scrape_logs` | Log of each Martellato scrape run (status, products updated, errors) |
| `settings` | Key-value store for site-wide config |
| `email_verification_tokens` | Tokens for customer email verification flow |
| `inbox_threads` | Customer message threads (returns, privacy inboxes) |
| `inbox_emails` | Individual emails within a thread (inbound + outbound) |

---

## Site Structure

- `/` — Homepage. Brand grid + best sellers. No product count visible.
- `/search` — All products with filters (brand, category, price, availability)
- `/brands` — Brand listing grid
- `/brands/[slug]` — Brand page with filtered product grid
- `/products/[sku]/[name]` — Product detail page. Route folders are `[slug]/[name]` where `[slug]` holds the SKU value and `[name]` holds the product name slug.
- `/blog` — Blog listing
- `/blog/[slug]` — Blog post
- `/cart`, `/checkout` — Cart and checkout flow
- `/account` — Customer account
- `/admin/*` — Admin panel (protected, noindex)

Brand pages are discoverable via the homepage brand grid and `/brands`. There is no category navigation.

The blog is not currently linked from the main nav. The nav link should be added and conditionally hidden when `blog_posts` has no published rows.

---

## Important Rules for Claude Code

- **Never drop or truncate `redirects`** — 608 rows, SEO-critical
- **Never change a product `slug`** without also inserting a row in `redirects`
- **Do not expose** total product count, brand count, or catalog size in any UI element
- **No category browse pages** — discovery is via brand pages and search
- **`weight_kg`** is internal only — never show to customers
- The `blog` nav link should be conditionally hidden when `blog_posts` table has no published rows
- All country fields use ISO 3166-1 alpha-2 codes
- The `shipping_rates` table has no `rate_eur` column — shipping cost is either free or set manually by admin on each order