import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PWASearchBar from "@/components/PWASearchBar";
import PWACategoryChip from "@/components/PWACategoryChip";
import PWAListingCard from "@/components/PWAListingCard";
import PGListingCard from "@/components/PGListingCard";

// Interfaces
interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  verification_status: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Item {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  condition: string;
  is_negotiable: boolean;
  created_at: string;
  ad_type: string;
  seller_id: string;
}

interface PGListing {
  id: string;
  property_type: string;
  for_gender: string;
  sharing_type: string;
  rent_per_month: number;
  area_locality: string;
  images: string[];
  amenities: any;
  created_at: string;
}

const PWADashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [pgListings, setPgListings] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [activeTab, setActiveTab] = useState<"products" | "pg">("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // PG Filters
  const [pgPropertyType, setPgPropertyType] = useState("all");
  const [pgSharingType, setPgSharingType] = useState("all");

  const isVerified = useMemo(
    () => profile?.is_verified && profile?.verification_status === "approved",
    [profile]
  );

  // Fetch Profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_verified, verification_status")
        .eq("user_id", user.id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch Items
  const fetchItems = useCallback(async () => {
    let query = supabase
      .from("items")
      .select("id, title, price, images, location, condition, is_negotiable, created_at, ad_type, seller_id")
      .eq("is_sold", false)
      .order("ad_priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      query = max ? query.gte("price", min).lte("price", max) : query.gte("price", min);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: "Failed to load items", variant: "destructive" });
    } else {
      setItems(data || []);
    }
  }, [searchTerm, selectedCategory, priceRange, toast]);

  // Fetch PG Listings
  const fetchPGListings = useCallback(async () => {
    let query = supabase
      .from("pg_listings")
      .select("id, property_type, for_gender, sharing_type, rent_per_month, area_locality, images, amenities, created_at")
      .eq("is_active", true)
      .neq("status", "rented")
      .order("created_at", { ascending: false })
      .limit(30);

    if (pgPropertyType !== "all") {
      query = query.eq("property_type", pgPropertyType);
    }
    if (pgSharingType !== "all") {
      query = query.eq("sharing_type", pgSharingType);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: "Failed to load PG listings", variant: "destructive" });
    } else {
      setPgListings(data || []);
    }
  }, [pgPropertyType, pgSharingType, toast]);

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchPGListings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchItems, fetchPGListings]);

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchPGListings()]);
    setRefreshing(false);
  };

  // Favorite handler
  const handleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user || !isVerified) {
      toast({
        title: "Verification Required",
        description: "Please verify your account to add favorites",
        variant: "destructive",
      });
      return;
    }
    // Add to favorites logic
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, item_id: itemId });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already Added", description: "This item is already in your cart" });
      }
    } else {
      toast({ title: "Added to Cart", description: "Item saved to your favorites" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-top">
        <div className="px-4 py-3">
          {/* Top Row - Profile & Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar
                className="h-10 w-10 ring-2 ring-primary/20 cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate("/pwa-profile")}
              >
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <h1 className="font-semibold text-foreground leading-tight">
                  {profile?.full_name || "User"}
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 w-10 rounded-full"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Search Bar */}
          <PWASearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={activeTab === "products" ? "Search products..." : "Search PG/Rooms..."}
            showFilter
            onFilterClick={() => setFilterOpen(true)}
          />
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pb-3">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "products" | "pg")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/70 rounded-lg">
              <TabsTrigger
                value="products"
                className="flex items-center gap-1.5 text-sm font-medium data-[state=active]:shadow-sm rounded-md"
              >
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger
                value="pg"
                className="flex items-center gap-1.5 text-sm font-medium data-[state=active]:shadow-sm rounded-md"
              >
                <Home className="h-4 w-4" />
                PG / Rooms
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Category Pills - Products Tab Only */}
        {activeTab === "products" && categories.length > 0 && (
          <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              <PWACategoryChip
                label="All"
                isActive={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
              />
              {categories.map((cat) => (
                <PWACategoryChip
                  key={cat.id}
                  icon={cat.icon || undefined}
                  label={cat.name}
                  isActive={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* PG Filters */}
        {activeTab === "pg" && (
          <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              <PWACategoryChip
                label="All Types"
                isActive={pgPropertyType === "all"}
                onClick={() => setPgPropertyType("all")}
              />
              <PWACategoryChip
                icon="🏠"
                label="PG"
                isActive={pgPropertyType === "pg"}
                onClick={() => setPgPropertyType("pg")}
              />
              <PWACategoryChip
                icon="🏢"
                label="Hostel"
                isActive={pgPropertyType === "hostel"}
                onClick={() => setPgPropertyType("hostel")}
              />
              <PWACategoryChip
                icon="🛋️"
                label="Flat"
                isActive={pgPropertyType === "flat"}
                onClick={() => setPgPropertyType("flat")}
              />
              <PWACategoryChip
                icon="🚪"
                label="Room"
                isActive={pgPropertyType === "room"}
                onClick={() => setPgPropertyType("room")}
              />
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : activeTab === "products" ? (
          <>
            {items.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold text-lg mb-2">No items found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Try adjusting your filters or search term
                </p>
                <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <PWAListingCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    price={item.price}
                    image={item.images[0] || ""}
                    location={item.location}
                    condition={item.condition}
                    isNegotiable={item.is_negotiable}
                    createdAt={item.created_at}
                    imageCount={item.images.length}
                    adType={item.ad_type}
                    onClick={() => navigate(`/item/${item.id}`)}
                    onFavorite={(e) => handleFavorite(e, item.id)}
                    showFavorite={!!user && item.seller_id !== user.id}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {pgListings.length === 0 ? (
              <div className="text-center py-16">
                <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold text-lg mb-2">No PG/Rooms found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Check back later or adjust your filters
                </p>
                <Button variant="outline" onClick={() => setPgPropertyType("all")}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pgListings.map((pg) => (
                  <PGListingCard key={pg.id} listing={pg} onClick={() => navigate(`/pg/${pg.id}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {activeTab === "products" ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="0-500">Under ₹500</SelectItem>
                      <SelectItem value="500-2000">₹500 - ₹2,000</SelectItem>
                      <SelectItem value="2000-5000">₹2,000 - ₹5,000</SelectItem>
                      <SelectItem value="5000-10000">₹5,000 - ₹10,000</SelectItem>
                      <SelectItem value="10000-">Above ₹10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sharing Type</label>
                  <Select value={pgSharingType} onValueChange={setPgSharingType}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select sharing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double Sharing</SelectItem>
                      <SelectItem value="triple">Triple Sharing</SelectItem>
                      <SelectItem value="quad">4+ Sharing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <Button
              className="w-full h-12 rounded-xl"
              onClick={() => setFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PWADashboard;
