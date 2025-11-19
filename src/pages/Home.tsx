import { Sidebar, SidebarInset } from "@/components/ui/sidebar";

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/mycampuskart-logo.png";
import {
  Search,
  User,
  LogIn,
  Filter,
  ShoppingBag,
  Eye,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  Crown,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Footer } from "@/components/Footer";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  location: string;
  views: number;
  created_at: string;
  categories: Category;
  ad_type: string;
  is_negotiable: boolean;
  tags: string[];
  expires_at: string;
}

const getAdTypeBenefits = (adType: string) => {
  switch (adType) {
    case "featured":
      return {
        icon: <Star className="h-3 w-3" />,
        label: "Featured",
        color: "bg-gradient-to-r from-primary to-primary/80",
        benefits: "Top placement • 3x visibility • Highlighted border",
      };
    case "premium":
      return {
        icon: <Crown className="h-3 w-3" />,
        label: "Premium",
        color: "bg-gradient-to-r from-warning to-warning/80",
        benefits: "Priority listing • Boost button • Extended duration",
      };
    case "urgent":
      return {
        icon: <Zap className="h-3 w-3" />,
        label: "Urgent",
        color: "bg-gradient-to-r from-destructive to-destructive/80",
        benefits: "Flash indicator • Quick sell price • 48hr highlight",
      };
    default:
      return null;
  }
};

const Home = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const fetchItems = async () => {
    setLoading(true);

    let query = supabase
      .from("items")
      .select(`*, categories(*)`)
      .eq("is_sold", false)
      .gt("expires_at", new Date().toISOString())
      .order("ad_type", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);

    if (selectedCategory !== "all")
      query = query.eq("category_id", selectedCategory);

    if (searchTerm) query = query.ilike("title", `%${searchTerm}%`);

    const { data } = await query;
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchItems, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const ImageSlider = () => {
    const [sliderImages, setSliderImages] = useState<any[]>([]);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
      (async () => {
        const { data } = await supabase
          .from("image_slidebar")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        setSliderImages(data || []);
      })();
    }, []);

    useEffect(() => {
      if (sliderImages.length > 0) {
        const interval = setInterval(
          () => setCurrent((n) => (n + 1) % sliderImages.length),
          5000
        );
        return () => clearInterval(interval);
      }
    }, [sliderImages.length]);

    if (sliderImages.length === 0) return null;

    return (
      <section className="py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[16/6] sm:aspect-[16/5] lg:aspect-[16/4]">
            {sliderImages.map((img, i) => (
              <div
                key={img.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === current ? "opacity-100" : "opacity-0"
                }`}
                onClick={() => img.link_url && window.open(img.link_url)}
              >
                <img
                  src={img.image_url}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-10">
                  <div className="text-center text-white space-y-3 max-w-2xl px-4">
                    {img.title && (
                      <h2 className="text-2xl lg:text-4xl font-bold">
                        {img.title}
                      </h2>
                    )}
                    {img.description && (
                      <p className="text-base lg:text-xl opacity-95">
                        {img.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={() =>
                setCurrent((n) => (n - 1 + sliderImages.length) % sliderImages.length)
              }
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={() => setCurrent((n) => (n + 1) % sliderImages.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="flex">
      {/* SIDEBAR ALWAYS HERE */}
      <Sidebar variant="sidebar" collapsible="offcanvas">
        Test Sidebar
      </Sidebar>

      <SidebarInset>
        <div className="min-h-screen bg-background">

          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <img
                src={logo}
                className="h-12 cursor-pointer"
                onClick={() => navigate("/")}
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                  <LogIn className="h-4 w-4 mr-2" /> Login
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")}>
                  <User className="h-4 w-4 mr-2" /> Sign Up
                </Button>
              </div>
            </div>
          </header>

          {/* Slider */}
          <ImageSlider />

          {/* Your Listings Section */}
          <section className="py-16 container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Featured Listings</h2>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 bg-muted"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No items found */}
            {!loading && items.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No items found</h3>
              </div>
            )}

            {/* Items */}
            {!loading && items.length > 0 && (
              <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => {
                    const badge = getAdTypeBenefits(item.ad_type);
                    return (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-lg"
                        onClick={() => navigate(`/item/${item.id}`)}
                      >
                        <div className="relative h-48 bg-muted">
                          <img
                            src={item.images?.[0]}
                            className="w-full h-full object-cover"
                          />

                          {badge && (
                            <Badge className={`absolute top-2 left-2 ${badge.color}`}>
                              {badge.icon} {badge.label}
                            </Badge>
                          )}
                        </div>

                        <CardContent className="p-3">
                          <h3 className="font-semibold line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-lg font-bold text-primary">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TooltipProvider>
            )}
          </section>

          <Footer />
        </div>
      </SidebarInset>
    </div>
  );
};

export default Home;
