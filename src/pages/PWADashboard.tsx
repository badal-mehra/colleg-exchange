import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Package, Home, RefreshCw, SlidersHorizontal,
  Bell, MapPin, TrendingUp, ArrowUpDown, CheckCircle2,
  Search, X, ChevronRight, Sparkles, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import PWASearchBar from "@/components/PWASearchBar";
import PWACategoryChip from "@/components/PWACategoryChip";
import PWAListingCard from "@/components/PWAListingCard";
import PGListingCard from "@/components/PGListingCard";
import PWAImageSlider from "@/components/PWAImageSlider";

// ─── Interfaces ────────────────────────────────────────────────────────────────

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

interface RentalMetadata {
  rental_duration?: string;
  rental_deposit?: number;
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
  rental_metadata: RentalMetadata | null;
}

interface PGListing {
  id: string;
  property_type: string;
  for_gender: string;
  sharing_type: string;
  rent_per_month: number;
  area_locality: string;
  images: string[];
  amenities: Record<string, unknown>;
  created_at: string;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";
type TabType = "products" | "pg";

// ─── Skeleton Card ──────────────────────────────────────────────────────────────

const SkeletonCard = ({ variant = "product" }: { variant?: "product" | "pg" }) => (
  <div
    className={`rounded-2xl overflow-hidden bg-gradient-to-br from-muted/60 to-muted/30 animate-pulse ${
      variant === "pg" ? "h-64" : "h-56"
    }`}
    style={{ animationDelay: `${Math.random() * 0.4}s` }}
  >
    <div className="h-3/5 bg-muted/60" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-muted/60 rounded-full w-3/4" />
      <div className="h-3 bg-muted/40 rounded-full w-1/2" />
      <div className="h-4 bg-muted/60 rounded-full w-1/3" />
    </div>
  </div>
);

// ─── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({
  icon: Icon,
  title,
  subtitle,
  onClear,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClear: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="relative mb-6">
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
      <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
        <Icon className="h-10 w-10 text-primary/40" />
      </div>
    </div>
    <h3 className="font-bold text-xl mb-2 text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">{subtitle}</p>
    <Button
      variant="outline"
      onClick={onClear}
      className="rounded-full px-6 h-10 border-primary/30 text-primary hover:bg-primary/5 font-medium"
    >
      Clear Filters
    </Button>
  </div>
);

// ─── Active Filter Badge ────────────────────────────────────────────────────────

const FilterBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
      {count}
    </span>
  ) : null;

// ─── Sort Pill ─────────────────────────────────────────────────────────────────

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price ↑",
  price_desc: "Price ↓",
  popular: "Popular",
};

// ─── Main Component ────────────────────────────────────────────────────────────

const PWADashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [pgListings, setPgListings] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filter & UI state
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // PG specific filters
  const [pgPropertyType, setPgPropertyType] = useState("all");
  const [pgSharingType, setPgSharingType] = useState("all");
  const [pgGender, setPgGender] = useState("all");

  // Pull-to-refresh touch refs
  const touchStartY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const isVerified = useMemo(
    () => profile?.is_verified && profile?.verification_status === "approved",
    [profile]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeTab === "products") {
      if (priceRange !== "all") count++;
      if (selectedCategory !== "all") count++;
    } else {
      if (pgPropertyType !== "all") count++;
      if (pgSharingType !== "all") count++;
      if (pgGender !== "all") count++;
    }
    return count;
  }, [activeTab, priceRange, selectedCategory, pgPropertyType, pgSharingType, pgGender]);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sortBy === "price_asc") return arr.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") return arr.sort((a, b) => b.price - a.price);
    return arr; // newest is default from DB
  }, [items, sortBy]);

  // ─── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_verified, verification_status")
        .eq("user_id", user.id)
        .single();
      if (data) setProfile(data);
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");
      if (data) setCategories(data);
    })();
  }, []);

  // Load user's existing favorites for UI highlighting
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("favorites")
        .select("item_id")
        .eq("user_id", user.id);
      if (data) setFavorites(new Set(data.map((f) => f.item_id)));
    })();
  }, [user]);

  const fetchItems = useCallback(async () => {
    let query = supabase
      .from("items")
      .select(
        "id, title, price, images, location, condition, is_negotiable, created_at, ad_type, seller_id, rental_metadata"
      )
      .eq("is_sold", false)
      .order("ad_priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);

    if (selectedCategory !== "all") query = query.eq("category_id", selectedCategory);
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      query = max ? query.gte("price", min).lte("price", max) : query.gte("price", min);
    }

    const { data: itemsData, error } = await query;
    if (error) {
      toast({ title: "Error", description: "Failed to load items", variant: "destructive" });
      return;
    }
    if (!itemsData?.length) { setItems([]); return; }

    const itemIds = itemsData.map((i) => i.id);
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("item_id, buyer_id")
      .in("item_id", itemIds)
      .eq("status", "pending");

    const reservedByOthers = new Set(
      (pendingOrders || [])
        .filter((o) => o.buyer_id !== user?.id)
        .map((o) => o.item_id)
    );

    const filteredItems = itemsData
      .filter((item) => !reservedByOthers.has(item.id))
      .map((item) => ({
        ...item,
        rental_metadata: item.rental_metadata as RentalMetadata | null,
      }));

    setItems(filteredItems.slice(0, 40));
  }, [searchTerm, selectedCategory, priceRange, toast, user?.id]);

  const fetchPGListings = useCallback(async () => {
    let query = supabase
      .from("pg_listings")
      .select(
        "id, property_type, for_gender, sharing_type, rent_per_month, area_locality, images, amenities, created_at"
      )
      .eq("is_active", true)
      .neq("status", "rented")
      .order("created_at", { ascending: false })
      .limit(30);

    if (pgPropertyType !== "all") query = query.eq("property_type", pgPropertyType);
    if (pgSharingType !== "all") query = query.eq("sharing_type", pgSharingType);
    if (pgGender !== "all") query = query.eq("for_gender", pgGender);

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: "Failed to load PG listings", variant: "destructive" });
    } else {
      setPgListings(data || []);
    }
  }, [pgPropertyType, pgSharingType, pgGender, toast]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchPGListings()]);
      setLoading(false);
    })();
  }, [fetchItems, fetchPGListings]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchPGListings()]);
    setRefreshing(false);
    toast({ title: "✓ Refreshed", description: "Listings are up to date" });
  };

  const handleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign In Required", description: "Please sign in to save favorites", variant: "destructive" });
      return;
    }
    if (!isVerified) {
      toast({ title: "Verification Required", description: "Verify your account to save favorites", variant: "destructive" });
      return;
    }

    const isFav = favorites.has(itemId);
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(itemId) : next.add(itemId);
      return next;
    });

    if (isFav) {
      await supabase.from("favorites").delete().match({ user_id: user.id, item_id: itemId });
      toast({ title: "Removed", description: "Removed from your favorites" });
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, item_id: itemId });
      if (error?.code === "23505") {
        toast({ title: "Already saved", description: "This item is already in your favorites" });
      } else if (!error) {
        toast({ title: "❤️ Saved!", description: "Added to your favorites" });
      }
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  const clearProductFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
    setSortBy("newest");
  };

  const clearPGFilters = () => {
    setPgPropertyType("all");
    setPgSharingType("all");
    setPgGender("all");
  };

  // ─── Touch pull-to-refresh ────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80 && mainRef.current?.scrollTop === 0) handleRefresh();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || "U";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div
      className="min-h-screen bg-background pb-24 md:pb-8 selection:bg-primary/20"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40 safe-area-top">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            {/* Profile */}
            <button
              onClick={() => navigate("/pwa-profile")}
              className="flex items-center gap-3 group"
              aria-label="Open profile"
            >
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-primary/25 group-hover:ring-primary/50 transition-all duration-200 group-active:scale-95">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-sm">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                {isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground leading-none mb-0.5">Welcome back 👋</p>
                <p className="font-semibold text-sm text-foreground leading-tight max-w-[120px] truncate">
                  {firstName}
                </p>
              </div>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              {/* Notification bell */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full relative"
                onClick={() => navigate("/notifications")}
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {/* Unread dot — wire up to real data if available */}
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border border-background" />
              </Button>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-9 w-9 rounded-full"
                aria-label="Refresh listings"
              >
                <RefreshCw
                  className={`h-4 w-4 transition-transform ${refreshing ? "animate-spin text-primary" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Search row */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className={`flex-1 transition-all duration-200 ${searchFocused ? "scale-[1.01]" : ""}`}>
              <PWASearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={
                  activeTab === "products"
                    ? "Search products, brands…"
                    : "Search PG, hostel, rooms…"
                }
                showFilter
                onFilterClick={() => setFilterOpen(true)}
              />
            </div>

            {/* Sort button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOpen(true)}
              className="h-10 w-10 rounded-xl border-border/60 shrink-0 relative"
              aria-label="Sort listings"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            {/* Filter button with active badge */}
            <div className="relative shrink-0">
              <Button
                variant={activeFilterCount > 0 ? "default" : "outline"}
                size="icon"
                onClick={() => setFilterOpen(true)}
                className="h-10 w-10 rounded-xl"
                aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <FilterBadge count={activeFilterCount} />
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-1 pb-0">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-full max-w-sm">
            {(["products", "pg"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "products" ? (
                  <><Package className="h-3.5 w-3.5" />Products</>
                ) : (
                  <><Home className="h-3.5 w-3.5" />PG / Rooms</>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category / PG chips strip */}
        <div className="overflow-x-auto scrollbar-hide py-2.5">
          <div className="flex gap-2 px-4 md:px-6 lg:px-8 w-max">
            {activeTab === "products" ? (
              <>
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
              </>
            ) : (
              <>
                {[
                  { value: "all", label: "All Types" },
                  { value: "pg", label: "PG", icon: "🏠" },
                  { value: "hostel", label: "Hostel", icon: "🏢" },
                  { value: "flat", label: "Flat", icon: "🛋️" },
                  { value: "room", label: "Room", icon: "🚪" },
                ].map(({ value, label, icon }) => (
                  <PWACategoryChip
                    key={value}
                    icon={icon}
                    label={label}
                    isActive={pgPropertyType === value}
                    onClick={() => setPgPropertyType(value)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main ref={mainRef} className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-3 space-y-4">

        {/* Image Slider */}
        <PWAImageSlider />

        {/* Results meta row */}
        {!loading && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {activeTab === "products" ? sortedItems.length : pgListings.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {activeTab === "products" ? "listings" : "rooms"} found
              </span>
              {activeTab === "products" && searchTerm && (
                <Badge variant="secondary" className="text-xs gap-1 pr-1">
                  "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="ml-0.5 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            {activeTab === "products" && sortBy !== "newest" && (
              <button
                onClick={() => setSortBy("newest")}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                {SORT_LABELS[sortBy]}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* ── LOADING STATE ─────────────────────────────────── */}
        {loading ? (
          <div
            className={`grid gap-3 md:gap-4 ${
              activeTab === "products"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {Array.from({ length: activeTab === "products" ? 12 : 6 }).map((_, i) => (
              <SkeletonCard key={i} variant={activeTab === "products" ? "product" : "pg"} />
            ))}
          </div>

        ) : activeTab === "products" ? (

          /* ── PRODUCTS ─────────────────────────────────────── */
          sortedItems.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No items found"
              subtitle="Try a different search term or adjust your filters to discover more listings."
              onClear={clearProductFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {sortedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms`, animationFillMode: "both" }}
                >
                  <PWAListingCard
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
                    rentalMetadata={item.rental_metadata}
                    isFavorited={favorites.has(item.id)}
                    onClick={() => navigate(`/item/${item.id}`)}
                    onFavorite={(e) => handleFavorite(e, item.id)}
                    showFavorite={!!user && item.seller_id !== user.id}
                  />
                </div>
              ))}
            </div>
          )

        ) : (

          /* ── PG LISTINGS ──────────────────────────────────── */
          pgListings.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No PG / Rooms found"
              subtitle="No listings match your filters. Try changing the property type, sharing, or gender preference."
              onClear={clearPGFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pgListings.map((pg, idx) => (
                <div
                  key={pg.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(idx * 40, 400)}ms`, animationFillMode: "both" }}
                >
                  <PGListingCard listing={pg} onClick={() => navigate(`/pg/${pg.id}`)} />
                </div>
              ))}
            </div>
          )
        )}

        {/* Bottom spacer for FAB */}
        <div className="h-6" />
      </main>

      {/* ── FLOATING ACTION BUTTON ───────────────────────────────────────────── */}
      <button
        onClick={() => navigate(activeTab === "products" ? "/post-item" : "/post-pg")}
        aria-label="Post a new listing"
        className={`
          fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40
          h-14 w-14 rounded-2xl shadow-xl shadow-primary/30
          bg-gradient-to-br from-primary to-primary/80
          text-primary-foreground
          flex items-center justify-center
          hover:scale-105 active:scale-95
          transition-all duration-200
        `}
      >
        <span className="text-2xl font-bold leading-none">+</span>
      </button>

      {/* ── SORT SHEET ──────────────────────────────────────────────────────── */}
      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              Sort by
            </SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-2">
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setSortBy(key); setSortOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${
                  sortBy === key
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {label}
                {sortBy === key && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── FILTER SHEET ────────────────────────────────────────────────────── */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filters
              </SheetTitle>
              {activeFilterCount > 0 && (
                <button
                  onClick={activeTab === "products" ? clearProductFilters : clearPGFilters}
                  className="text-xs text-rose-500 font-semibold"
                >
                  Clear all
                </button>
              )}
            </div>
          </SheetHeader>

          <div className="py-5 space-y-5">
            {activeTab === "products" ? (
              /* Product Filters */
              <>
                <div>
                  <label className="text-sm font-semibold mb-2.5 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="0-500">Under ₹500</SelectItem>
                      <SelectItem value="500-2000">₹500 – ₹2,000</SelectItem>
                      <SelectItem value="2000-5000">₹2,000 – ₹5,000</SelectItem>
                      <SelectItem value="5000-10000">₹5,000 – ₹10,000</SelectItem>
                      <SelectItem value="10000-">Above ₹10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              /* PG Filters */
              <>
                <div>
                  <label className="text-sm font-semibold mb-2.5 block">Sharing Type</label>
                  <Select value={pgSharingType} onValueChange={setPgSharingType}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Select sharing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Sharing</SelectItem>
                      <SelectItem value="single">Single (Private)</SelectItem>
                      <SelectItem value="double">Double Sharing</SelectItem>
                      <SelectItem value="triple">Triple Sharing</SelectItem>
                      <SelectItem value="quad">4+ Sharing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2.5 block">Gender Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "all", label: "Any" },
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setPgGender(value)}
                        className={`h-11 rounded-xl text-sm font-medium border transition-colors ${
                          pgGender === value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full h-12 rounded-xl font-semibold text-base"
              onClick={() => setFilterOpen(false)}
            >
              {activeFilterCount > 0
                ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? "s" : ""}`
                : "Apply Filters"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Global animation keyframes (injected once) ────────────────────── */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.35s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PWADashboard;
