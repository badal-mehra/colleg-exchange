import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { CTABlock } from "@/components/blog/CTABlock";
import { NewsletterCapture } from "@/components/blog/NewsletterCapture";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, TrendingUp, Home, ShoppingBag, Lightbulb } from "lucide-react";
import { SITE_URL } from "@/lib/blog";

export default function CampusPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("campus_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
      } else {
        setPage(data);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) return <Navigate to="/campuses" replace />;
  if (loading || !page) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const sections = page.sections || {};
  const url = `${SITE_URL}/campus/${page.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Place",
      name: page.name,
      address: { "@type": "PostalAddress", addressLocality: page.city, addressCountry: "IN" },
      url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Campuses", item: `${SITE_URL}/campuses` },
        { "@type": "ListItem", position: 3, name: page.name, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={page.seo_title || `${page.name} Marketplace | MyCampusKart`}
        description={page.seo_description || page.intro}
        canonical={url}
        image={page.hero_image}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        {page.hero_image && (
          <img src={page.hero_image} alt={page.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 pb-10 w-full text-white">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Campuses", href: "/campuses" },
                { label: page.name },
              ]}
            />
            <div className="mt-6 flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" /> {page.city}
            </div>
            <h1 className="mt-2 text-4xl md:text-6xl font-bold tracking-tight">{page.name}</h1>
            <p className="mt-3 text-lg max-w-3xl text-white/90">{page.intro}</p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {sections.trends?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Marketplace trends</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {sections.trends.map((t: string, i: number) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-3xl font-bold text-primary mb-2">{i + 1}</div>
                  <p className="text-sm">{t}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {sections.popular_categories?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Popular categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {sections.popular_categories.map((c: string) => (
                <Link
                  key={c}
                  to={`/browse?q=${encodeURIComponent(c)}`}
                  className="px-4 py-2 rounded-full bg-card border border-border hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                >
                  {c}
                </Link>
              ))}
            </div>
          </section>
        )}

        {sections.hostels?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Hostels guide</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {sections.hostels.map((h: string, i: number) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 text-sm">
                  {h}
                </div>
              ))}
            </div>
          </section>
        )}

        {sections.tips?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Local student tips</h2>
            </div>
            <ul className="space-y-3">
              {sections.tips.map((t: string, i: number) => (
                <li key={i} className="flex gap-3 rounded-xl bg-card border border-border p-4">
                  <span className="font-bold text-primary">→</span>
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <CTABlock
          title={`Selling on ${page.name}?`}
          description="Reach hundreds of verified students from your campus in minutes."
        />

        <NewsletterCapture source={`campus-${page.slug}`} />
      </main>
    </div>
  );
}
