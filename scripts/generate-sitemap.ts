// Generates public/sitemap.xml from static routes + dynamic Supabase content.
// Runs before `vite dev` and `vite build` via predev/prebuild scripts.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.mycampuskart.com";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://mtaeqtmcixlrudjsxcew.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10YWVxdG1jaXhscnVkanN4Y2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg1MDksImV4cCI6MjA3Mzg2NDUwOX0.7IjteljUrmEBwmhtAsThCuWEKEcGNFI1yeLL4TJokFg";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function slugify(text: string): string {
  return (text || "item")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/browse", changefreq: "daily", priority: "0.9" },
  { path: "/downloadmycampuskartapp", changefreq: "weekly", priority: "0.9" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy", changefreq: "monthly", priority: "0.3" },
  { path: "/shipping", changefreq: "monthly", priority: "0.3" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/report", changefreq: "monthly", priority: "0.3" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/campuses", changefreq: "weekly", priority: "0.8" },
];

async function rest<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] ${path} -> ${res.status}`);
      return [];
    }
    return (await res.json()) as T[];
  } catch (e) {
    console.warn(`[sitemap] fetch failed for ${path}:`, (e as Error).message);
    return [];
  }
}

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generate(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

async function main() {
  const entries: SitemapEntry[] = [...staticEntries];

  // Blog posts
  const posts = await rest<{ slug: string; updated_at: string }>(
    "blog_posts?select=slug,updated_at&status=eq.published&order=published_at.desc&limit=2000",
  );
  for (const p of posts) {
    entries.push({
      path: `/blog/${p.slug}`,
      lastmod: p.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  // Blog categories / tags
  const cats = await rest<{ slug: string }>("blog_categories?select=slug");
  for (const c of cats) entries.push({ path: `/blog/category/${c.slug}`, changefreq: "weekly", priority: "0.6" });
  const tags = await rest<{ slug: string }>("blog_tags?select=slug");
  for (const t of tags) entries.push({ path: `/blog/tag/${t.slug}`, changefreq: "weekly", priority: "0.5" });

  // Campus pages
  const campuses = await rest<{ slug: string }>("campus_pages?select=slug&is_active=eq.true");
  for (const c of campuses) entries.push({ path: `/campus/${c.slug}`, changefreq: "weekly", priority: "0.8" });

  // Listings (items)
  const items = await rest<{ id: string; title: string; updated_at?: string; created_at: string }>(
    "items?select=id,title,updated_at,created_at&is_sold=eq.false&order=created_at.desc&limit=5000",
  );
  for (const it of items) {
    entries.push({
      path: `/item/${slugify(it.title)}-${it.id}`,
      lastmod: (it.updated_at || it.created_at)?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // PG listings
  const pgs = await rest<{ id: string; area_locality?: string; property_type?: string; updated_at?: string; created_at: string }>(
    "pg_listings?select=id,area_locality,property_type,updated_at,created_at&is_active=eq.true&order=created_at.desc&limit=2000",
  );
  for (const pg of pgs) {
    const title = `${pg.property_type || "PG"} ${pg.area_locality || ""}`.trim();
    entries.push({
      path: `/pg/${slugify(title)}-${pg.id}`,
      lastmod: (pg.updated_at || pg.created_at)?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // Public profiles — ONLY those with active listings (avoids polluting sitemap
  // with hundreds of empty/incomplete profiles).
  const sellerIds = new Set<string>();
  for (const it of items) if ((it as any).seller_id) sellerIds.add((it as any).seller_id);
  for (const pg of pgs) if ((pg as any).seller_id) sellerIds.add((pg as any).seller_id);

  if (sellerIds.size > 0) {
    const ids = Array.from(sellerIds);
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const inList = chunk.map((x) => `"${x}"`).join(",");
      const profiles = await rest<{ mck_id: string; full_name: string | null; updated_at?: string }>(
        `profiles?select=mck_id,full_name,updated_at&user_id=in.(${inList})&mck_id=not.is.null&full_name=not.is.null`,
      );
      for (const p of profiles) {
        if (!p.mck_id) continue;
        entries.push({
          path: `/profile/${p.mck_id}`,
          lastmod: p.updated_at?.slice(0, 10),
          changefreq: "weekly",
          priority: "0.4",
        });
      }
    }
  }


  const xml = generate(entries);
  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main().catch((e) => {
  console.error("[sitemap] fatal:", e);
  // Don't fail the build — write static fallback
  const xml = generate(staticEntries);
  writeFileSync(resolve("public/sitemap.xml"), xml);
});
