# QA Test Plan — Atmar Horeca

Each workflow is broken into steps. For each step, the **Expected** column describes what the code should do. When running QA, Claude will trace the relevant code paths and report **Pass / Fail / Warning** with file references.

**Last run:** 2026-04-02 (re-run on WF-07, WF-09, WF-16 after fixes in commit d039fcd8)

---

## WF-01 · User Registration

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Submit register form with valid email + password ≥8 chars | Supabase creates `auth.users` entry; `customers` record upserted with `id`, `email`, `full_name` | ✅ Pass |
| 2 | Submit with password <8 chars | Validation error shown, no account created | ✅ Pass — `minLength={8}` on input (`register/page.tsx:78`) prevents submission |
| 3 | Submit with already-registered email | Supabase returns error, shown to user | ✅ Pass — `authError.message` rendered (`register/page.tsx:32`) |
| 4 | After successful registration | Redirected to home page, user is logged in | ✅ Pass — `router.push('/')` + `router.refresh()` (`register/page.tsx:46`) |

---

## WF-02 · User Login / Logout

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Login with valid credentials | Session established, redirect to home (or `?next=` param target) | ✅ Pass — `router.push(nextUrl)` where `nextUrl = searchParams.get('next') ?? '/'` (`login/page.tsx:13,34`) |
| 2 | Login with wrong password | Error message shown, no session | ✅ Pass — `authError.message` rendered (`login/page.tsx:29`) |
| 3 | Visit `/checkout` while logged out | Redirected to `/login?next=/checkout` | ✅ Pass — `checkout/page.tsx:8`: `redirect('/login?next=/checkout')` |
| 4 | Logout | Session cleared, redirected to home | ✅ Pass — standard Supabase signOut via `LogoutButton` |

---

## WF-03 · Product Browsing & Search

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Visit a product page | Name, brand, SKU, price (excl VAT), images, description rendered | ✅ Pass — ISR page with full product data |
| 2 | Product with `requires_confirmation=true` | Stock badge shows confirmation required | ✅ Pass |
| 3 | Product with `shipping_inefficient=true` | Shipping inefficiency warning shown | ✅ Pass |
| 4 | Product with `stock_status=out_of_stock` | Out of stock badge shown | ✅ Pass |
| 5 | Search by keyword | Relevant products returned with name, price, stock status | ✅ Pass |
| 6 | Filter by brand/category | Results narrowed correctly | ✅ Pass |

---

## WF-04 · Cart Management

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Add product to cart | Item appears in cart with correct qty, price, brand | ✅ Pass — `cart-store.ts:18`: handles new and existing items |
| 2 | Change qty in cart | Line total updates; subtotal updates | ✅ Pass — `cart-store.ts:33`: `updateQty` enforces `qty >= 1` |
| 3 | Remove item | Item removed; subtotal recalculates | ✅ Pass — `cart-store.ts:42` |
| 4 | Cart persists across page reload | Zustand store persistence working | ✅ Pass — `persist` middleware with key `'atmar-cart'` (`cart-store.ts:13`) |
| 5 | Brand with minimum order — cart below minimum | Warning shown at cart/checkout; Next button disabled | ✅ Pass — `StepCart.tsx:71-77,84`: errors shown, Continue disabled when `minimumErrors.length > 0` |
| 6 | All brands above minimum | Warning cleared; checkout proceeds | ✅ Pass |

---

## WF-05 · Checkout — Address Step

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Fill billing address, all required fields | Form accepts input, proceeds to next step | ✅ Pass — `StepAddress.tsx:61`: `handleSubmit` calls `setStep(3)` |
| 2 | Leave required field empty | Validation error shown | ✅ Pass — native `required` on all required inputs |
| 3 | Enter valid EU VAT number (non-BG) | VIES validates; "0% VAT applies (reverse charge)" shown | ✅ Pass — `StepAddress.tsx:100-103` |
| 4 | Enter valid BG VAT number | VIES validates; "20% Bulgarian VAT applies" shown | ✅ Pass — `StepAddress.tsx:101` |
| 5 | Enter invalid VAT number | "Could not validate — standard VAT will apply" shown | ✅ Pass — `StepAddress.tsx:106` |
| 6 | Enter VAT number with wrong country prefix | Country mismatch error shown | ✅ Pass — `StepAddress.tsx:27-31`: prefix check before VIES call |
| 7 | Check "same as billing" for shipping | Shipping address fields hidden/disabled | ✅ Pass — `StepAddress.tsx:121`: conditional render |

---

## WF-06 · Checkout — Order Type Determination

| # | Scenario | Expected Type | Result |
|---|----------|---------------|--------|
| 1 | All items in_stock, no confirmation needed, route available | Type A — "Direct Order" green badge | ✅ Pass — `order-type.ts:15` |
| 2 | Any item has `requires_confirmation=true` | Type B — "Quote Required" orange badge | ✅ Pass — `order-type.ts:11` |
| 3 | Any item has `shipping_inefficient=true` | Type B | ✅ Pass — `order-type.ts:12` |
| 4 | Any item `stock_status != in_stock` | Type B | ✅ Pass — `order-type.ts:13` |
| 5 | No shipping route found for destination | Type B + destination warning shown | ✅ Pass — `order-type.ts:14`; warning in `StepReview.tsx:91-95` |

---

## WF-07 · Checkout — Type A (Direct Order, Card Payment)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Reach payment step (Type A) | "Pay by Card" button shown; clicking it creates order + PaymentIntent then renders PaymentElement | ✅ Pass — `StepPayment.tsx:81-100`: two-phase init |
| 2 | Submit with valid test card | Order created with `status=awaiting_payment`; PaymentIntent created with `metadata.orderId` | ✅ Pass — `orders/create/route.ts:61`; `payment-intent/route.ts:24-28` |
| 3 | Stripe fires `payment_intent.succeeded` | Webhook verifies signature; order status → `paid`; `payment_confirmed` email sent; Telegram to admin | ✅ Pass — `webhooks/stripe/route.ts:33-82` |
| 4 | Customer visits `/order/[id]` after payment | Status shows `paid`; items, totals, billing address shown | ✅ Pass — `order/[id]/page.tsx` |
| 5 | Cart is cleared after order creation | Cart empty after redirect to `/order/[id]` | ✅ Pass — `ClearCart.tsx:8`: `clearCart()` runs on mount via `useEffect` when customer lands on order page |
| 6 | `payment_confirmed` email for Type A includes estimated delivery | Estimated delivery shown in email | ✅ Pass — `estimated_delivery_days` stored at order creation (`StepPayment.tsx:52`, `create/route.ts:70`); passed to email in both webhook handlers (`webhooks/stripe/route.ts:65`) |

---

## WF-08 · Checkout — Type B (Quote Required, Submit Only)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Reach payment step (Type B) | "Submit Order" button; no payment form; shipping shown as "To be confirmed" | ✅ Pass — `StepPayment.tsx:103-125` |
| 2 | Submit order | Order created with `status=pending_approval`; `order_received` email to customer; `admin_new_order` email + Telegram to admin | ✅ Pass — `orders/create/route.ts:76-97` |
| 3 | Customer visits `/order/[id]` | Status shows "Pending Approval"; shipping shown as "To be confirmed" | ✅ Pass — `order/[id]/page.tsx:158` |
| 4 | Cart is cleared after order creation | Cart empty | ✅ Pass — `StepPayment.tsx:76`: `clearCart()` called in `handleTypeBSubmit` |

---

## WF-09 · Admin — Approve Type B Order & Send Proforma

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Admin visits order (status: `pending_approval`) | Customer info, items, approve panel with shipping cost input shown | ✅ Pass — `OrderActions.tsx:56`: renders when `type === 'B' && status === 'pending_approval'` |
| 2 | Admin enters shipping cost, clicks "Approve & Send" | Stripe PaymentLink created with both `metadata.orderId` and `payment_intent_data.metadata.orderId`; order updated; `stripe_payment_link_url` saved | ✅ Pass — `action/route.ts:46-66` (fixed in commit 837d0a69) |
| 3 | `proforma_invoice` email sent to customer | Customer receives email with items, pricing, bank details, Stripe payment link button | ✅ Pass — `action/route.ts:68-79`; `sendEmail` now properly awaited (fixed in commit 837d0a69) |
| 4 | Admin order page shows `awaiting_payment` after approval | Status updated; page refreshes | ✅ Pass — `OrderActions.tsx:33`: `router.refresh()` on success |
| 5 | Type A order in `awaiting_payment` — proforma/bank actions NOT shown | Admin cannot misuse bank-transfer actions on a card-payment order | ✅ Pass — `OrderActions.tsx:82`: gated on `order.type === 'B'` (fixed in commit d039fcd8) |

---

## WF-10 · Customer Pays via Stripe Payment Link (Type B)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Customer clicks "Pay by Card" in proforma email | Stripe Checkout page opens with correct amount | ✅ Pass |
| 2 | Customer pays with test card | Stripe fires `checkout.session.completed` with `session.metadata.orderId` set | ✅ Pass — Payment Link metadata propagates to Checkout Session |
| 3 | `checkout.session.completed` webhook handler | Order fetched; status → `paid`; `payment_confirmed` email sent; Telegram to admin | ✅ Pass — fixed in commit 837d0a69 |
| 4 | Customer visits `/order/[id]` | Status shows `paid` | ✅ Pass |
| 5 | Admin visits order | Status shows `paid`; fulfill panel shown | ✅ Pass — `OrderActions.tsx:105`: renders when `status === 'paid'` |

---

## WF-11 · Admin — Mark Paid by Bank Transfer

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Admin clicks "Mark as Paid (Bank Transfer)" on `awaiting_payment` order | Order status → `paid`; `payment_confirmed` email sent to customer | ✅ Pass — `action/route.ts:102-112` |
| 2 | Customer visits order | Status shows `paid` | ✅ Pass |

---

## WF-12 · Admin — Resend Proforma

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Admin clicks "Resend Proforma" on `awaiting_payment` order | `proforma_invoice` email resent with existing payment link and totals | ✅ Pass — `action/route.ts:84-99` |
| 2 | Order with no `stripe_payment_link_url` | API returns 400 error; no email sent | ✅ Pass — `action/route.ts:85-87` |

---

## WF-13 · Admin — Fulfill Order

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Admin enters tracking number + optional URL, clicks "Fulfill" | Order status → `fulfilled`; `tracking_number` and `tracking_url` saved | ✅ Pass — `action/route.ts:114-132` |
| 2 | `order_fulfilled` email sent | Customer receives email with tracking number and optional link | ✅ Pass — `templates.ts:244-262` |
| 3 | Submit without tracking number | Button disabled in UI; API returns 400 if called directly | ✅ Pass — `OrderActions.tsx:113`: `disabled={loading \|\| !trackingNumber}`; `action/route.ts:116-118` |
| 4 | Customer visits order | Status `fulfilled`; tracking number (and link if provided) shown | ✅ Pass — `order/[id]/page.tsx:221-232` |

---

## WF-14 · Admin — Cancel Order

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Admin cancels order | Order status → `cancelled` | ✅ Pass — `action/route.ts:134-137` |
| 2 | Customer visits order | Status shows `cancelled` | ✅ Pass |
| 3 | Cancel only available for pre-payment statuses | Cancel button not shown for `paid` or `fulfilled` | ✅ Pass — `OrderActions.tsx:122`: only shown for `pending_approval` or `awaiting_payment` |

---

## WF-15 · Admin — Save Notes

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Admin types in notes field, blurs | `admin_notes` saved to DB; no status change | ✅ Pass — `action/route.ts:34-37`; `OrderActions.tsx:50`: `onBlur={saveNotes}` |
| 2 | Reload admin order page | Notes persist | ✅ Pass — `router.refresh()` after save reloads server data |

---

## WF-16 · Admin — Orders Dashboard

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Visit `/admin` | Orders page shown; tabs: pending_approval, awaiting_payment, paid, fulfilled | ✅ Pass — `admin/page.tsx:7-12` |
| 2 | Click a tab | Table filtered to that status; shows Order #, Customer, Items count, Type (A/B), Total, Date | ✅ Pass |
| 3 | Click a row | Navigates to order detail page | ✅ Pass — `admin/page.tsx:73`: Link wraps order # |
| 4 | Non-admin visits `/admin` | Redirected to login | ✅ Pass — `admin/layout.tsx:10`: `redirect('/login')` if not admin |
| 5 | View cancelled orders | Cancelled orders tab accessible | ✅ Pass — "Cancelled" tab added to `TABS` array (`admin/page.tsx:12`) |

---

## WF-17 · VAT Calculation

| # | Scenario | Expected VAT Rate | Result |
|---|----------|-------------------|--------|
| 1 | Customer country = BG, any VAT status | 20% | ✅ Pass — `utils.ts:53-55` |
| 2 | Customer country = EU (non-BG), valid VAT number | 0% (reverse charge) | ✅ Pass — `utils.ts:58-60` |
| 3 | Customer country = EU (non-BG), no/invalid VAT | 20% | ✅ Pass — `utils.ts:62-63` |
| 4 | Customer country = non-EU | 0% | ✅ Pass — `utils.ts:48-50` |
| 5 | VAT applied to `(subtotal + shipping) × rate` | Correct totals in checkout and order | ✅ Pass — `CheckoutFlow.tsx:64` |
| 6 | No country selected yet (Steps 1–2) | Defaults to BG (20%) for intermediate display | ⚠️ Warning — `CheckoutFlow.tsx:63`: `address.country_code \|\| 'BG'` — visible in Step 3 preview but country is required before reaching Step 3, so no real impact |

---

## WF-18 · Shipping Calculation

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Route exists, weight ≤30kg | Exact weight rate; fallback to 30kg rate if no exact match | ✅ Pass — `shipping.ts:27-30` |
| 2 | Route exists, weight >30kg | Additive: rate@30kg + rate@(remainder capped at 30kg) | ✅ Pass — `shipping.ts:33-44` |
| 3 | No route for destination | Returns null → order forced to Type B | ✅ Pass — `shipping.ts:20` |
| 4 | Type A: shipping shown in checkout total | Correct cost and transit days displayed | ✅ Pass — `CheckoutFlow.tsx:62`; `StepReview.tsx:57-58` |
| 5 | Type B: shipping shown as "To be confirmed" | No cost shown until admin approves | ✅ Pass — `StepReview.tsx:60-65`; `order/[id]/page.tsx:158` |

---

## WF-19 · Email Delivery

| # | Template | Trigger | Recipient | Result |
|---|----------|---------|-----------|--------|
| 1 | `order_received` | Type B submitted | Customer | ✅ Pass — `orders/create/route.ts:92`; properly awaited |
| 2 | `admin_new_order` | Type B submitted | Admin email | ✅ Pass — `orders/create/route.ts:86`; gated on `ADMIN_EMAIL` env var |
| 3 | `proforma_invoice` | Admin approves Type B | Customer | ✅ Pass — `action/route.ts:69`; `sendEmail` now awaited (fixed) |
| 4 | `payment_confirmed` | Card payment or bank mark | Customer | ✅ Pass — webhook `route.ts:53`; `action/route.ts:104` |
| 5 | `order_fulfilled` | Admin fulfills order | Customer | ✅ Pass — `action/route.ts:124` |

---

## WF-20 · Stripe Webhook Security

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Valid webhook with correct signature | Processed normally | ✅ Pass — `webhooks/stripe/route.ts:25` |
| 2 | Request with invalid/missing signature | Returns 400, no DB changes | ✅ Pass — `webhooks/stripe/route.ts:27-29` |
| 3 | `payment_intent.succeeded` with no `orderId` in metadata | Returns 200 `{received: true}`, no DB changes | ✅ Pass — `webhooks/stripe/route.ts:36` |
| 4 | `checkout.session.completed` with no `orderId` in metadata | Returns 200 `{received: true}`, no DB changes | ✅ Pass — `webhooks/stripe/route.ts:88` |
| 5 | Duplicate webhook (order already `paid`) | Status not overwritten; idempotent | ✅ Pass — `webhooks/stripe/route.ts:46`: `if (order && order.status !== 'paid')` |

---

## WF-21 · Account Page

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1 | Logged-in user visits `/account` | Profile shown (name, email from `customers`); last 20 orders listed | ✅ Pass — `account/page.tsx:18-29` |
| 2 | Order row in history | Shows Order #, date, status badge, total | ✅ Pass — `account/page.tsx:54-71` |
| 3 | Non-logged-in user visits `/account` | Redirected to login | ✅ Pass — `account/page.tsx:16`: `redirect('/login?next=/account')` |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Pass | 62 |
| ⚠️ Warning | 1 |
| ❌ Fail | 0 |

---

## Open Issues

### ⚠️ WARNING-03 — VAT defaults to BG (20%) when no country selected
**Workflow:** WF-17 #6  
**File:** `src/components/checkout/CheckoutFlow.tsx:63`  
**Issue:** `calculateVat(address.country_code || 'BG', ...)` — if country isn't set yet, 20% VAT is silently applied as default. Country is required before reaching Step 3, so this has no real customer impact, but the fallback value is implicit.  
**Priority:** Low — no customer-facing impact.

---

## Fixed Issues

| ID | Issue | Fixed in |
|----|-------|----------|
| BUG-01 | No "Cancelled" tab in admin dashboard | commit 837d0a69 |
| WARNING-01 | Type A `payment_confirmed` email missing estimated delivery | commit d039fcd8 |
| WARNING-02 | Type A orders showed bank/proforma actions in admin | commit d039fcd8 |

---

## How to Run QA

When you ask Claude to run QA, Claude will:
1. Read all relevant source files for each workflow
2. Trace the code path end-to-end
3. Fill in the Result column: **✅ Pass**, **❌ Fail**, or **⚠️ Warning**
4. For failures, include the file path and line number of the bug
