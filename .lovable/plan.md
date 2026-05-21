## MyCampusKart Blog Ecosystem — Build Plan

A full content platform: public blog hub, article pages, campus SEO pages, and an admin CMS — all DB-backed, SEO-perfect, premium UI.

### 1. Database (Supabase migration)

New tables (all with RLS, public read for published rows, admin-only write):

- `blog_categories` — name, slug, description, icon, sort_order
- `blog_tags` — name, slug
- `blog_authors` — user_id (nullable), name, slug, avatar_url, bio, role, social links
- `blog_posts` — title, slug (unique), excerpt, content (markdown), cover_image, author_id, category_id, status (draft/scheduled/published), published_at, scheduled_at, reading_time, views, featured, seo_title, seo_description, og_image, canonical_url, faq (jsonb), meta (jsonb)
- `blog_post_tags` — post_id, tag_id (junction)
- `blog_comments` — post_id, user_id, name, content, status (approved/pending), parent_id
- `campus_pages` — slug, name, city, hero_image, intro, sections (jsonb: trends, hostels, popular_categories, tips), seo_title, seo_description, is_active

Helper RPC: `increment_blog_view(post_slug)`, `get_published_post(slug)`.

Seed: 7 realistic articles, 6 categories, ~12 tags, 3 campus pages (LPU, IIT Delhi, Chandigarh University), 1 author profile.

### 2. Routes (React Router in `src/App.tsx`)

Public:
- `/blog` — Hub: hero search, featured post, category chips, latest grid, popular sidebar, newsletter CTA
- `/blog/category/:slug` — Filtered listing
- `/blog/tag/:slug` — Tag listing
- `/blog/:slug` — Single article
- `/campus/:slug` — Campus SEO landing
- `/campuses` — Index of all campus pages

Admin (protected, admin-only via `is_admin`):
- `/admin/blog` — Posts list + filters
- `/admin/blog/new` — Editor
- `/admin/blog/:id/edit` — Editor
- `/admin/blog/categories` — CRUD
- `/admin/blog/tags` — CRUD
- `/admin/blog/authors` — CRUD
- `/admin/campus` — Campus pages CRUD

### 3. Components (`src/components/blog/`)

- `BlogHero`, `BlogSearchBar`, `FeaturedPostCard`, `BlogCard`, `BlogGrid`
- `CategoryChips`, `TagPill`, `AuthorBadge`, `AuthorCard`
- `ReadingProgressBar`, `TableOfContents` (auto-generated from markdown headings)
- `StickyShareButtons` (Twitter/WhatsApp/LinkedIn/Copy link)
- `FAQAccordion`, `RelatedArticles`, `CTABlock`, `NewsletterCapture`
- `Breadcrumbs`, `MarkdownRenderer` (react-markdown + remark-gfm + rehype-slug)
- `BlogPostEditor` (admin: title, slug auto-gen, markdown editor, SEO fields, FAQ builder, schedule, draft toggle, cover upload via Cloudinary)
- `SEOHead` — reusable Helmet wrapper for meta + JSON-LD

### 4. SEO Layer

- Install `react-helmet-async` and wrap app with `HelmetProvider`
- Per-page: dynamic `<title>`, meta description, canonical, OG, Twitter card
- JSON-LD blocks: `Article`, `BreadcrumbList`, `FAQPage`, `Organization` (site-wide), `WebSite` with SearchAction
- Update `public/sitemap.xml` to include `/blog`, `/campus/*` patterns; add `Sitemap` notes in robots
- Semantic HTML: `<article>`, `<header>`, `<nav aria-label="breadcrumb">`, single `<h1>` per page, proper heading order

### 5. Design System

Reuse existing tokens (`index.css`, `tailwind.config.ts`). Add blog-specific tokens if needed:
- Soft shadows, large rounded cards (`rounded-2xl`), generous spacing
- Sticky translucent navbar with backdrop-blur
- Smooth Framer-style transitions via Tailwind `transition-all`
- Dark/light mode already supported — verify contrast
- Mobile-first grid: 1 col → 2 col (md) → 3 col (lg)
- Gen-Z touches: gradient accents, emoji-friendly headings, pill tags

### 6. Conversion Hooks

Embedded throughout:
- Inline "Start Selling" CTA in articles
- "Explore Marketplace" banner after intro
- Newsletter capture before related posts (stored in new `newsletter_subscribers` table)
- Trust badges on hub page (active students, listings count)

### 7. Demo Content (seeded SQL)

7 articles with full markdown bodies, FAQ sections, cover images (Unsplash URLs), tags, categories, author = "MyCampusKart Team":
- Best Calculators for Engineering Students
- Hostel Room Essentials Checklist
- How Students Can Save Money in College
- Top Things Seniors Sell Before Graduation
- Best Budget Gadgets for Students 2026
- Freshers Hostel Checklist
- Safe Ways to Buy Second-Hand Electronics

3 campus pages with sections, trends, popular categories.

### 8. Technical details

- Markdown rendering: `react-markdown`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`
- Reading time: simple word-count / 200 wpm util
- TOC: parse headings client-side from rendered DOM, IntersectionObserver for active state
- Reading progress: scroll listener with rAF
- Image uploads in admin: reuse existing Cloudinary signing edge function
- Newsletter subscribe: insert into `newsletter_subscribers` table (RLS: anon insert allowed)
- Comments: authenticated insert, public read of approved

### 9. Files to create (high level)

```
supabase/migrations/<ts>_blog_ecosystem.sql
src/pages/blog/BlogHub.tsx
src/pages/blog/BlogPost.tsx
src/pages/blog/BlogCategory.tsx
src/pages/blog/BlogTag.tsx
src/pages/campus/CampusPage.tsx
src/pages/campus/CampusIndex.tsx
src/pages/admin/blog/BlogAdmin.tsx
src/pages/admin/blog/BlogEditor.tsx
src/pages/admin/blog/CategoryAdmin.tsx
src/pages/admin/blog/TagAdmin.tsx
src/pages/admin/blog/AuthorAdmin.tsx
src/pages/admin/campus/CampusAdmin.tsx
src/components/blog/* (all components above)
src/components/seo/SEOHead.tsx
src/lib/blog.ts (queries, slug, reading-time utils)
src/App.tsx (routes)
src/main.tsx (HelmetProvider wrap)
public/sitemap.xml (extended)
```

### 10. Out of scope (kept separate)

- Server-side rendering / prerendering — this is a Vite SPA; meta tags will be set client-side via Helmet (Google does render JS, but if you later want true SSR we can move to a prerender step)
- Rich-text WYSIWYG editor — using markdown for cleanliness and SEO; can swap to Tiptap later
- Email delivery for newsletter — only collecting addresses now

### Build order

1. Migration + seed (request approval)
2. SEOHead + Helmet provider + utils
3. Public blog hub + post page + category/tag
4. Campus pages
5. Admin CMS
6. Sitemap + final SEO polish   

Confirm and I'll run the migration first, then build the rest in one pass.
