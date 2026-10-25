# Don Corte Fino — Website, Online Store and Admin Portal Plan

> Premium Wagyu butchery · Santa Cruz de la Sierra, Bolivia
> Status: **planning only, no code yet** · v2: updated with the owner's answers (see §11)

---

## 0. What we're building

1. **A landing page** that looks and moves like a luxury brand.
2. **A cut guide.** Every Wagyu cut can be clicked. Each one teaches the customer where it comes from on the animal, what makes it special, how to cook it, which dishes and recipes to try, and what to pair it with.
3. **An online store.** Customers fill a basket by kilo, by portion or by pack, with options (thickness, grade, how it's cut), then check out over **WhatsApp**.
4. **An admin portal** for running the site: products, cut content, recipes, prices, **inventory in kg**, orders, delivery zones and promotions.

The site is **bilingual, Spanish and English, with a language switch** (Spanish by default, because many foreigners live in Santa Cruz). See §9.2.

---

## 1. Brand system (taken from the logo)

### 1.1 Colours
Measured from the original logo file (`public/brand/logo.jpg`).

| Token | Hex (approx.) | Use |
|---|---|---|
| `--noir` | `#141413` | Darkest sections, page edges |
| `--charcoal` | `#1D1D1C` | **Main background** (exact logo background) |
| `--burgundy` | `#61212F` | **Main brand colour** (bull head, "DON"): buttons, highlights, gradients |
| `--burgundy-deep` | `#4E1C28` | Gradient shadows, hover states |
| `--wine` | `#7E2C3E` | Gradient highlights, active states (a lighter step of the burgundy) |
| `--bone` | `#EAE3CF` | Headlines (the "CORTE FINO" cream) |
| `--champagne` | `#D6C5A7` | Tagline beige, thin divider lines, small details |
| `--steel` | `#CEC6B8` | Silver accents (the cleaver) |
| `--ash` | `#8A817A` | Secondary text |

**Signature gradients**
- *Burgundy velvet:* `radial-gradient(at 30% 20%, #7E2C3E, #61212F 40%, #4E1C28 75%, #1D1D1C 100%)`
- *Card sheen:* charcoal → burgundy-deep at 0–8% opacity, plus a moving champagne highlight on hover
- *Gold rule:* a thin line that fades out at both ends, like the two bars beside "DON" in the logo

**Patterns and textures**
- **Marbling motif:** an SVG pattern of fine beige veins (like Wagyu fat) on burgundy or black. Used at low opacity behind sections and inside cards. This is the brand's visual signature.
- Light film grain over the whole site so the black isn't flat.
- Thin champagne lines and small diamond separators (the logo's "PREMIUM ✦ QUALITY").

### 1.2 Typography (matched to the logo)
| Role | Font | Why |
|---|---|---|
| Display (hero, cut names) | **Cinzel** (or **Cormorant SC** as an alternative) | High-contrast classical capitals, like "CORTE FINO" |
| Editorial body and quotes | **Cormorant Garamond** | Elegant serif for the education text |
| UI, labels, prices, buttons | **Montserrat** (widely spaced capitals) | Matches "PREMIUM WAGYU BUTCHERY" |

> ✅ Confirmed: the fonts follow the logo. Before the build we'll compare Cinzel and Cormorant SC side by side against the logo and keep whichever matches better.

### 1.3 Voice
Short, confident Spanish lines that match your Instagram: *"No es solo carne… es Wagyu."*, *"¿Comer o disfrutar?"*, *"Solo con Wagyu."* We reuse these as hero lines and section headings.

---

## 2. Your media (Google Drive audit)

The folder has **13 files: 9 images and 4 videos**. Two pairs look like duplicates (same file size).

| Type | What it is | How we use it |
|---|---|---|
| 4 × MP4 reels | Social video | **Hero background loop** and "process / experience" sections. We'll compress them into short, silent, looping web videos |
| ~6 × JPG promo posts | Instagram posts with text baked in ("El amor de mamá merece algo extraordinario", "Saborea la experiencia…", "¿Comer o disfrutar? … Carne común", "No todos los churrascos…") | **Social proof / Instagram strip.** Not good as product photos because of the text on them. The "Wagyu vs. carne común" comparison is great for the education section |
| Logo (1024×1024, the image you sent in chat) | Sharp, saved at `public/brand/logo.jpg` | We use it as is. For the "draws itself" animation we trace the bull and cleaver into a vector outline |

**✅ Decision:** all product, cut, recipe and section photos will be **AI-generated** in one consistent style: realistic Wagyu × Angus beef on a **black background**. See §2.1 and `docs/IMAGE_PROMPTS.md`.

### 2.1 AI image plan
- **One look for every image:** black background, a single soft light from above left, a faint glow on the edges, slate or dark wood board, coarse salt, small touches of rosemary. Raw meat is rich red with **fine white marbling that looks realistic for Wagyu × Angus** (around BMS 4–7). Not the extreme, almost-white Japanese A5 look, because customers have to receive what they see.
- **Shots for each cut:** (1) raw hero shot, 4:5; (2) cooked and sliced to show the pink centre, 4:5; (3) close-up of the marbling, 1:1 (used for card hover and zoom).
- **Site images:** hero still, fire and grill, knife and board, gift box, process steps, 10–15 recipe and dish photos.
- **Quality check before using any image:** realistic fibres and fat, no melted or warped shapes, no text, no extra bones, cut shape matches its real anatomy. Anything that fails is regenerated.
- **Honesty:** product images carry a small "Imagen referencial" / "Reference image" note. We can swap in real photos later from the admin portal without touching code.
- **Format:** generated at the highest resolution available, exported as AVIF/WebP, and sized automatically for each screen.

---

## 3. Site map

```
/                       Landing page (one long scroll, see §4)
/cortes                 Cut guide: interactive cow map + grid of all cuts
/cortes/[slug]          Cut detail page (education + buy)
/tienda                 Full store (filters: cut, grade, price, cooking method)
/tienda/[slug]          Product page (often the same as the cut page with the buy panel open)
/recetas                Recipe library
/recetas/[slug]         Recipe detail
/regalos                Gift boxes / experiences
/nosotros               Brand story, where the Wagyu comes from, grading explained
/entregas               Delivery zones, times, FAQ
/carrito                (drawer on every page, full page on mobile)
/checkout               Delivery details → sends the order to WhatsApp
/pedido/[id]            Order confirmation / "your WhatsApp message is ready"
/admin/**               Admin portal (§8)
```

---

## 4. Landing page, section by section

| # | Section | Content | Motion |
|---|---|---|---|
| 0 | **Preloader** | Logo on black | Bull outline and cleaver draw in (SVG stroke), "DON CORTE FINO" appears letter by letter, burgundy curtain wipes up |
| 1 | **Hero** | Full-screen reel loop, headline *"No es solo carne… es Wagyu."*, buttons: **Ver cortes** / **Comprar ahora** | Words rise one at a time behind a mask, video zooms slightly as you scroll, scroll cue animates |
| 2 | **Manifesto** | 2–3 lines about origin and craft | Large serif text fills from grey to beige as you scroll |
| 3 | **What makes Wagyu different** | Marbling explained, BMS scale 1–12, "Wagyu vs. carne común" (your post) | Before/after slider, marbling pattern spreads in, animated number counters |
| 4 | **Interactive cow map** | Outline of the animal split into primals (chuck, rib, loin, tenderloin, rump, brisket, plate, flank) | Hovering a primal highlights it in burgundy and shows its cuts. Clicking opens the cut page |
| 5 | **Signature cuts** | Horizontal scroll locked in place, 6–8 large cut cards | Cards tilt in 3D, light sweeps across on hover, image zooms, price and "Agregar" slide up |
| 6 | **The experience / process** | From selection to dry-aging to vacuum packing to delivery | Numbered steps that fill in as you scroll, video pieces between them |
| 7 | **Store preview** | Best sellers, with quick add to basket | Cards appear in a staggered cascade, product image "flies" into the basket on add |
| 8 | **Gift boxes / experiences** | "Caja Parrillera", "Experiencia Omakase", gift card | Box-opening reveal animation |
| 9 | **Recipes** | 3 featured recipes | Image and text move at different speeds (parallax), underline draws in |
| 10 | **Instagram / social proof** | Your posts and reels, testimonials | Endless horizontal strip, pauses on hover |
| 11 | **Delivery** | Santa Cruz zones, times, "Pedidos: 776 65567" | Map pin drops in, zones fade in |
| 12 | **Footer** | Logo, hours, WhatsApp, Instagram, TikTok, address | Very large "DON CORTE FINO" text drifts sideways |

Floating on every page: **WhatsApp button** (pulses gently), **basket icon** (shows item count, bounces when something is added).

---

## 5. Cut guide (education)

**About the breed (✅ confirmed): Wagyu × Angus.** A section on cut pages and on `/nosotros` explains what this cross means in plain words. Wagyu brings the fine marbling and buttery feel. Angus brings deep beef flavour, size and a firmer texture. The result is consistent marbling at a better price than full-blood Wagyu. You'll review this text, and it's editable in the admin portal.

### 5.1 Starting list of cuts (you confirm these and the prices)
> ✅ Some cuts are sold **by kg** and some **another way** (steak, pack, unit). Every product sets its own way of selling in the admin portal (§6.1), so the final mix can change at any time. We start with this list and placeholder prices, and you correct both in the admin portal.
| Primal | Cut (ES / EN) | Notes |
|---|---|---|
| Rib (Costillar) | **Ojo de Bife / Ribeye**, **Tomahawk**, **Bife Ancho** | The flagship cuts |
| Loin (Lomo alto) | **Bife Angosto / Striploin**, **T-Bone** | |
| Tenderloin | **Lomo / Filet Mignon** | Most tender |
| Rump (Cuadril) | **Picaña**, **Colita de Cuadril / Tri-tip** | Very popular in Santa Cruz |
| Chuck (Aguja) | **Denver**, **Flat Iron (Marucha)**, **Chuck Roll** | Good value Wagyu |
| Plate / Flank | **Entraña / Skirt**, **Vacío / Flank**, **Matambre** | For churrasco |
| Short rib | **Tira de Asado / Short Ribs** | Grill or slow cook |
| Brisket | **Pecho / Brisket** | Smoking |
| Specials | **Hamburguesa Wagyu**, **Carne molida Wagyu**, **Yakiniku / Shabu sliced** | Prepared products |

### 5.2 Cut detail page layout
1. **Hero:** large cut photo, name in Cinzel, grade badge (e.g. *BMS 6–7*), price per kg
2. **Where it comes from:** small cow diagram with this cut highlighted, plus 2–3 lines on the muscle and why it's tender or flavourful
3. **Profile meters** (bars that fill in on scroll): Tenderness · Marbling · Flavour · Juiciness, each out of 5
4. **Best traits:** 3 short highlights with icons
5. **How to cook it:** ✓/✗ for each method (grill, pan, oven, sous-vide, smoker), recommended thickness, **doneness temperatures** (rare 50 °C … medium 60 °C), resting time
6. **Suggested dishes:** cards such as "Churrasco a la parrilla", "Tataki", "Steak frites"
7. **Recipes:** 1–3 full recipes (ingredients, steps, time, difficulty), each with a link to its recipe page
8. **Pairings:** wine (e.g. Tannat, Malbec), sides, sauces (chimichurri, salsa criolla)
9. **Buy panel** (stays on screen as you scroll): the options from §6
10. **Pairs well with:** other cuts and add-ons

All of this content is managed in the admin portal (§8), so you can add or edit cuts without touching code.

---

## 6. Store and checkout

### 6.1 How products are sold
Each product can be sold one or more of these ways:

| Way | Example | How the price works |
|---|---|---|
| **By weight** | Picaña: 0.5 / 1 / 1.5 / 2 kg, or a custom amount in 250 g steps | price per kg × kg, **marked as an estimate** (the final weight is confirmed on WhatsApp) |
| **By portion / steak** | Ribeye steak 2 cm (~300 g) / 3 cm (~450 g) / 4 cm (~600 g) × quantity | price per portion or per kg × estimated weight |
| **By pack / box** | "Caja Parrillera 3 kg", "Burger pack ×6" | fixed price |
| **Add-ons** | Sea salt, chimichurri, charcoal, gift wrap | fixed price |

**Options on a product** (any mix):
- **Grade / marbling:** BMS 4–5 · 6–7 · 8–9 (each with its own price)
- **Thickness:** 2 / 3 / 4 cm
- **Preparation:** whole piece · steaks · sliced for yakiniku · sliced for shabu-shabu · ground
- **Packaging:** standard vacuum pack · gift presentation
- **Note for the butcher** (free text)

### 6.2 Basket
- A drawer that slides in from the right (full screen on mobile), with the "fly to basket" animation when you add something
- Change quantity or weight right in the basket. Subtotal is shown as **estimated**, with a short "why" note
- Saved in the browser, so a returning customer still has their basket
- **Upsell bar:** "Add chimichurri for Bs X" · "You're Bs X away from free delivery"
- Minimum order and free-delivery threshold are set in the admin portal

### 6.3 Checkout and WhatsApp handoff
1. **Delivery or pickup.** For delivery the customer drops a pin or shares their location. The fee is **Bs 3 per km** of driving distance from the store, rounded up to the next km (e.g. 7.3 km → 8 km → **Bs 24**). Pickup is free.
   - The store location, price per km, and an optional minimum fee or maximum distance are set in **Admin → Settings**.
   - **Until the store location is set**, the site says "Envío calculado por WhatsApp / Delivery fee confirmed on WhatsApp", and the order still goes through.
   - Distance comes from a routing service (Google Distance Matrix or OpenRouteService), with straight-line distance × 1.3 as a backup.
2. **Date and time slot** (based on the opening hours set in admin)
3. Name, phone, address, map link, delivery notes
4. Optional **discount code**
5. **"Confirmar por WhatsApp"**:
   - the order is **saved first** (status `nuevo`) with an order number such as `DCF-1042`
   - then it opens `https://wa.me/59177665567?text=<the order, pre-written>` (✅ number confirmed: **+591 776 65567**, the one on your posts. It can be changed in Settings)
   - a confirmation page appears with an "Open WhatsApp again" button, in case the app didn't open

**The pre-written WhatsApp message:**
```
🥩 *DON CORTE FINO — Pedido DCF-1042*
━━━━━━━━━━━━━━
• Picaña Wagyu BMS 6–7 — 1.5 kg (entera) — Bs ~XXX
• Ojo de Bife 3 cm ×2 (~0.9 kg) — Bs ~XXX
• Chimichurri de la casa ×1 — Bs XX
━━━━━━━━━━━━━━
Subtotal estimado: Bs XXX
Envío (Equipetrol): Bs XX
*Total estimado: Bs XXX*

📍 Entrega: Sáb 14/11, 12:00–14:00
👤 Nombre · 📞 Teléfono
🏠 Dirección / ubicación
📝 Notas
```
**Payment (✅ decided): cash or QR.** The customer picks one at checkout and the WhatsApp message includes it.
- *Efectivo contra entrega / Cash on delivery.* The message says the final amount is confirmed after weighing.
- *QR.* Your QR image (uploaded in Admin → Settings) shows on the confirmation page, and the message says to pay once the final total is confirmed.
- In the admin portal each order has a payment status: `pendiente → pagado`.

### 6.4 Launch offers (3 options, all built, you choose later)
All three are in `data/seed/catalog.json`. Each one has an **on/off switch in Admin → Promotions**, so you can launch one, two or all three. Whichever is on gets the homepage launch banner, an announcement bar, a numbered countdown (for limited ones) and its own landing section.

| | **A · Caja Inaugural / Opening Box** | **B · Club Fundadores / Founders' Club** | **C · Experiencia Degustación / Tasting Experience** |
|---|---|---|---|
| What it is | A limited **bundle box**: Ojo de Bife 2×3 cm (~0.9 kg), Picaña 1 kg, Entraña 0.5 kg, Burgers ×4, Chimichurri, Sea salt + black gift box and cooking guide card | A **discount code** `FUNDADOR15`: **15% off** the first order (minimum Bs 400) + **free delivery up to 10 km** + early WhatsApp access to new batches | A **tasting box**: 4 × 250 g of Ojo de Bife, Bife Angosto, Lomo and Picaña + sea salt + tasting card with QR codes to each cut's guide |
| Price | Regular ~Bs 1,002 → **Bs 849** | –15% on the basket | Regular ~Bs 395 → **Bs 329** |
| Limit | **50 numbered boxes**, 30 days | First **100 customers**, 30 days | No limit, can stay as a permanent entry product |
| Purpose | Prestige, a big first order, makes a great gift | Gets many people to place a first order, builds the VIP list | Easy first try for new customers. A follow-up **10% coupon** on their favourite cut brings them back |
| Best if… | Your audience already trusts the brand (Instagram followers) | You want as many customers as possible fast | You're mainly reaching people who have never tried Wagyu |

### 6.5 Sales funnel
- **Ways in:** Instagram/TikTok bio link → landing page · links to a specific cut (`/cortes/picana`) from posts · gift campaigns (Mother's Day, Father's Day, Christmas)
- **Getting people to buy:** education builds trust → "Comprar" on every cut page → bundles and gift boxes → free-delivery threshold → small, tasteful notices ("Pocas unidades", "Más vendido")
- **Getting them back:** a VIP list (WhatsApp number or email) for new batches. The admin portal shows orders that were started but not confirmed, so you can follow up yourself on WhatsApp
- **Tracking:** Meta Pixel and Google Analytics 4 events (view cut, add to basket, start checkout, WhatsApp handoff), so ads can optimise for real purchase intent

---

## 7. Motion and interaction

**Tools:** GSAP + ScrollTrigger (scroll animations, locked sections), Lenis (smooth scrolling), Framer Motion (page transitions, basket drawer, small interactions), SplitType (letter and line text reveals).

| Pattern | Where |
|---|---|
| Text revealed line by line behind a mask | All headings |
| Letter-by-letter appearance | Preloader, hero, cut names |
| Text that fills with colour as you scroll | Manifesto |
| Layers moving at different speeds (parallax) | Hero video, recipe images, marbling textures |
| Horizontal scroll locked in place | Signature cuts |
| **Card hover:** 3D tilt + light sweep + burgundy glow at the edges | Every product, cut and recipe card |
| Staggered fade-in as cards appear | Grids |
| Buttons that lean toward the cursor + fill effect | Main buttons |
| Custom cursor (small ring that grows over cards) | Desktop only |
| Burgundy curtain between pages | Moving between pages |
| Fly-to-basket + count bounce | Add to basket |
| Number counters, meter bars filling | Education sections |
| SVG line drawing | Logo, cow map, process steps |

**Guardrails:** follows the phone's "reduce motion" setting (animations switch to simple fades), lighter effects on mobile, nothing animates in a way that makes the layout jump, and the page should feel smooth on a mid-range Android phone (most traffic will come from Instagram on mobile).

---

## 8. Admin portal (`/admin`)

Protected login with roles: **Owner** (everything), **Staff** (orders and stock), **Editor** (content only).

| Module | What you can do |
|---|---|
| **Dashboard** | Today's and this week's orders, estimated vs. confirmed revenue, best-selling cuts, **low-stock alerts**, orders waiting for confirmation |
| **Orders** | List with filters. Status flow: `nuevo → confirmado → preparando → en camino → entregado` (or `cancelado`). **Enter the actual weight and final price** for weighed items. Re-send the WhatsApp message, print a packing slip, add internal notes |
| **Products** | Create, edit, delete. Name, photos and video, sale method (§6.1), options and prices, status (active / sold out / hidden), "featured" and "best seller" flags, display order |
| **Cut content** | Everything on the cut detail page: primal on the cow map, description, meters, cooking methods, temperatures, dishes, pairings, linked recipes |
| **Recipes** | Create and edit recipes, linked to cuts |
| **Inventory** | Stock **in kg** for each cut and grade, plus unit counts for packs. **Batches** (arrival date, supplier, kg received, cost per kg). Stock is deducted when an order is *confirmed*, not when someone opens WhatsApp. Manual adjustments with a reason (waste, trim, tasting) and a full history. Alerts at a level you choose. Automatically shows "Agotado" on the site at zero |
| **Customers** | Built from orders: name, phone, order history, total spent, VIP flag |
| **Promotions** | Discount codes (% or fixed amount, minimum spend, expiry date, use limit), free-delivery threshold, gift box campaigns |
| **Delivery and settings** | Zones and fees, opening hours and time slots, minimum order, **WhatsApp number**, social links, payment info shown to customers |
| **Site content** | Hero text and video, announcement bar, homepage sections on/off and their order, FAQ, "Nosotros" text, photo library |
| **Reports** | Sales by cut, stock movements, profit margin per batch (cost vs. price), CSV export |

---

## 9. Technical design

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Fast first load, good for SEO, store and admin portal in one project |
| Styling | **Tailwind CSS** with the brand colours and fonts as tokens | Keeps the design consistent |
| Animation | GSAP + ScrollTrigger, Lenis, Framer Motion, SplitType | See §7 |
| Database, login, files | **Supabase** (Postgres, Auth, Storage, access rules) | Admin portal, inventory, orders. Already connected to this workspace |
| Hosting | **Vercel** | Global CDN, preview link for every change. Already connected |
| Images and video | Next/Image + Supabase Storage; videos compressed to MP4/WebM with a cover image | Fast loading on mobile data |
| Forms | React Hook Form + Zod | Checking checkout and admin forms |
| Analytics | GA4 + Meta Pixel | Funnel tracking |
| SEO | Product, Recipe and LocalBusiness structured data, Open Graph images per cut, sitemap | Show up for "wagyu santa cruz" and similar searches |

### 9.1 Data model (first draft)
> Every customer-facing text field exists in both languages (`*_es` / `*_en`, or a `jsonb {es, en}`). The admin portal shows Spanish and English tabs for each item.
```
primals         (id, slug, name, svg_path_id, order)
cuts            (id, slug, primal_id, name_es, name_en, summary, story,
                 tenderness, marbling, flavor, juiciness,
                 cooking_methods jsonb, temps jsonb, dishes jsonb, pairings jsonb,
                 hero_media_id, published)
products        (id, slug, cut_id?, name, type[weight|portion|pack|addon],
                 base_price, price_unit[kg|unit], min_qty, step_qty,
                 status[active|sold_out|hidden], featured, badge, sort)
product_options (id, product_id, group[grade|thickness|prep|packaging], label,
                 price_delta | price_per_kg_override, est_weight_kg)
recipes         (id, slug, title, time, difficulty, ingredients jsonb, steps jsonb,
                 media_id, published)
cut_recipes     (cut_id, recipe_id)
inventory_lots  (id, cut_id, grade, supplier, received_at, kg_received,
                 kg_remaining, cost_per_kg)
stock_movements (id, lot_id, product_id, delta_kg|delta_units,
                 reason[sale|adjust|waste|return], order_id?, user_id, created_at)
orders          (id, code, status, customer_id, zone_id, slot_start, slot_end,
                 fulfillment[delivery|pickup], address, notes,
                 subtotal_est, subtotal_final, delivery_fee, discount, total_final,
                 whatsapp_sent_at, created_at)
order_items     (id, order_id, product_id, options jsonb, qty, est_kg, final_kg,
                 unit_price, line_est, line_final)
customers       (id, name, phone, email?, vip, created_at)
zones           (id, name, fee, min_order, active)
promotions      (id, code, type, value, min_subtotal, starts_at, ends_at, max_uses, used)
settings        (key, value jsonb)         -- whatsapp number, hours, slots, banner
media           (id, url, kind, alt, width, height)
profiles        (user_id, role[owner|staff|editor])
```
Access rules: the public site can only *read* published content and *create* orders. Everything else needs a staff login.

### 9.2 Two languages (Spanish / English)
- `next-intl`, with addresses like `/es/...` and `/en/...`. Spanish is the default and is used on the first visit unless the browser is set to English. The choice is remembered.
- **ES | EN switch** in the top menu and the mobile menu. Switching keeps you on the same page (e.g. `/es/cortes/picana` ↔ `/en/cuts/picanha`).
- Fixed interface text lives in `messages/es.json` and `messages/en.json`. Product, cut and recipe text comes from the database in both languages.
- **The WhatsApp order message follows the customer's language**, so foreign customers write in English and your team sees it right away.
- Search engines are told about both language versions, and the sitemap lists both.
- Prices are always in **Bolivianos (Bs)**. English pages may show an approximate USD price next to it (optional, exchange rate set in admin).

---

## 10. Build phases

| Phase | What gets built | Done when |
|---|---|---|
| **0. Images** | Generate and check every cut, recipe and section image (§2.1) | Approved image set in `public/media` |
| **1. Foundations** | Project setup, brand colours and fonts, base components (buttons, cards, marbling pattern, gradients), animation base (smooth scroll, text reveals, page transitions), compressed media | A style guide page shows every component with its animations |
| **2. Landing page** | All sections in §4 with placeholder content | Smooth, responsive landing page on a Vercel preview link |
| **3. Cut guide** | Database setup and starter data, interactive cow map, cut list, cut detail pages, recipes | Every cut in §5.1 has a working page |
| **4. Store and checkout** | Product options, basket, checkout, saving orders, WhatsApp message, discount codes, delivery zones | A full test order arrives on WhatsApp with the right message |
| **5. Admin portal** | Login and roles, dashboard, orders, products and cut content, inventory and batches, settings, promotions | You can run a full day of orders from the admin portal alone |
| **6. Polish and launch** | SEO, analytics, accessibility and speed checks, testing on real phones, connecting your domain | Live on your domain |

---

## 11. Decisions and open items

**✅ Decided**
| Topic | Decision |
|---|---|
| WhatsApp | **+591 776 65567** (the number on your posts) |
| Images | AI-generated, realistic Wagyu on a black background (§2.1) |
| Breed | **Wagyu × Angus**, explained on the site (§5) |
| Ways to sell | Some cuts by kg, others by steak, pack or unit, set per product (§6.1) |
| Catalogue | **All premium cuts with placeholder prices**: 18 cuts and prepared products + 4 add-ons, two grades (Selección BMS 4–5 / Reserva BMS 6–7, +20%), loaded from `data/seed/catalog.json` |
| Delivery | **Bs 3 per km** from the store, rounded up. Store location set later in Admin |
| Payment | **Cash on delivery or QR** |
| Launch offer | **3 options built** (§6.4), switched on/off in Admin |
| Logo and fonts | Use the logo you sent as is. Fonts follow the logo (§1.2) |
| Languages | Spanish (default) + English, with a switch (§9.2) |
| Hosting and domain | Vercel. Domain connected at launch |

**⏳ Still open (none of these block the start; placeholders until then)**
1. Real prices (placeholders until then, editable in admin)
2. **Store location** (for the per-km fee and pickup), opening hours, minimum order
3. Your **payment QR image**
4. Which **launch offer(s)** to switch on
5. **How to generate the images** (see the summary message): an image API key in the environment, or you run the prompts yourself
