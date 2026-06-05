// Dynamic sitemap.xml — regenerated on every request so new listings/profiles
// are indexed automatically without needing a rebuild.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BASE_URL = "https://www.mycampuskart.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
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

function render(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ].filter(Boolean).join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const entries: Entry[] = [...staticEntries];

    // Blog posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2000);
    for (const p of posts || []) {
      entries.push({
        path: `/blog/${p.slug}`,
        lastmod: p.updated_at?.slice(0, 10),
        changefreq: "weekly",
        priority: "0.8",
      });
    }

    // Blog categories / tags
    const { data: cats } = await supabase.from("blog_categories").select("slug");
    for (const c of cats || []) entries.push({ path: `/blog/category/${c.slug}`, changefreq: "weekly", priority: "0.6" });
    const { data: tags } = await supabase.from("blog_tags").select("slug");
    for (const t of tags || []) entries.push({ path: `/blog/tag/${t.slug}`, changefreq: "weekly", priority: "0.5" });

    // Campus pages
    const { data: campuses } = await supabase.from("campus_pages").select("slug").eq("is_active", true);
    for (const c of campuses || []) entries.push({ path: `/campus/${c.slug}`, changefreq: "weekly", priority: "0.8" });

    // Active items — every single non-sold listing, auto-indexed
    const { data: items } = await supabase
      .from("items")
      .select("id, title, updated_at, created_at, seller_id")
      .eq("is_sold", false)
      .order("created_at", { ascending: false })
      .limit(10000);
    for (const it of items || []) {
      entries.push({
        path: `/item/${slugify(it.title)}-${it.id}`,
        lastmod: (it.updated_at || it.created_at)?.slice(0, 10),
        changefreq: "weekly",
        priority: "0.7",
      });
    }

    // Active PG listings
    const { data: pgs } = await supabase
      .from("pg_listings")
      .select("id, area_locality, property_type, updated_at, created_at, seller_id")
      .eq("is_active", true)
      .neq("status", "rented")
      .order("created_at", { ascending: false })
      .limit(5000);
    for (const pg of pgs || []) {
      const title = `${pg.property_type || "PG"} ${pg.area_locality || ""}`.trim();
      entries.push({
        path: `/pg/${slugify(title)}-${pg.id}`,
        lastmod: (pg.updated_at || pg.created_at)?.slice(0, 10),
        changefreq: "weekly",
        priority: "0.7",
      });
    }

    // Profiles — ONLY include sellers that actually have at least one active listing.
    // Avoids dumping every empty/incomplete profile into the sitemap.
    const activeSellerIds = new Set<string>();
    for (const it of items || []) if (it.seller_id) activeSellerIds.add(it.seller_id);
    for (const pg of pgs || []) if (pg.seller_id) activeSellerIds.add(pg.seller_id);

    if (activeSellerIds.size > 0) {
      const ids = Array.from(activeSellerIds);
      // Batch in chunks of 200 to keep .in() filter small
      for (let i = 0; i < ids.length; i += 200) {
        const chunk = ids.slice(i, i + 200);
        const { data: profs } = await supabase
          .from("profiles")
          .select("mck_id, full_name, updated_at, user_id")
          .in("user_id", chunk)
          .not("mck_id", "is", null)
          .not("full_name", "is", null);
        for (const p of profs || []) {
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

    return new Response(render(entries), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch (e) {
    console.error("[sitemap] error:", e);
    return new Response(render(staticEntries), {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
    });
  }
});
