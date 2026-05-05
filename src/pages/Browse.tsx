// Browse.tsx - Public homepage showing all listings like OLX/Amazon
// Users can browse without login, but need to login for buy/sell/chat/favorites

import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Filter, Heart, Eye, ShoppingBag,
  Star, MapPin, ChevronLeft, ChevronRight, Crown, Zap, Clock, Loader2, Home, LogIn, User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PGListingCard from '@/components/PGListingCard';
import { Footer } from '@/components/Footer';
import logo from '@/assets/mycampuskart-logo.png';
import { getSliderImageUrl } from '@/utils/cloudinaryUpload';
import SliderSidePanels from '@/components/SliderSidePanels';
import InstallAppPopup from '@/components/InstallAppPopup';

// --- INTERFACES ---
interface MinimalCategory {
  id: string;
  name: string;
  icon: string;
}

interface RawItem {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  location: string;
  is_sold: boolean;
  views: number;
  created_at: string;
  seller_id: string;
  category_id: string | null;
  ad_type: string;
  is_negotiable: boolean;
  tags: string[];
  expires_at: string;
  rental_metadata: any;
}

interface SliderImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  link_url: string | null;
}

interface FilterState {
  searchTerm: string;
  selectedCategory: string;
  priceRange: string;
}

// --- UTILITY FUNCTIONS ---
const getThumb = (url: string) => {
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_300,h_300,c_fill/');
  }
  return url;
};

const getAdTypeBenefits = (adType: string) => {
  switch (adType) {
    case 'featured':
      return {
        icon: <Star className="h-3 w-3" />,
        label: 'Featured',
        color: 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black',
      };
    case 'premium':
      return {
        icon: <Crown className="h-3 w-3" />,
        label: 'Premium',
        color: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      };
    case 'urgent':
      return {
        icon: <Zap className="h-3 w-3" />,
        label: 'Urgent',
        color: 'bg-gradient-to-r from-red-600 to-pink-500',
      };
    default:
      return null;
  }
};

// --- IMAGE SLIDER ---
const ImageSliderSectionComponent = () => {
  const [sliderImages, setSliderImages] = useState<SliderImage[] | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchSliderImages = async () => {
      const { data, error } = await supabase
        .from('image_slidebar')
        .select('id, image_url, title, description, link_url')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setSliderImages(data as SliderImage[]);
      } else {
        setSliderImages([]);
      }
    };
    fetchSliderImages();
  }, []);

  const nextSlide = useCallback(() => {
    if (sliderImages && sliderImages.length > 0) {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }
  }, [sliderImages]);

  useEffect(() => {
    if (sliderImages && sliderImages.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [sliderImages, nextSlide]);

  if (sliderImages === null) {
    return (
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto w-full max-w-3xl lg:max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-lg animate-pulse bg-muted"></div>
        </div>
      </section>
    );
  }

  if (sliderImages.length === 0) return null;
  const currentImage = sliderImages[currentSlide];
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length);
  const handleSlideClick = () => {
    if (currentImage.link_url) {
      window.open(currentImage.link_url, '_blank', "noopener,noreferrer");
    }
  };

  return (
    <section className="py-8 bg-card/50">
      <div className="container mx-auto px-4">
        <SliderSidePanels.Layout>
        <div className="relative mx-auto w-full max-w-3xl lg:max-w-none rounded-2xl overflow-hidden shadow-xl aspect-video group">
          <div
            className={`absolute inset-0 transition-opacity duration-500 opacity-100 z-10 ${currentImage.link_url ? 'cursor-pointer' : ''}`}
            onClick={handleSlideClick}
          >
            <img
              src={getSliderImageUrl(currentImage.image_url)}
              alt={currentImage.title || `Slide ${currentSlide + 1}`}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
          {sliderImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 hidden sm:block"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 hidden sm:block"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={e => { e.stopPropagation(); setCurrentSlide(index); }}
                className={`h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50 w-2'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        </SliderSidePanels.Layout>
      </div>
    </section>
  );
};
const ImageSliderSection = memo(ImageSliderSectionComponent);

// --- ITEM CARD (Public Version) ---
interface ItemCardProps {
  item: RawItem;
  isLoggedIn: boolean;
  navigate: (path: string) => void;
  onLoginRequired: () => void;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, isLoggedIn, navigate, onLoginRequired }) => {
  const adBenefits = getAdTypeBenefits(item.ad_type);
  const isRental = !!item.rental_metadata?.rental_duration;

  const thumbnailImage = useMemo(() => {
    return item.images[0] ? getThumb(item.images[0]) : '/placeholder.svg';
  }, [item.images]);

  const timeAgo = useMemo(() => {
    const now = new Date();
    const created = new Date(item.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  }, [item.created_at]);

  const rentalLabel = useMemo(() => {
    if (!item.rental_metadata?.rental_duration) return null;
    const labels: Record<string, string> = {
      per_hour: "/hr",
      per_day: "/day",
      per_week: "/wk",
      per_month: "/mo",
    };
    return labels[item.rental_metadata.rental_duration] || "";
  }, [item.rental_metadata]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onLoginRequired();
    }
  };

  return (
    <div
      className="group bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
      onClick={() => navigate(`/item/${item.id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={thumbnailImage}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Rental Badge */}
        {isRental ? (
          <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
            For Rent
          </Badge>
        ) : adBenefits && (
          <Badge className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm font-semibold ${adBenefits.color}`}>
            {adBenefits.icon}
            <span className="hidden sm:inline">{adBenefits.label}</span>
          </Badge>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-1.5 bg-card/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-card transition-colors"
        >
          <Heart className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
        </button>

        {/* Views Badge */}
        {(item.views ?? 0) > 0 && (
          <div className="absolute bottom-2 right-2 bg-foreground/80 text-background text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Eye className="h-3 w-3" />
            {item.views}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <p className="text-lg sm:text-xl font-bold text-foreground">
            ₹{item.price.toLocaleString()}
          </p>
          {rentalLabel && (
            <span className="text-xs text-muted-foreground font-medium">{rentalLabel}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm text-foreground/90 line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.title}
        </h3>

        {/* Location & Time Row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
          <div className="flex items-center gap-1 truncate max-w-[60%]">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{item.location || 'Campus'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Condition & Negotiable Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {item.condition === 'new' ? 'New' : item.condition === 'like_new' ? 'Like New' : item.condition}
          </Badge>
          {item.is_negotiable && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/40 text-primary">
              Negotiable
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

// --- MAIN BROWSE COMPONENT ---
const Browse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isLoggedIn = !!user;

  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'pg'>('products');

  // States
  const [items, setItems] = useState<RawItem[]>([]);
  const [pgListings, setPgListings] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<MinimalCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategory: 'all',
    priceRange: 'all',
  });

  // PG Filters
  const [pgFilters, setPgFilters] = useState({
    propertyType: 'all',
    sharingType: 'all',
    rentRange: 'all',
  });

  const { searchTerm, selectedCategory, priceRange } = filters;
  const categoriesLoaded = allCategories !== null;

  // Prompt login
  const promptLogin = useCallback(() => {
    toast({
      title: "Login Required",
      description: "Please login to use this feature",
    });
    navigate('/auth');
  }, [toast, navigate]);

  // Fetch Categories
  const fetchAllCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('id, name, icon').order('name');
    if (!error) {
      setAllCategories(data as MinimalCategory[]);
    }
  }, []);

  // Fetch Items
  const fetchItems = useCallback(async () => {
    if (!categoriesLoaded) return;
    setLoading(true);

    let query = supabase.from('items').select('*')
      .eq('is_sold', false)
      .eq('status', 'available')
      .order('ad_priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      query = max ? query.gte('price', min).lte('price', max) : query.gte('price', min);
    }

    const { data: rawItems, error } = await query;
    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems(rawItems as RawItem[] || []);
    }
    setLoading(false);
  }, [searchTerm, selectedCategory, priceRange, categoriesLoaded]);

  // Fetch PG Listings
  const fetchPGListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('pg_listings')
      .select('*')
      .eq('is_active', true)
      .neq('status', 'rented')
      .order('created_at', { ascending: false })
      .limit(20);

    if (pgFilters.propertyType !== 'all') {
      query = query.eq('property_type', pgFilters.propertyType);
    }
    if (pgFilters.sharingType !== 'all') {
      query = query.eq('sharing_type', pgFilters.sharingType);
    }
    if (searchTerm) {
      const escaped = searchTerm.replace(/[%,()]/g, '');
      query = query.or(
        `area_locality.ilike.%${escaped}%,landmark.ilike.%${escaped}%,property_type.ilike.%${escaped}%`
      );
    }

    const { data, error } = await query;
    if (!error) {
      setPgListings(data || []);
    }
    setLoading(false);
  }, [pgFilters, searchTerm]);

  // Initial Load
  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  // Fetch items when categories loaded or filters change
  useEffect(() => {
    if (!categoriesLoaded) return;
    if (activeTab !== 'products') return;

    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, priceRange, fetchItems, categoriesLoaded, activeTab]);

  // Fetch PG when tab changes
  useEffect(() => {
    if (activeTab !== 'pg') return;

    const debounceTimer = setTimeout(() => {
      fetchPGListings();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [activeTab, pgFilters, searchTerm, fetchPGListings]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const PriceRangeSelect = ({ className }: { className?: string }) => (
    <Select value={priceRange} onValueChange={(val) => handleFilterChange('priceRange', val)}>
      <SelectTrigger className={`w-full ${className}`}>
        <Clock className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Price Range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Prices</SelectItem>
        <SelectItem value="0-500">₹0 - ₹500</SelectItem>
        <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
        <SelectItem value="1000-5000">₹1,000 - ₹5,000</SelectItem>
        <SelectItem value="5000-10000">₹5,000 - ₹10,000</SelectItem>
        <SelectItem value="10000">₹10,000+</SelectItem>
      </SelectContent>
    </Select>
  );

  const CategorySelect = ({ className }: { className?: string }) => (
    <Select value={selectedCategory} onValueChange={(val) => handleFilterChange('selectedCategory', val)} disabled={!categoriesLoaded}>
      <SelectTrigger className={`w-full ${className}`}>
        <Filter className="h-4 w-4 mr-2" />
        <SelectValue placeholder={categoriesLoaded ? "Category" : "Loading..."} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {allCategories?.map(category => (
          <SelectItem key={category.id} value={category.id}>
            <span className="mr-2 inline-block">{category.icon}</span>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={logo} 
                alt="MyCampusKart" 
                className="h-10 sm:h-12 cursor-pointer"
                onClick={() => navigate('/')}
              />
              <Badge variant="outline" className="hidden md:flex">
                Campus Marketplace
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              {isLoggedIn ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  <Button size="sm" onClick={() => navigate('/sell')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Sell
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  <Button size="sm" onClick={() => navigate('/auth')}>
                    <User className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Image Slider */}
      <ImageSliderSection />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'pg')} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="pg" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              PG / Rooms
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {/* Search and Filters */}
            <div className="mb-8 space-y-4 p-4 sm:p-6 rounded-2xl shadow-lg bg-card border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Discover Campus Deals
              </h2>

              {/* Desktop Filters */}
              <div className="hidden lg:flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for items, categories, descriptions..."
                    value={searchTerm}
                    onChange={e => handleFilterChange('searchTerm', e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <CategorySelect className="lg:w-60" />
                <PriceRangeSelect className="lg:w-60" />
              </div>

              {/* Mobile Filters */}
              <div className="lg:hidden flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={e => handleFilterChange('searchTerm', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="flex-shrink-0">
                      <Filter className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2"><Filter /> Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-6">
                      <CategorySelect />
                      <PriceRangeSelect />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Items Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-card border border-border rounded-lg overflow-hidden">
                    <div className="aspect-[4/3] bg-muted"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-5 bg-muted rounded w-2/3"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No items found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Try adjusting your search or filters
                </p>
                {isLoggedIn ? (
                  <Button onClick={() => navigate('/sell')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Sell Something
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/auth')}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login to Sell
                  </Button>
                )}
              </div>
            ) : (
              <TooltipProvider>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isLoggedIn={isLoggedIn}
                      navigate={navigate}
                      onLoginRequired={promptLogin}
                    />
                  ))}
                </div>
              </TooltipProvider>
            )}
          </>
        )}

        {/* PG/Rooms Tab */}
        {activeTab === 'pg' && (
          <>
            {/* PG Filters */}
            <div className="mb-8 space-y-4 p-4 sm:p-6 rounded-2xl shadow-lg bg-card border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                Find PG & Rooms
              </h2>

              {/* PG Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by area, landmark, or property type..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={pgFilters.propertyType} onValueChange={(v) => setPgFilters(prev => ({ ...prev, propertyType: v }))}>
                  <SelectTrigger className="w-32 sm:w-40">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pg">PG</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pgFilters.sharingType} onValueChange={(v) => setPgFilters(prev => ({ ...prev, sharingType: v }))}>
                  <SelectTrigger className="w-32 sm:w-40">
                    <SelectValue placeholder="Sharing Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sharing</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PG Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-card border border-border rounded-xl overflow-hidden">
                    <div className="aspect-[4/3] bg-muted"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pgListings.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No PG/Rooms found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Check back later or list yours
                </p>
                {isLoggedIn ? (
                  <Button onClick={() => navigate('/sell')}>
                    <Plus className="h-4 w-4 mr-2" />
                    List a PG/Room
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/auth')}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login to List
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pgListings.map((listing) => (
                  <PGListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => navigate(`/pg/${listing.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
      <InstallAppPopup pageKey="browse" />
    </div>
  );
};

export default Browse;
