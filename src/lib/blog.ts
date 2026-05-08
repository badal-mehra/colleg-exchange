import { supabase } from "@/integrations/supabase/client";

export const SITE_URL = "https://www.mycampuskart.com";
export const SITE_NAME = "MyCampusKart";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readingTime(content: string): number {
  const words = (content || "").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_id: string | null;
  category_id: string | null;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  reading_time: number | null;
  views: number;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  faq: Array<{ q: string; a: string }> | null;
  meta: any;
  created_at: string;
  updated_at: string;
  blog_authors?: any;
  blog_categories?: any;
  blog_post_tags?: Array<{ blog_tags: { name: string; slug: string } }>;
};

export async function fetchPublishedPosts(opts?: {
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  featured?: boolean;
  search?: string;
}) {
  let q = supabase
    .from("blog_posts")
    .select(
      "*, blog_authors(name, slug, avatar_url), blog_categories(name, slug, icon), blog_post_tags(blog_tags(name, slug))"
    )
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (opts?.featured) q = q.eq("featured", true);
  if (opts?.limit) q = q.limit(opts.limit);
  if (opts?.search) q = q.or(`title.ilike.%${opts.search}%,excerpt.ilike.%${opts.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  let rows = (data || []) as BlogPost[];
  if (opts?.categorySlug) rows = rows.filter((r) => r.blog_categories?.slug === opts.categorySlug);
  if (opts?.tagSlug)
    rows = rows.filter((r) =>
      (r.blog_post_tags || []).some((t) => t.blog_tags.slug === opts.tagSlug)
    );
  return rows;
}

export async function fetchPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "*, blog_authors(*), blog_categories(name, slug, icon), blog_post_tags(blog_tags(name, slug))"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as BlogPost | null;
}

export async function incrementView(slug: string) {
  try {
    await supabase.rpc("increment_blog_view", { p_slug: slug });
  } catch {}
}
