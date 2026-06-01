## Goal
Make MyCampusKart fully SEO-optimized: every public page indexable, with unique meta/OG/canonical, JSON-LD, clean slugged URLs, and a self-updating sitemap.

## 1. SEO-friendly URL structure (backward-compatible)
Add a `slug` column to `items` and `pg_listings` (generated from title + short id suffix, unique). Backfill via migration. Keep old `/item/:id` working via redirect.

New routes (added alongside old):
- `/item/:slug-:id` → ItemDetail (e.g. `/item/iphone-13-pro-mint-condition-ab12cd`)
- `/pg/:slug-:id` → PGDetail
- `/u/:mckId` → PublicProfile (cleaner than `/profile/:mckId`; both kept)
- `/category/:slug` → Browse filtered by category
- `/campus-marketplace/:city` → Browse filtered by city

ItemDetail parses id from end of param; if visited via legacy `/item/:id`, 301-style redirect (Navigate replace) to the slugged URL.

## 2. Per-page SEO via react-helmet-async (already installed)
Wrap every public page in `<SEOHead>` with: title, description, canonical, OG/Twitter, robots. Pages to cover:
- Home/Browse — "Buy & Sell on Your Campus | MyCampusKart"
- ItemDetail — `${title} for ₹${price} in ${location} | MyCampusKart`, OG image = first item image, JSON-LD `Product` with `offers`, `AggregateRating` if reviews
- PGDetail — JSON-LD `Accommodation` / `LodgingBusiness`
- PublicProfile — JSON-LD `Person`, noindex if profile has no listings
- Auth/Reset/Dashboard/Chat/Cart/Orders/KYC/Admin — `noindex,nofollow`
- DownloadApp — `MobileApplication` JSON-LD
- Static pages (about/terms/privacy/help/shipping/report) — proper titles
- Blog hub/post/taxonomy + Campus pages already have SEOHead; add `BreadcrumbList` everywhere

Add sitewide JSON-LD (`Organization` + `WebSite` with `SearchAction` to `/browse?q=`) to `index.html`.

## 3. Dynamic sitemap generation
Replace static `public/sitemap.xml` with `scripts/generate-sitemap.ts` run via `predev`/`prebuild` (`bunx tsx`). Pulls from Supabase using anon key (env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`):
- Static routes (home, browse, blog, campuses, download, static pages)
- All published `blog_posts` (slug + updated_at)
- All active `campus_pages`
- All active `blog_categories` and `blog_tags`
- All non-sold `items` (slugged URL + updated_at)
- All active `pg_listings`
- All public `profiles` with ≥1 listing

Also emit `sitemap-index.xml` if >5k URLs (split items into pages).

## 4. robots.txt
Allow all, block admin/auth/private routes:
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /auth
Disallow: /reset-password
Disallow: /chat
Disallow: /my-
Disallow: /kyc
Disallow: /notifications
Disallow: /scan-qr
Sitemap: https://www.mycampuskart.com/sitemap.xml
```

## 5. index.html cleanup
- Remove duplicate canonical (move per-route)
- Add sitewide `Organization` + `WebSite` JSON-LD
- Add `<link rel="preconnect">` for Supabase + Cloudinary
- Set `lang="en-IN"`
- Add hreflang `en-IN`

## 6. Image SEO & performance
- Add `loading="lazy"` and descriptive `alt` to all `<img>` in listing cards, item detail thumbnails, PG cards, blog cards, avatars
- Use `width`/`height` attrs to prevent CLS
- Cloudinary: serve `f_auto,q_auto`, responsive `srcset` for item detail hero

## 7. Semantic HTML & accessibility
- Single `<h1>` per page (item title, blog title, etc.)
- Convert section wrappers to `<main>`, `<article>`, `<aside>`, `<nav>`
- ARIA labels on icon-only buttons

## 8. Breadcrumbs (visible + JSON-LD)
Add `<Breadcrumbs>` component (already exists in `components/blog/`) to ItemDetail, PGDetail, PublicProfile, Browse-by-category. Emit matching `BreadcrumbList` JSON-LD.

## 9. 404 handling
NotFound page sets `noindex` and HTTP-equivalent meta. ItemDetail/PGDetail: when row missing, render `<SEOHead noindex />` + NotFound layout (not a soft 200 with empty content).

## 10. Internal linking
- Item cards link to slugged URLs
- ItemDetail "More from this seller" block (already-fetched) using slug links
- Blog posts → CTA linking to relevant category/campus
- Footer: links to blog, campuses, popular categories

## 11. Supabase migration
- `ALTER TABLE items ADD COLUMN slug text`
- `ALTER TABLE pg_listings ADD COLUMN slug text`
- Backfill: `update items set slug = lower(regexp_replace(title,'[^a-zA-Z0-9]+','-','g'))`
- Trigger on insert/update to auto-generate slug
- Index on slug

## Technical notes
- `react-helmet-async` already installed and provider mounted
- New `SEOHead` props already supports `noindex`, `jsonLd[]`
- Sitemap generator uses Supabase REST (no service role needed)
- All canonical URLs use `https://www.mycampuskart.com`
- No SSR — social preview crawlers still see sitewide OG from `index.html`; per-route Helmet covers Googlebot

## Out of scope
- SSR / prerendering (would require Vercel adapter rewrite)
- Programmatic SEO landing pages beyond categories/cities
- Schema for chat/messages

## Files to create/edit
- Migration: add slug to items + pg_listings + trigger
- `scripts/generate-sitemap.ts` + `package.json` scripts
- `public/robots.txt` (update)
- `index.html` (sitewide JSON-LD, preconnects)
- `src/App.tsx` (new slugged routes + redirects)
- `src/components/seo/SEOHead.tsx` (already exists, minor tweaks)
- `src/components/seo/BreadcrumbsJsonLd.tsx` (new helper)
- Add `<SEOHead>` to: ItemDetail, PGDetail, PublicProfile, Browse, Home, DownloadApp, StaticPage, Auth, Dashboard, Chat, NotFound, Leaderboard, MyListings/Orders/Cart/Reports/Chats/Notifications/KYC/Profile/SellItem/EditItem/AdminDashboard/ScanQR (noindex for private)
- Listing/PG card components: lazy images, alt text, slug links
- `src/lib/seo.ts` (new — slug helper, JSON-LD builders for Product/Accommodation/Person/Breadcrumb)
