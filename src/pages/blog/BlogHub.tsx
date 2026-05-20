import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, fetchPublishedPosts, SITE_URL } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { NewsletterCapture } from "@/components/blog/NewsletterCapture";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogHub() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [p, c] = await Promise.all([
        fetchPublishedPosts(),
        supabase.from("blog_categories").select("*").order("sort_order"),
      ]);
      setPosts(p);
      setCategories(c.data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = posts.filter((p) => {
    if (activeCat && p.blog_categories?.slug !== activeCat) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = filtered.filter((p) => p.id !== featured?.id);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "MyCampusKart",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "MyCampusKart Blog",
      url: `${SITE_URL}/blog`,
      description: "Smart guides, hostel hacks and campus stories for Indian students.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="MyCampusKart Blog — Student Guides, Hostel Tips & Campus Hacks"
        description="Smart guides for Indian college students — hostel essentials, money-saving hacks, second-hand buying tips and tech reviews."
        canonical={`${SITE_URL}/blog`}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Student insights, weekly
          </div>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Guides, hacks & stories from{" "}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Indian campuses
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Real advice from real students. Save more, sell smarter, and live better at college.
          </p>
          <div className="mt-8 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-11 h-12 rounded-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="border-b border-border bg-background sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
          <Button
            variant={!activeCat ? "default" : "outline"}
            size="sm"
            className="rounded-full shrink-0"
            onClick={() => setActiveCat(null)}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={activeCat === c.slug ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => setActiveCat(c.slug)}
            >
              {c.icon} {c.name}
            </Button>
          ))}
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-96 rounded-2xl" />
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {!activeCat && !search && featured && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-primary uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4" /> Featured
                </div>
                <BlogCard post={featured} featured />
              </div>
            )}

            <h2 className="text-2xl font-bold mb-6">
              {activeCat ? categories.find((c) => c.slug === activeCat)?.name : "Latest Articles"}
            </h2>
            {rest.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No articles match your search.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((p) => (
                  <BlogCard key={p.id} post={p} />
                ))}
              </div>
            )}

            <NewsletterCapture source="blog-hub" />

            <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
              <h3 className="text-2xl font-bold">Looking for something specific?</h3>
              <p className="text-muted-foreground mt-2">Browse student deals on your own campus.</p>
              <Button asChild className="mt-4">
                <Link to="/campuses">Find Your Campus</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
