# Mariya Mobile Bazar — মারিয়া মোবাইল বাজার

Production-ready e-commerce site for a mobile phone shop in **Benapole, Jessore, Bangladesh**.
Currency **৳ BDT**, Bengali-first with an English toggle, white/black/red branding, mobile-first.

Stack: **Next.js (App Router) + PostgreSQL + Drizzle ORM**, server-side sessions, no third-party paid service required.

---

## 1. What is implemented (and working)

| Area | Status |
|---|---|
| Homepage with phone cards immediately below a compact promo banner | ✅ live from the database |
| Product cards: image, model, original + offer price, colours, stock badge, **অর্ডার নাও** | ✅ |
| Product search, filters (category, brand, price, discount, stock), sorting | ✅ |
| Product detail page, specs, warranty, related products, SEO + JSON-LD | ✅ |
| Order form with name / phone / address / district / product / quantity | ✅ |
| Applicable fee (IMEI registration) — configurable, **off by default** | ✅ |
| Advance payment + remaining balance calculation (server-side) | ✅ |
| bKash / Nagad payment instructions page with TrxID + sender number form | ✅ |
| Payment claims stored as **যাচাই অপেক্ষমাণ**, orders as **অনুমোদনের অপেক্ষায়** | ✅ |
| Admin payment verification → approve / reject with reason | ✅ |
| Separate payment status and fulfilment status | ✅ |
| Duplicate TrxID + duplicate approval + duplicate order processing protection | ✅ (DB unique index + guarded updates) |
| Customer order tracking, order history, wishlist, reviews (moderated) | ✅ |
| AI chat assistant grounded in the real database | ✅ |
| Admin panel: products, images, orders, payments, reviews, banners, categories, settings, users, reports, CSV export | ✅ |

**WhatsApp has been removed completely.** There is no floating WhatsApp button and no WhatsApp
contact link anywhere on the storefront. Customer support happens through the chat assistant or a
plain phone call (`tel:` links only).

---

## 2. Money calculation (single source of truth)

```
subtotal        = database price × quantity        (server-side, never from the browser)
applicable fee  = settings["fee.applicable.amount"]  (only when the owner enables it)
total           = subtotal + delivery charge + applicable fee
advance         = settings["payment.advance.amount"]  (capped at total)
amount due      = total − advance
```

Verified test run: subtotal `৳89,900`, delivery `৳0` (free above ৳20,000), fee `৳450`,
total `৳90,350`, advance `৳450`, **due `৳89,900`** — the advance is deducted, never added twice.

The logic lives in `src/lib/settings.ts → computeTotals()` and is used by the order form, the
order API and the payment page.

---

## 3. Payment workflow (manual verification — nothing is faked)

1. Customer taps **অর্ডার নাও** → `/order/[slug]` → fills the form → **কনফার্ম করুন**.
2. Server computes totals, decrements stock and creates the order
   (`status=awaiting_payment`, `paymentStatus=unsubmitted`).
3. Customer is sent to `/payment/[orderNumber]` which shows:
   - bKash / Nagad number + **account type** (merchant → "Payment" option, personal → "Send Money")
   - exact advance amount, the order reference, and the instruction text
   - TrxID field + sender phone field + **পেমেন্ট তথ্য জমা দিন**
4. Submitting sets `paymentStatus = pending_verification` (যাচাই অপেক্ষমাণ) and
   `status = awaiting_approval` (অনুমোদনের অপেক্ষায়).
   A TrxID **never** marks a payment as paid.
5. Admin opens **Admin → Payments**, compares the TrxID/sender number with the bKash / Nagad
   statement or merchant dashboard, then **Verify & approve** or **Reject** (reason required).
6. Approving sets `paymentStatus=verified` and `status=confirmed` in one guarded transaction.
   Only then do packing / shipping / delivery become available.
7. The customer sees the real status (and the rejection reason) on `/track` and in their account.

Guards in place:
- `payment_claims` has a **unique index on (method, trx_id)** — the same TrxID cannot be reused.
- Claim review uses `WHERE status='pending'`; order updates use `WHERE payment_status='...'`, so a
  second concurrent approval is impossible.
- Fulfilment transitions are rejected server-side unless the payment is verified.
- Cancelling/rejecting an order returns its stock to inventory.

---

## 4. What YOU must configure (nothing is invented for you)

### 4.1 Admin account — one-time owner setup (no pre-made account)
There is **no auto-created admin and no public admin registration page**.

1. Open `/admin`. Because zero admins exist yet, you see a **one-time account setup** screen.
2. Enter your name, email, phone (optional) and a strong password (8+ chars, letter + number).
3. Tap **অ্যাকাউন্ট খুলুন**. The setup page is **permanently closed** the instant the first admin
   exists — the API hard-refuses any further setup (`Admin setup is already complete`).
4. Log in immediately with the account you just created.

Only you (and admins you later create from **Admin → Admins**) can access the panel. Every admin
route enforces the admin role on the backend; the setup endpoint is rate-limited (5 tries / 15 min)
and its action is written to the audit log.

### 4.2 Payment numbers (required before you can accept online advances)
Go to **Admin → Settings → Payment, advance and applicable fee**:

| Setting | Meaning |
|---|---|
| `payment.bkash.enabled` / `number` / `type` | your real bKash number; `merchant` = customers use *Payment*, `personal` = *Send Money* |
| `payment.nagad.enabled` / `number` / `type` | your real Nagad number |
| `payment.advance.enabled` / `amount` | advance collected at order time (e.g. 450) |
| `fee.applicable.enabled` / `amount` / `labelBn` / `noticeBn` | the applicable charge and the exact Bengali notice |

**Channels stay disabled until you save a real number** — the payment page then explains that no
online advance is being collected rather than showing a made-up number.

### 4.3 The IMEI / government fee notice
The notice text is:
> “IMEI রেজিস্ট্রেশন / প্রযোজ্য সরকারি ফি: ৪৫০ টাকা অগ্রিম প্রদান করতে হবে। এই অর্থ অর্ডারের মোট মূল্যের সঙ্গে সমন্বয় করা হবে।”

It is **hidden by default** (`fee.applicable.enabled = 0`). Turn it on only after you have verified
the charge and its legal basis yourself; you can edit both the amount and the wording in the admin
panel. Nothing on the site labels a fee as government-mandated until you enable it.

### 4.4 Store details
**Admin → Settings → Store information**: names, taglines, phone, address, opening hours, social
links, delivery charges per district (all 64 districts), free-delivery threshold, return policy.

### 4.5 Optional: AI answers for the chat assistant
The assistant already answers from the database with **no API key**. To let an LLM phrase the
replies, set one of:

```
OPENAI_API_KEY=...        (optional OPENAI_MODEL, default gpt-4o-mini)
ANTHROPIC_API_KEY=...     (optional ANTHROPIC_MODEL, default claude-3-5-haiku-latest)
```

Keys are read **server-side only** in `/api/chat` and are never sent to the browser. If a key is
missing or the request fails, the grounded responder takes over — the chat never invents prices,
stock, warranty or payment status.

### 4.6 Optional: password-reset emails
`/forgot-password` stores a hashed, 1-hour token. Without email configuration the link is written
to the server log and the customer is told to call the shop (an admin can also reset any password
from **Admin → Admins**). To send real emails set:

```
RESEND_API_KEY=...
RESEND_FROM="Mariya Mobile Bazar <noreply@yourdomain.com>"
```

---

## 5. Deployment

```bash
# 1. Environment
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=$(openssl rand -hex 32)     # signs session cookies
ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD=<strong-password>
SITE_URL=https://yourdomain.com            # used by sitemap.xml

# 2. Install, migrate, build, start
npm install
npx drizzle-kit push        # creates/updates all tables
npm run build
npm start
```

Suggested hosts: Vercel (app) + Neon/Supabase/RDS (PostgreSQL), or any Node host with a managed
Postgres. `SESSION_SECRET` must be the same across instances; for multiple instances move the rate
limiter in `src/lib/ratelimit.ts` to Redis.

Health check: `GET /api/health` → `{"ok":true}`.

**No paid billing is enabled by this project.** The bKash/Nagad flow is manual verification. If you
later want automatic verification you must create a bKash/Nagad merchant account yourself and add
their API credentials — that is intentionally not wired up here.

---

## 6. Managing the shop from an Android phone

1. Open `/admin` in Chrome, log in with your admin email/password, and tap **Add to Home screen**.
2. **Add a product**: *Products → + Add product* → fill brand, model, Bengali + English names,
   regular price, offer price (discount % is calculated automatically), stock, RAM/storage/colours,
   warranty, description and spec rows → *Upload from phone* to attach photos straight from the
   camera or gallery → toggle **Published** → **Create product**.
3. **Change price or stock fast**: *Products* → edit the inline Stock / Regular price / Offer price
   fields on the card → **Save**.
4. **Verify a payment**: *Payments* → check the TrxID and sender number against your bKash/Nagad
   statement → **✓ Verify & approve**, or type a reason and **✕ Reject**.
5. **Move an order forward**: *Orders* → tap **Details** → use the status chips
   (approved → packing → shipped → delivered). Cancel/reject asks for a reason and restores stock.
6. **Export**: *Reports → ⬇ Export orders (CSV)* opens in Sheets/Excel.

---

## 7. Testing checklist

### Homepage / catalogue
- [ ] Phone cards appear immediately under the promo banner (no scrolling needed).
- [ ] Each card shows image, model, original price, offer price, colours, stock badge.
- [ ] **অর্ডার নাও** opens the order form; the cart button still works.
- [ ] Language toggle (বাংলা / English) switches the whole page.
- [ ] Search and filters return real results.

### Order form and money
- [ ] Submitting an empty form shows Bengali error messages.
- [ ] Wrong phone format (`12345`) is rejected.
- [ ] Subtotal = database price × quantity.
- [ ] Delivery charge matches the selected district; free above the threshold.
- [ ] Advance is deducted: `due = total − advance` (never `total + advance`).
- [ ] With the fee disabled, the IMEI notice does **not** appear.

### Payment
- [ ] Payment page shows only channels you enabled, with the account type label.
- [ ] TrxID shorter than 6 characters is rejected.
- [ ] Submitting once works; submitting again is blocked.
- [ ] Reusing the same TrxID on another order is blocked.
- [ ] Status shows যাচাই অপেক্ষমাণ / অনুমোদনের অপেক্ষায় — **not** paid.

### Admin / security
- [ ] `/admin` shows only the login screen when not signed in.
- [ ] Calling `/api/admin/actions` without an admin session returns 403.
- [ ] A customer account cannot open `/admin` or any admin API.
- [ ] Packing/shipping/delivery are blocked until the payment is verified.
- [ ] Approving the same claim twice fails.
- [ ] Audit log records every admin action (Dashboard → audit trail).
- [ ] Password change works and revokes other sessions.

### Tracking / privacy
- [ ] `/track` needs both order number **and** the phone used at checkout.
- [ ] Another phone number cannot see someone else's order.
- [ ] Rejection reason and payment status are visible to the customer.
- [ ] Chat assistant refuses to reveal another customer's order.

### Mobile (Android, Chrome)
- [ ] No horizontal scrolling at 360 px width.
- [ ] Sticky header, hamburger menu, category chips all tappable (44 px targets).
- [ ] Chat bubble opens above the fold and the keyboard does not cover the send button.
- [ ] Product images lazy-load; pages stay fast on 3G.
- [ ] Forms use numeric keyboards for phone/TrxID fields.

---

## 8. Project layout

```
src/app/(shop)/          storefront: home, products, order form, payment, track, account, policies
src/app/admin/           protected admin panel (dashboard, products, orders, payments, reviews,
                         banners, reports, settings, users)
src/app/api/             auth, orders, payment claims, chat, reviews, wishlist, admin actions,
                         media upload/serve, CSV export, health
src/components/          storefront UI (header, product cards, order form, payment form, chat)
src/components/admin/    admin UI
src/db/schema.ts         users, sessions, password resets, categories, products, product images,
                         media files, orders, order items, order events, payment claims, reviews,
                         wishlist, banners, settings, delivery zones, chat messages, audit log
src/lib/                 auth (scrypt + signed sessions), settings/money maths, chatbot,
                         validation (zod), rate limiting, queries, i18n
```

Security notes: scrypt password hashing, HMAC-signed httpOnly session cookies, `requireAdmin()`
enforced in **every** admin route handler (never just hidden buttons), one-time owner account setup
(permanently closed after the first admin exists), zod validation on all inputs, rate limiting on
login/register/review/chat/claim/setup, image uploads restricted to JPEG/PNG/WEBP/GIF ≤ 4 MB, and
an audit log of all admin activity.
