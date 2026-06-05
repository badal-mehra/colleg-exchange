// PWADashboard.tsx — with category cards, URL‑driven filters, condition/sort, dynamic SEO
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import {
  Package,
  Home,
  SlidersHorizontal,
  Bell,
  CheckCircle2,
  Search,
  X,
  ArrowUpDown,
  CheckCheck,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PWASearchBar from "@/components/PWASearchBar";
import PWACategoryChip from "@/components/PWACategoryChip";
import PWAListingCard from "@/components/PWAListingCard";
import PGListingCard from "@/components/PGListingCard";
import PWAImageSlider from "@/components/PWAImageSlider";
import DailyLoginReward from "@/components/DailyLoginReward";
import { SEOHead } from "@/components/seo/SEOHead";
import { canonical } from "@/lib/seo";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  verification_status: string;
}

interface MinimalCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  count?: number;
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

type SortOption = "newest" | "price_asc" | "price_desc";
type TabType = "products" | "pg";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton & Empty states (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonCard = ({ variant = "product" }: { variant?: "product" | "pg" }) => (
  <div
    className={`rounded-xl overflow-hidden animate-pulse bg-muted/50 ${
      variant === "pg" ? "h-64" : "h-52"
    }`}
  >
    <div className="h-[55%] bg-muted/70" />
    <div className="p-3 space-y-2.5">
      <div className="h-3 bg-muted/70 rounded-full w-2/3" />
      <div className="h-3 bg-muted/50 rounded-full w-5/6" />
      <div className="h-4 bg-muted/70 rounded-full w-1/3" />
    </div>
  </div>
);

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
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
    <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mb-5">
      <Icon className="h-9 w-9 text-muted-foreground/50" />
    </div>
    <h3 className="font-bold text-lg text-foreground mb-1.5">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-[260px] leading-relaxed">
      {subtitle}
    </p>
    <Button
      variant="outline"
      onClick={onClear}
      className="rounded-full px-6 h-10 font-medium text-sm"
    >
      Clear Filters
    </Button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const PWADashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unreadChats } = useNotificationCounts();

  const [searchParams, setSearchParams] = useSearchParams();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<MinimalCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [pgListings, setPgListings] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // ── PG filters (still local, not URL‑driven) ────────────────────────────────
  const [pgPropertyType, setPgPropertyType] = useState("all");
  const [pgSharingType, setPgSharingType] = useState("all");
  const [pgGender, setPgGender] = useState("all");

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────
  const touchStartY = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(false);

  // ─── Derive filters from URL (mirrors Browse.tsx logic) ─────────────────────

  const activeCategorySlug = (searchParams.get("category") || "").toLowerCase();
  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === activeCategorySlug) || null,
    [categories, activeCategorySlug]
  );

  const filters = useMemo(
    () => ({
      searchTerm: searchParams.get("q") || "",
      selectedCategory: activeCategory?.id || "all",
      priceRange: searchParams.get("price") || "all",
      condition: searchParams.get("condition") || "all",
      sort: (searchParams.get("sort") as SortOption) || "newest",
    }),
    [searchParams, activeCategory]
  );

  const { searchTerm, selectedCategory, priceRange, condition, sort } = filters;

  // ─── Derived values ─────────────────────────────────────────────────────────

  const isVerified = useMemo(
    () => profile?.is_verified && profile?.verification_status === "approved",
    [profile]
  );

  const activeFilterCount = useMemo(() => {
    if (activeTab === "products") {
      return (
        (priceRange !== "all" ? 1 : 0) +
        (selectedCategory !== "all" ? 1 : 0) +
        (condition !== "all" ? 1 : 0)
      );
    }
    return (
      (pgPropertyType !== "all" ? 1 : 0) +
      (pgSharingType !== "all" ? 1 : 0) +
      (pgGender !== "all" ? 1 : 0)
    );
  }, [activeTab, priceRange, selectedCategory, condition, pgPropertyType, pgSharingType, pgGender]);

  const sortedItems = useMemo(() => {
    if (sort === "newest") return items; // already sorted by backend
    const arr = [...items];
    if (sort === "price_asc") return arr.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return arr.sort((a, b) => b.price - a.price);
    return arr;
  }, [items, sort]);

  // ─── URL update helper ──────────────────────────────────────────────────────

  const updateFilters = useCallback(
    (patch: Partial<typeof filters & { categorySlug: string | null }>) => {
      const next = new URLSearchParams(searchParams);
      if ("searchTerm" in patch) {
        patch.searchTerm ? next.set("q", patch.searchTerm) : next.delete("q");
      }
      if ("priceRange" in patch) {
        patch.priceRange && patch.priceRange !== "all" ? next.set("price", patch.priceRange) : next.delete("price");
      }
      if ("condition" in patch) {
        patch.condition && patch.condition !== "all" ? next.set("condition", patch.condition) : next.delete("condition");
      }
      if ("sort" in patch) {
        patch.sort && patch.sort !== "newest" ? next.set("sort", patch.sort) : next.delete("sort");
      }

      if ("categorySlug" in patch) {
        const slug = patch.categorySlug;
        if (slug) next.set("category", slug);
        else next.delete("category");
        const qs = next.toString();
        navigate(qs ? `/?${qs}` : "/");
        return;
      }
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams, navigate]
  );

  const handleFilterChange = useCallback(
    (key: keyof typeof filters, value: string) => {
      if (key === "selectedCategory") {
        const cat = categories.find((c) => c.id === value);
        updateFilters({ categorySlug: value === "all" ? null : cat?.slug || null });
      } else {
        updateFilters({ [key]: value });
      }
    },
    [categories, updateFilters]
  );

  // ─── Fetchers ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url, is_verified, verification_status")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  // Fetch categories with product counts
  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .order("name");
      if (!cats) return;

      const { data: counts } = await supabase
        .from("items")
        .select("category_id")
        .eq("is_sold", false)
        .eq("status", "available")
        .limit(10000);

      const countMap = new Map<string, number>();
      for (const row of counts || []) {
        if (!row.category_id) continue;
        countMap.set(row.category_id, (countMap.get(row.category_id) || 0) + 1);
      }

      const withCounts: MinimalCategory[] = cats.map((c: any) => ({
        ...c,
        count: countMap.get(c.id) || 0,
      }));
      setCategories(withCounts);
    })();
  }, []);

  const fetchItems = useCallback(async () => {
    let query = supabase
      .from("items")
      .select(
        "id, title, price, images, location, condition, is_negotiable, created_at, ad_type, seller_id, rental_metadata"
      )
      .eq("is_sold", false)
      .eq("status", "available")
      .limit(60);

    // Sorting
    if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("ad_priority", { ascending: false }).order("created_at", { ascending: false });
    }

    if (selectedCategory !== "all") query = query.eq("category_id", selectedCategory);
    if (searchTerm)
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      query = max
        ? query.gte("price", min).lte("price", max)
        : query.gte("price", min);
    }
    if (condition !== "all") {
      query = query.eq("condition", condition);
    }

    const { data: itemsData, error } = await query;
    if (error) {
      toast({ title: "Error", description: "Failed to load listings", variant: "destructive" });
      return;
    }
    if (!itemsData?.length) {
      setItems([]);
      return;
    }

    // Filter out items reserved by other users
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("item_id, buyer_id")
      .in("item_id", itemsData.map((i) => i.id))
      .eq("status", "pending");

    const reservedByOthers = new Set(
      (pendingOrders ?? [])
        .filter((o) => o.buyer_id !== user?.id)
        .map((o) => o.item_id)
    );

    setItems(
      itemsData
        .filter((item) => !reservedByOthers.has(item.id))
        .map((item) => ({
          ...item,
          rental_metadata: item.rental_metadata as RentalMetadata | null,
        }))
        .slice(0, 40)
    );
  }, [searchTerm, selectedCategory, priceRange, condition, sort, toast, user?.id]);

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
    if (searchTerm) {
      const escaped = searchTerm.replace(/[%,()]/g, '');
      query = query.or(
        `area_locality.ilike.%${escaped}%,landmark.ilike.%${escaped}%,property_type.ilike.%${escaped}%`
      );
    }

    const { data, error } = await query;
    if (error)
      toast({ title: "Error", description: "Failed to load PG listings", variant: "destructive" });
    else setPgListings((data ?? []) as unknown as PGListing[]);
  }, [pgPropertyType, pgSharingType, pgGender, searchTerm, toast]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchPGListings()]);
      setLoading(false);
    })();
  }, [fetchItems, fetchPGListings]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const doRefresh = useCallback(async () => {
    await Promise.all([fetchItems(), fetchPGListings()]);
  }, [fetchItems, fetchPGListings]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 90 && window.scrollY === 0) {
      setPullIndicator(true);
      doRefresh().finally(() => setPullIndicator(false));
    }
  };

  const handleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!isVerified) {
      toast({ title: "Verification required", description: "Verify your account to save favourites", variant: "destructive" });
      return;
    }
    const { data: existing } = await supabase
      .from("favorites")
      .select("item_id")
      .match({ user_id: user.id, item_id: itemId })
      .maybeSingle();
    if (existing) {
      await supabase.from("favorites").delete().match({ user_id: user.id, item_id: itemId });
      toast({ title: "Removed from favourites" });
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, item_id: itemId });
      toast({ title: "❤️ Saved to favourites" });
    }
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    // Clear only the search term when switching tabs (keep other filters in URL)
    updateFilters({ searchTerm: "" });
  };

  const clearProductFilters = () => {
    updateFilters({
      searchTerm: "",
      categorySlug: null,
      priceRange: "all",
      condition: "all",
      sort: "newest",
    });
  };

  const clearPGFilters = () => {
    setPgPropertyType("all");
    setPgSharingType("all");
    setPgGender("all");
  };

  // ─── Dynamic SEO ────────────────────────────────────────────────────────────

  const seoTitle = activeCategory
    ? `${activeCategory.name} for Sale on Campus | MyCampusKart`
    : "MyCampusKart — Buy & Sell on Your Campus | Verified Student Marketplace";
  const seoDesc = activeCategory
    ? `Shop verified student listings in ${activeCategory.name}. Browse, filter by price & condition, and buy directly from peers.`
    : "Browse verified student listings on MyCampusKart. Buy & sell textbooks, electronics, cycles, lab coats and PG rooms inside Indian campuses. Free, secure, student-only.";
  const seoPath = activeCategory ? `/?category=${activeCategory.slug}` : "/";

  // Active filter chips
  const activeFilterChips: { label: string; onClear: () => void }[] = [];
  if (activeCategory) activeFilterChips.push({ label: activeCategory.name, onClear: () => handleFilterChange("selectedCategory", "all") });
  if (priceRange !== "all") activeFilterChips.push({ label: `₹${priceRange.replace("-", " - ₹")}`, onClear: () => handleFilterChange("priceRange", "all") });
  if (condition !== "all") activeFilterChips.push({ label: condition.replace("_", " "), onClear: () => handleFilterChange("condition", "all") });
  if (searchTerm) activeFilterChips.push({ label: `"${searchTerm}"`, onClear: () => handleFilterChange("searchTerm", "") });

  // ─── Render ──────────────────────────────────────────────────────────────────

  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() ?? "U";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div
      className="min-h-screen bg-background pb-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={canonical(seoPath)}
      />

      {/* Pull-to-refresh indicator */}
      {pullIndicator && (
        <div className="flex items-center justify-center py-2 gap-1.5 text-xs font-medium text-primary bg-primary/5 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
          Refreshing…
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/96 backdrop-blur-xl border-b border-border/50">

        {/* Row 1 — Avatar + name | Bell */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            onClick={() => navigate("/pwa-profile")}
            className="flex items-center gap-2.5 group active:opacity-70 transition-opacity"
          >
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-1">
                <AvatarImage src={profile?.avatar_url ?? ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              {isVerified && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <CheckCircle2 className="h-2 w-2 text-white" />
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-[11px] text-muted-foreground leading-none mb-0.5">Good day 👋</p>
              <p className="text-sm font-semibold text-foreground leading-tight max-w-[130px] truncate">
                {firstName}
              </p>
            </div>
          </button>

          <NotificationBell variant="icon" className="h-10 w-10 rounded-2xl bg-muted/70" />
        </div>

        {/* Row 2 — Search + Sort + Filter */}
        <div className="px-4 pb-2.5 flex items-center gap-2">
          <div className="flex-1">
            <PWASearchBar
              value={searchTerm}
              onChange={(val) => handleFilterChange("searchTerm", val)}
              placeholder={
                activeTab === "products"
                  ? "Search products, brands…"
                  : "Search PG, hostel, rooms…"
              }
              showFilter={false}
            />
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOpen(true)}
            className="h-11 w-11 rounded-xl bg-muted/70 flex items-center justify-center active:scale-90 transition-transform shrink-0"
            aria-label="Sort"
          >
            <ArrowUpDown className="h-4 w-4 text-foreground" />
          </button>

          {/* Filter with count badge */}
          <button
            onClick={() => setFilterOpen(true)}
            aria-label="Filter"
            className={`relative h-11 w-11 rounded-xl flex items-center justify-center active:scale-90 transition-all shrink-0 ${
              activeFilterCount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border border-background">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Row 3 — Products / PG tab switcher (sliding pill) */}
        <div className="px-4 pb-3">
          <div className="relative flex bg-muted/50 rounded-2xl p-1">
            <span
              className="absolute top-1 bottom-1 rounded-xl bg-background shadow-sm transition-all duration-300 ease-out"
              style={{
                width: "calc(50% - 6px)",
                left: activeTab === "products" ? "4px" : "calc(50% + 2px)",
              }}
            />
            {(["products", "pg"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-9 text-sm font-semibold transition-colors duration-200 ${
                  activeTab === tab ? "text-foreground" : "text-muted-foreground"
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

        {/* Row 4 — Category chips (horizontal) */}
        <div className="overflow-x-auto scrollbar-hide pb-3">
          <div className="flex gap-2 px-4 w-max">
            {activeTab === "products" ? (
              <>
                <PWACategoryChip
                  label="All"
                  isActive={selectedCategory === "all"}
                  onClick={() => handleFilterChange("selectedCategory", "all")}
                />
                {categories.map((cat) => (
                  <PWACategoryChip
                    key={cat.id}
                    icon={cat.icon ?? undefined}
                    label={cat.name}
                    isActive={selectedCategory === cat.id}
                    onClick={() => handleFilterChange("selectedCategory", cat.id)}
                  />
                ))}
              </>
            ) : (
              <>
                {[
                  { value: "all", label: "All" },
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

      {/* MAIN CONTENT */}
      <main className="px-4 pt-4 space-y-4 max-w-7xl mx-auto">

        {/* Hero banner slider */}
        <PWAImageSlider />

        {/* Daily Login Reward */}
        {user && <DailyLoginReward />}

        {/* Category cards removed — chip row in header is the single category UI on PWA */}

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && activeTab === "products" && (
          <div className="flex flex-wrap gap-2 pb-1">
            <span className="text-xs text-muted-foreground self-center">Filters:</span>
            {activeFilterChips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.onClear}
                className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full hover:bg-primary/20 transition-colors capitalize"
              >
                {chip.label}
                <span className="text-sm leading-none">×</span>
              </button>
            ))}
            <button
              onClick={clearProductFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline self-center"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results meta row */}
        {!loading && (
          <div className="flex items-center justify-between min-h-[24px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {activeTab === "products" ? sortedItems.length : pgListings.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {activeTab === "products" ? "listings" : "rooms"} found
              </span>
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 cursor-pointer"
                  onClick={() => handleFilterChange("searchTerm", "")}
                >
                  "{searchTerm}"&nbsp;<X className="h-3 w-3" />
                </Badge>
              )}
            </div>

            {activeTab === "products" && sort !== "newest" && (
              <button
                onClick={() => handleFilterChange("sort", "newest")}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                {sort === "price_asc" ? "Price ↑" : "Price ↓"}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div
            className={`grid gap-3 ${
              activeTab === "products"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {Array.from({ length: activeTab === "products" ? 10 : 6 }).map((_, i) => (
              <SkeletonCard key={i} variant={activeTab === "products" ? "product" : "pg"} />
            ))}
          </div>

        ) : activeTab === "products" ? (

          /* ── Products ── */
          sortedItems.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No listings found"
              subtitle="Try a different search or clear your filters."
              onClear={clearProductFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    animation: `fadeSlideUp 300ms ease-out both`,
                    animationDelay: `${Math.min(idx * 25, 250)}ms`,
                  }}
                >
                  <PWAListingCard
                    id={item.id}
                    title={item.title}
                    price={item.price}
                    image={item.images[0] ?? ""}
                    location={item.location}
                    condition={item.condition}
                    isNegotiable={item.is_negotiable}
                    createdAt={item.created_at}
                    imageCount={item.images.length}
                    adType={item.ad_type}
                    rentalMetadata={item.rental_metadata}
                    onClick={() => navigate(`/item/${item.id}`)}
                    onFavorite={(e) => handleFavorite(e, item.id)}
                    showFavorite={!!user && item.seller_id !== user.id}
                  />
                </div>
              ))}
            </div>
          )

        ) : (

          /* ── PG listings ── */
          pgListings.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No PG / Rooms found"
              subtitle="Adjust the property type, sharing, or gender filter."
              onClear={clearPGFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pgListings.map((pg, idx) => (
                <div
                  key={pg.id}
                  style={{
                    animation: `fadeSlideUp 300ms ease-out both`,
                    animationDelay: `${Math.min(idx * 35, 350)}ms`,
                  }}
                >
                  <PGListingCard listing={pg} onClick={() => navigate(`/pg/${pg.id}`)} />
                </div>
              ))}
            </div>
          )
        )}

        <div className="h-4" />
      </main>

      {/* FLOATING ACTION BUTTON — Sell */}
      <button
        onClick={() => navigate("/sell")}
        aria-label="Sell an item"
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 active:scale-90 transition-transform duration-150"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* ══════════════════════════════════════════════════
          SORT SHEET
      ══════════════════════════════════════════════════ */}
      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="pb-1">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              Sort by
            </SheetTitle>
          </SheetHeader>
          <div className="py-3 space-y-1">
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  handleFilterChange("sort", key);
                  setSortOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-colors ${
                  sort === key
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted text-foreground font-medium"
                }`}
              >
                {label}
                {sort === key && <CheckCheck className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ══════════════════════════════════════════════════
          FILTER SHEET (now includes condition for products)
      ══════════════════════════════════════════════════ */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base">
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

          <div className="pt-5 pb-6 space-y-5">
            {activeTab === "products" ? (
              <>
                <div>
                  <p className="text-sm font-semibold mb-3">Price Range</p>
                  <Select value={priceRange} onValueChange={(val) => handleFilterChange("priceRange", val)}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="All prices" />
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

                <div>
                  <p className="text-sm font-semibold mb-3">Condition</p>
                  <Select value={condition} onValueChange={(val) => handleFilterChange("condition", val)}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Condition</SelectItem>
                      <SelectItem value="new">Brand New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold mb-3">Sharing Type</p>
                  <Select value={pgSharingType} onValueChange={setPgSharingType}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue placeholder="Any sharing" />
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
                  <p className="text-sm font-semibold mb-3">Gender Preference</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "all", label: "Any" },
                      { value: "boys", label: "Boys" },
                      { value: "girls", label: "Girls" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setPgGender(value)}
                        className={`h-11 rounded-xl text-sm font-medium border-2 transition-all ${
                          pgGender === value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
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
              className="w-full h-12 rounded-xl font-semibold"
              onClick={() => setFilterOpen(false)}
            >
              {activeFilterCount > 0
                ? `Show results · ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""}`
                : "Done"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Global keyframes + scrollbar hide */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PWADashboard;
