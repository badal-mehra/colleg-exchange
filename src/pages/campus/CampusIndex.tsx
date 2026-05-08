import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { SITE_URL } from "@/lib/blog";

export default function CampusIndex() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campus_pages")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setList(data || []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Campus Marketplaces in India | MyCampusKart"
        description="Discover student marketplaces across Indian campuses — buying trends, hostel guides and local tips."
        canonical={`${SITE_URL}/campuses`}
      />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Campuses" }]} />
        <h1 className="mt-6 text-4xl md:text-5xl font-bold">Campus Marketplaces</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          Hyperlocal student trading hubs across India. Find your campus and explore what's selling.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((c) => (
            <Link key={c.id} to={`/campus/${c.slug}`} className="group">
              <Card className="overflow-hidden border-border/40 hover:-translate-y-1 hover:shadow-xl transition-all rounded-2xl">
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {c.hero_image && (
                    <img
                      src={c.hero_image}
                      alt={c.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {c.city}
                  </div>
                  <h3 className="mt-1 font-bold text-lg group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.intro}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
