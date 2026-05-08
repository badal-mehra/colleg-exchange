import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, fetchPublishedPosts, SITE_URL } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";

export default function BlogTaxonomyPage({ kind }: { kind: "category" | "tag" }) {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [meta, setMeta] = useState<{ name: string; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const table = kind === "category" ? "blog_categories" : "blog_tags";
      const { data: m } = await supabase.from(table).select("*").eq("slug", slug).maybeSingle();
      setMeta(m as any);
      const list = await fetchPublishedPosts(
        kind === "category" ? { categorySlug: slug } : { tagSlug: slug }
      );
      setPosts(list);
      setLoading(false);
    })();
  }, [slug, kind]);

  const title = meta?.name
    ? `${meta.name} ${kind === "category" ? "Articles" : "Posts"} | MyCampusKart Blog`
    : "Blog | MyCampusKart";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={meta?.description || `Articles tagged ${meta?.name || slug} on MyCampusKart blog.`}
        canonical={`${SITE_URL}/blog/${kind}/${slug}`}
      />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: meta?.name || slug || "" },
          ]}
        />
        <h1 className="mt-6 text-4xl md:text-5xl font-bold">
          {kind === "tag" && "#"}
          {meta?.name || slug}
        </h1>
        {meta?.description && <p className="mt-3 text-lg text-muted-foreground">{meta.description}</p>}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p>Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-16">No articles yet.</p>
          ) : (
            posts.map((p) => <BlogCard key={p.id} post={p} />)
          )}
        </div>
      </div>
    </div>
  );
}
