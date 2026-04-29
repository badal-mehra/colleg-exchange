// Dashboard.tsx - ✅ FINAL, BUILD-SAFE (NO VIRTUALIZATION), & OPTIMIZED

import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Filter, Heart, Eye, ShoppingBag,
  Upload, Star, MapPin, ChevronLeft, ChevronRight, Crown, Zap, Clock, Loader2, Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PGListingCard from '@/components/PGListingCard';
import { getSliderImageUrl } from '@/utils/cloudinaryUpload';
import SliderSidePanels from '@/components/SliderSidePanels';


// --- INTERFACES (Unchanged) ---
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verification_status: string;
  avatar_url: string | null;
  mck_id: string;
  trust_seller_badge: boolean;
}

interface MinimalProfile {
  user_id: string;
  full_name: string;
  trust_seller_badge: boolean;
  avatar_url: string | null;
}

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
}

interface EnrichedItem extends RawItem {
  profiles: MinimalProfile;
  categories: MinimalCategory;
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
const unique = (arr: (string | null | undefined)[]) => Array.from(new Set(arr)).filter((i): i is string => !!i);

// ✅ STEP 4 FIX: Cloudinary Thumbnail Helper (w_300 for grid view efficiency)
const getThumb = (url: string) => {
  if (url.includes('cloudinary.com')) {
    // f_auto,q_auto for optimization, w_300,h_300,c_fill for small square thumbnail
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_300,h_300,c_fill/');
  }
  return url; // Return original URL if it's not a Cloudinary link (e.g., local mock)
};

const getAdTypeBenefits = (adType: string) => {
  switch (adType) {
    case 'featured':
      return {
        icon: <Star className="h-3 w-3" />,
        label: 'Featured',
        color: 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black',
        benefits: 'Top placement • 3x visibility • Highlighted border'
      };
    case 'premium':
      return {
        icon: <Crown className="h-3 w-3" />,
        label: 'Premium',
        color: 'bg-gradient-to-r from-purple-600 to-indigo-500',
        benefits: 'Priority listing • Boost button • Extended duration'
      };
    case 'urgent':
      return {
        icon: <Zap className="h-3 w-3" />,
        label: 'Urgent',
        color: 'bg-gradient-to-r from-red-600 to-pink-500',
        benefits: 'Flash indicator • Quick sell price • 48hr highlight'
      };
    default:
      return null;
  }
};

// ❌ VIRTUALIZATION WRAPPERS REMOVED (ItemWrapper, ItemListWrapper)


// --- IMAGE SLIDER (Kept) ---
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
      <section className="py-12 bg-muted/30">
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
    <section className="py-12 bg-card/50">
      <div className="container mx-auto px-4">
        <SliderSidePanels.Layout>
        <div className="relative mx-auto w-full max-w-3xl lg:max-w-none aspect-video rounded-2xl overflow-hidden shadow-xl group">
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
            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-8 sm:pb-12">
              <div className="text-center text-white space-y-2 max-w-3xl px-4">
                {currentImage.title && <h2 className="text-xl sm:text-3xl lg:text-5xl font-extrabold drop-shadow-lg">{currentImage.title}</h2>}
                {currentImage.link_url && <Button variant="secondary" className="mt-4 animate-bounce-slow">Explore Now</Button>}
              </div>
            </div> */}
          </div>
          {sliderImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 transform -translate-x-10 group-hover:translate-x-0 hidden sm:block"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 transform translate-x-10 group-hover:translate-x-0 hidden sm:block"
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


// --- ITEM CARD (Memoized) ---
interface ItemCardProps {
  item: EnrichedItem;
  user: any;
  isVerified: boolean;
  navigate: (path: string) => void;
  // Passing stable functions (useCallback) is vital for memo not to bust
  handleStartConversation: (item: EnrichedItem) => Promise<void>;
  handleFavoriteToggle: (e: React.MouseEvent, item: EnrichedItem) => Promise<void>;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, user, isVerified, navigate, handleStartConversation, handleFavoriteToggle }) => {
  const adBenefits = getAdTypeBenefits(item.ad_type);
  const [isFavoriting, setIsFavoriting] = useState(false);

  // Get first thumbnail image
  const thumbnailImage = useMemo(() => {
    return item.images[0] ? getThumb(item.images[0]) : '/placeholder.svg';
  }, [item.images]);

  const onFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavoriting(true);
    await handleFavoriteToggle(e, item);
    setIsFavoriting(false);
  };

  // Time ago helper
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

  return (
    <div
      className="group bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
      onClick={() => navigate(`/item/${item.id}`)}
    >
      {/* Image Container - 4:3 aspect ratio like OLX */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={thumbnailImage}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Ad Type Badge - Top Left */}
        {adBenefits && (
          <Badge className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm font-semibold ${adBenefits.color}`}>
            {adBenefits.icon}
            <span className="hidden sm:inline">{adBenefits.label}</span>
          </Badge>
        )}

        {/* Favorite Button - Top Right */}
        <button
          onClick={onFavorite}
          disabled={isFavoriting || !user || !isVerified}
          className="absolute top-2 right-2 p-1.5 bg-card/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-card transition-colors disabled:opacity-50"
        >
          {isFavoriting ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Heart className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        {/* Views Badge - Bottom Right */}
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
        <p className="text-lg sm:text-xl font-bold text-foreground">
          ₹{item.price.toLocaleString()}
        </p>

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

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Tab state for Products vs PG/Rooms
  const [activeTab, setActiveTab] = useState<'products' | 'pg'>('products');

  // States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<EnrichedItem[]>([]);
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
  const isVerified = useMemo(() => profile?.is_verified && profile?.verification_status === 'approved', [profile]);


  const categoriesLoaded = allCategories !== null;
  const categoryMap = useMemo(() => {
    if (!allCategories) return new Map();
    return new Map(allCategories.map(c => [c.id, c]));
  }, [allCategories]);


  // Data Enrichment Function
  const enrichItemsWithDetails = useCallback(async (rawItems: RawItem[]): Promise<EnrichedItem[]> => {
    if (rawItems.length === 0 || !allCategories) return []; // Guard against race condition

    const sellerIds = unique(rawItems.map(i => i.seller_id));

    // Batch Fetch Profiles
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, trust_seller_badge, avatar_url')
        .in('user_id', sellerIds);

    const profileMap = new Map(profilesData?.map(p => [p.user_id, p as MinimalProfile]));

    return rawItems.map(item => {
      const safeCategoryId = item.category_id || 'unassigned';

      const profileDetails = profileMap.get(item.seller_id) || { user_id: item.seller_id, full_name: 'Unknown Seller', trust_seller_badge: false, avatar_url: null };

      const categoryDetails = categoryMap.get(safeCategoryId) || { id: safeCategoryId, name: 'Other', icon: '❓' };

      return {
        ...item,
        profiles: profileDetails,
        categories: categoryDetails,
      } as EnrichedItem;
    });
  }, [allCategories, categoryMap]);


  const fetchItems = useCallback(async () => {
    if (!categoriesLoaded) {
      setLoading(true);
      return;
    }

    setLoading(true);
    
    // ✅ STEP 2 FIX: Implement Pagination (Limit to first 20 items for the initial load)
    const PAGE_LIMIT = 20;

    let query = supabase.from('items').select(`*`)
      .eq('is_sold', false)
      .order('ad_priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, PAGE_LIMIT - 1); // Only fetch 20 items (0 to 19)

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
      console.error('Error fetching raw items:', error);
      toast({ title: "Error", description: "Failed to load items", variant: "destructive" });
    } else {
      const enrichedItems = await enrichItemsWithDetails(rawItems as RawItem[]);
      setItems(enrichedItems);
    }
    setLoading(false);
  }, [searchTerm, selectedCategory, priceRange, enrichItemsWithDetails, toast, categoriesLoaded]);

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
    if (pgFilters.rentRange !== 'all') {
      const [min, max] = pgFilters.rentRange.split('-').map(Number);
      query = max ? query.gte('rent_per_month', min).lte('rent_per_month', max) : query.gte('rent_per_month', min);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching PG listings:', error);
    } else {
      setPgListings(data || []);
    }
    setLoading(false);
  }, [pgFilters]);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (!error) setProfile(data);
    else console.error('Error fetching profile:', error);
  }, []);

  // Single Category Fetch
  const fetchAllCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('id, name, icon').order('name');
    if (!error) {
      const defaultCategory = { id: 'unassigned', name: 'Unassigned', icon: '❓' };
      setAllCategories([...data as MinimalCategory[], defaultCategory]);
    }
    else console.error('Error fetching categories:', error);
  }, []);


  // --- EFFECTS ---

  // Initial Data Load (Profile and Categories)
  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id);
    fetchAllCategories();
  }, [user, fetchProfile, fetchAllCategories]);

  // Debounced Item Fetch on Filter/Search Change (Waits for categories to load)
  useEffect(() => {
    if (!categoriesLoaded) return;
    if (activeTab !== 'products') return;

    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, priceRange, fetchItems, categoriesLoaded, activeTab]);

  // Fetch PG listings when tab changes or filters change
  useEffect(() => {
    if (activeTab !== 'pg') return;

    const debounceTimer = setTimeout(() => {
      fetchPGListings();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [activeTab, pgFilters, fetchPGListings]);


  // --- HANDLERS (Wrapped in useCallback for memoization stability) ---

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStartConversation = useCallback(async (item: EnrichedItem) => {
    if (!user || item.seller_id === user.id) return;

    if (!isVerified) {
      toast({ title: "Verification Required", description: "Please complete your KYC verification to start chatting.", variant: "destructive" });
      navigate('/kyc');
      return;
    }
    
    try {
      let { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', item.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', item.seller_id)
        .maybeSingle();

      if (!existingConversation) {
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id })
          .select('id')
          .single();
        if (error) throw error;
        existingConversation = newConversation;
      }
      navigate(`/chat/${existingConversation.id}`);
    } catch (error) {
      console.error('Error handling conversation:', error);
      toast({ title: "Error", description: "Failed to start conversation. Please try again.", variant: "destructive" });
    }
  }, [user, isVerified, navigate, toast]);

  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent, item: EnrichedItem) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login Required", description: "Please login to manage favorites.", variant: "destructive" });
      navigate('/auth');
      return;
    }
    if (!isVerified) {
      toast({ title: "Verification Required", description: "Please complete your KYC verification to use this feature.", variant: "destructive" });
      navigate('/kyc');
      return;
    }
    
    try {
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', item.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('favorites').delete().eq('id', existing.id);
        toast({ title: "Removed from Favorites", description: `${item.title} has been removed.` });
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, item_id: item.id });
        toast({ title: "Added to Favorites", description: `${item.title} is now in your list!` });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({ title: "Error", description: "Failed to update favorites. Please try again.", variant: "destructive" });
    }
  }, [user, isVerified, navigate, toast]);


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
        <SelectValue placeholder={categoriesLoaded ? "Category" : "Loading Categories..."} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {allCategories && allCategories
          .filter(c => c.id !== 'unassigned')
          .map(category => (
          <SelectItem key={category.id} value={category.id}>
            <span className="mr-2 inline-block" role="img" aria-label={category.name}>{category.icon}</span>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );


  return (
    <div className="flex-1 bg-gray-50">

      {/* Verification Alert */}
      {!isVerified && (
        <div className="bg-orange-50 border-orange-200 border-b text-orange-700 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <Upload className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">
                  Action Required: Please verify your student identity to unlock buying/selling features.
                </span>
              </div>
              {/* Button Color Changed Below */}
              <Button 
                size="sm" 
                variant="default" 
                className="bg-blue-600 text-white hover:bg-blue-700" 
                onClick={() => navigate('/kyc')}
              >
                Verify Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Alert */}
      {/* {!isVerified && (
        <div className="bg-orange-50 border-orange-200 border-b text-orange-700 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <Upload className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">
                  Action Required: Please verify your student identity to unlock buying/selling features.
                </span>
              </div>
              <Button size="sm" variant="default" className="bg-warning text-white hover:bg-warning/90" onClick={() => navigate('/kyc')}>
                Verify Now
              </Button>
            </div>
          </div>
        </div>
      )}  */}

      {/* Image Slider Section */}
      <ImageSliderSection />

      <div className="container mx-auto px-4 py-12">
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

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <>
            {/* Search and Filters */}
            <div className="mb-10 space-y-4 p-6 rounded-2xl shadow-xl bg-white/95 backdrop-blur-sm border border-gray-100">
              <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                <Search className="h-7 w-7 text-primary" />
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
                    className="pl-10 h-11 border-gray-300 focus:border-primary/50 text-base"
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
                      <SheetTitle className="flex items-center gap-2"><Filter /> Advanced Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-6">
                      <CategorySelect />
                      <PriceRangeSelect />
                      <Button>Apply Filters</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

        {/* Items Grid - OLX Style: 2 columns on mobile, 3 on tablet, 4 on desktop */}
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
            <Button onClick={() => navigate('/sell')}>
              <Plus className="h-4 w-4 mr-2" />
              Sell Something
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            {/* OLX-Style Grid: 2 cols mobile, scales up */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    user={user}
                    isVerified={isVerified}
                    navigate={navigate}
                    handleStartConversation={handleStartConversation}
                    handleFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            </TooltipProvider>
          )}
          </>
        )}

        {/* PG/Rooms Tab Content */}
        {activeTab === 'pg' && (
          <>
            {/* PG Filters */}
            <div className="mb-10 space-y-4 p-6 rounded-2xl shadow-xl bg-white/95 backdrop-blur-sm border border-gray-100">
              <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                <Home className="h-7 w-7 text-orange-500" />
                Find PG & Rooms
              </h2>

              <div className="flex flex-wrap gap-4">
                <Select value={pgFilters.propertyType} onValueChange={(v) => setPgFilters(prev => ({ ...prev, propertyType: v }))}>
                  <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sharing Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sharing</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pgFilters.rentRange} onValueChange={(v) => setPgFilters(prev => ({ ...prev, rentRange: v }))}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Rent Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-3000">Under ₹3,000</SelectItem>
                    <SelectItem value="3000-5000">₹3,000 - ₹5,000</SelectItem>
                    <SelectItem value="5000-8000">₹5,000 - ₹8,000</SelectItem>
                    <SelectItem value="8000-12000">₹8,000 - ₹12,000</SelectItem>
                    <SelectItem value="12000">₹12,000+</SelectItem>
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
                  Try adjusting your filters or be the first to list
                </p>
                <Button onClick={() => navigate('/sell')}>
                  <Plus className="h-4 w-4 mr-2" />
                  List a PG/Room
                </Button>
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
    </div>
  );
};

export default Dashboard;
