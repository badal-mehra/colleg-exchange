// Dashboard.tsx - ✅ FINAL, PRODUCTION-READY (Battle-Ready Fixes Applied)

import React, { useEffect, useState, memo, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, User, Filter, Heart, MessageCircle, Eye, ShoppingBag,
  Upload, Star, MapPin, ChevronLeft, ChevronRight, Crown, Zap, Clock, Loader2, DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '@/components/ImageCarousel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';


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
  id: number;
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

// --- UTILITY DATA & FUNCTIONS ---

// FIX: Move priceRangeMap outside the component to prevent recalculation on every render (Issue 3)
const PRICE_RANGE_MAP: { [key: string]: string } = {
  'all': 'All Prices',
  '0-500': '₹0 - ₹500',
  '500-1000': '₹500 - ₹1,000',
  '1000-5000': '₹1,000 - ₹5,000',
  '5000-10000': '₹5,000 - ₹10,000',
  '10000': '₹10,000+',
};

const unique = (arr: (string | null | undefined)[]) => Array.from(new Set(arr)).filter((i): i is string => !!i);

// Cloudinary Thumbnail Helper
const getThumb = (url: string) => {
  if (url.includes('cloudinary.com')) {
    // f_auto,q_auto for optimization, w_300,h_300,c_fill for small square thumbnail
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_300,h_300,c_fill/');
  }
  return url; // Return original URL if it's not a Cloudinary link (e.g., local mock)
};

// Robust Ad Type Matching Logic
const getAdTypeBenefits = (adType: string = "") => {
  const type = String(adType || "").trim().toLowerCase();
  const baseStyle = 'text-[10px] flex items-center gap-1 font-medium text-gray-500 px-0 py-0 z-20 pointer-events-none'; 

  switch (type) {
    case "featured":
    case "feature":
    case "featured_ad":
      return {
        icon: <Star className="h-3 w-3 text-yellow-500" />,
        label: 'FEATURED',
        color: baseStyle, 
        benefits: 'Top placement • 3x visibility'
      };
    case "premium":
    case "premium_ad":
      return {
        icon: <Crown className="h-3 w-3 text-purple-500" />,
        label: 'PREMIUM',
        color: baseStyle, 
        benefits: 'Priority listing • Extended duration'
      };
    case "urgent":
    case "urgent_ad":
      return {
        icon: <Zap className="h-3 w-3 text-red-500" />,
        label: 'URGENT',
        color: baseStyle, 
        benefits: 'Flash indicator • 48hr highlight'
      };
    default:
      return null;
  }
};


// --- IMAGE SLIDER (Unchanged) ---
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

  // Slider Auto-Play Speed 3000ms
  useEffect(() => {
    if (sliderImages && sliderImages.length > 1) {
      const interval = setInterval(nextSlide, 3000);
      return () => clearInterval(interval);
    }
  }, [sliderImages, nextSlide]);

  if (sliderImages === null) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-60 sm:h-80 md:h-96 rounded-md overflow-hidden animate-pulse bg-gray-200"></div>
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
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Flat style, rounded-md */}
        <div className="relative carousel-container rounded-md overflow-hidden h-60 sm:h-80 md:h-96">
          <div
            className={`absolute inset-0 z-10 ${currentImage.link_url ? 'cursor-pointer' : ''}`}
            onClick={handleSlideClick}
          >
            <img
              src={currentImage.image_url}
              alt={currentImage.title || `Slide ${currentSlide + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Simple semi-transparent bottom bar for text/CTA */}
            <div className="absolute inset-x-0 bottom-0 bg-black/40 flex items-end justify-center py-4 sm:py-6">
              <div className="text-center text-white space-y-2 max-w-4xl px-4">
                {currentImage.title && <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-sm">{currentImage.title}</h2>}
                {/* Slider CTA Hover Fix: Removed hover:bg-primary/90 */}
                {currentImage.link_url && <Button variant="default" className="mt-2 text-sm font-semibold px-4 py-2 bg-primary text-white">Explore Now</Button>}
              </div>
            </div>
          </div>
          {sliderImages.length > 1 && (
            <>
              {/* Slider Arrow Visual Fix: Removed transition-colors and hover:bg-black/50 */}
              <button
                onClick={e => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-sm z-20 hidden md:block"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-sm z-20 hidden md:block"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          {/* Neutral indicators */}
          <div className="absolute top-4 right-4 flex space-x-1.5 z-20">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={e => { e.stopPropagation(); setCurrentSlide(index); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-primary w-4' : 'bg-white/70 w-1.5'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
const ImageSliderSection = memo(ImageSliderSectionComponent);


// --- ITEM CARD (Unchanged) ---
interface ItemCardProps {
  item: EnrichedItem;
  user: any;
  isVerified: boolean;
  navigate: (path: string) => void;
  handleStartConversation: (item: EnrichedItem) => Promise<void>;
  handleFavoriteToggle: (e: React.MouseEvent, item: EnrichedItem) => Promise<void>;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, user, isVerified, navigate, handleStartConversation, handleFavoriteToggle }) => {
  const adBenefits = getAdTypeBenefits(item.ad_type);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  const condition = (item.condition || "").trim().toLowerCase();
  const views = Number(item.views) || 0;

  const thumbnailImages = useMemo(() => {
    // Guard against null/undefined item.images
    return (item.images || []).map(getThumb);
  }, [item.images]);


  const onChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChatting(true);
    await handleStartConversation(item);
    setIsChatting(false);
  };

  const onFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavoriting(true);
    await handleFavoriteToggle(e, item);
    setIsFavoriting(false);
  };

  return (
    // Card: Dead flat, no hover
    <Card
      className="flex flex-col cursor-pointer border border-gray-200 bg-white rounded-md w-full h-full p-0"
      onClick={() => navigate(`/item/${item.id}`)}
    >
      
      <div className="relative w-full aspect-[4/3] rounded-t-md overflow-hidden bg-gray-50">
        
        {/* Fix: Use inline style for pointer-events-none */}
        <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
            <ImageCarousel
              images={thumbnailImages}
              alt={item.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
        </div>
        
        {/* Condition Badge */}
        {condition && (
            <Badge 
                className="absolute top-2 left-2 text-[10px] bg-white text-gray-800 px-2 py-1 rounded shadow-sm z-20 pointer-events-none"
            >
                {condition === "new" ? "NEW" : condition.toUpperCase()}
            </Badge>
        )}
        
        {/* AD BADGE */}
        {adBenefits && (
          <Badge 
            className={`absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded shadow-sm z-20 pointer-events-none`}
          >
            {adBenefits.icon}
            {adBenefits.label}
          </Badge>
        )}

        
        {/* Views Counter */}
        <div 
          className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-[11px] px-2 py-1 rounded z-20 pointer-events-none"
        >
          <Eye className="h-3 w-3" />
          <span className="font-medium">
            {views.toLocaleString()} 
          </span>
        </div>
        
      </div>

      {/* CardContent */}
      <CardContent className="p-3 flex flex-col gap-2 flex-1">
        
        {/* Price and Negotiable Badge (TOP PRIORITY) */}
        <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-gray-900">₹{item.price.toLocaleString()}</span>
            {item.is_negotiable && (
                <Badge variant="outline" className="text-[11px] border-green-500 text-green-700">
                    Negotiable
                </Badge>
            )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-[13px] leading-5 line-clamp-2 text-gray-900 h-10">
            {item.title}
        </h3>


        {/* Seller Info and Location (Pushed to bottom using mt-auto) */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          {/* Seller Name */}
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-700 truncate max-w-[100px] font-medium">
              {item.profiles?.full_name || 'Anonymous'}
            </span>
          </div>
          {/* Location */}
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-700 truncate font-medium">
              {item.location || 'Campus'}
            </span>
          </div>
        </div>

        {/* Actions: No hover states */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            // Dead flat styling
            className="flex-1 h-8 text-xs font-semibold bg-primary text-white" 
            onClick={onChat}
            disabled={item.seller_id === user?.id || isChatting || !isVerified}
          >
            {isChatting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            {item.seller_id === user?.id ? 'Your Item' : isChatting ? 'Starting...' : 'Chat Seller'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            // Dead flat styling
            className="h-8 w-8 text-primary" 
            onClick={onFavorite}
            disabled={isFavoriting || !user || !isVerified}
          >
            {isFavoriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // FIX: Ref for preventing double fetch on initial mount (Issue 2)
  const isInitialMount = useRef(true); 

  // States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [allCategories, setAllCategories] = useState<MinimalCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategory: 'all',
    priceRange: 'all',
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
    if (rawItems.length === 0 || !allCategories) return []; 

    const sellerIds = unique(rawItems.map(i => i.seller_id));

    // Batch Fetch Profiles
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, trust_seller_badge, avatar_url')
        .in('user_id', sellerIds);

    // Guard against null profilesData
    const profileMap = new Map(
      (profilesData || []).map(p => [p.user_id, p as MinimalProfile])
    );

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
      return;
    }
    
    setLoading(true);

    // Pagination (Limit to first 20 items for the initial load)
    const PAGE_LIMIT = 20;

    let query = supabase.from('items').select(`*`)
      .eq('is_sold', false).order('created_at', { ascending: false })
      .range(0, PAGE_LIMIT - 1); 

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


  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (!error) setProfile(data);
    else console.error('Error fetching profile:', error);
  }, []);

  // Critical fix: Guard data from Supabase to prevent TypeError if null is returned.
  const fetchAllCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('id, name, icon').order('name');
    if (!error) {
      const categories = (data || []) as MinimalCategory[];
      const defaultCategory = { id: 'unassigned', name: 'Other', icon: '❓' }; // 'unassigned' needed for null item categories
      setAllCategories([...categories, defaultCategory]);
    }
    else console.error('Error fetching categories:', error);
  }, []);


  // --- EFFECTS ---

  // 1. Initial Data Load (Profile and Categories)
  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id);
    fetchAllCategories();
  }, [user, fetchProfile, fetchAllCategories]);

  // 2. Immediate fetch upon categories load (back-navigation fix)
  useEffect(() => {
    if (categoriesLoaded) {
      fetchItems();
    }
  }, [categoriesLoaded, fetchItems]);

  // 3. Debounced Item Fetch on Filter/Search Change (Prevents double fetch on mount)
  useEffect(() => {
    if (!categoriesLoaded) return;
    
    // FIX: Prevents fetchItems from being called twice on initial mount/category load (Issue 2)
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return; 
    }

    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, priceRange, categoriesLoaded, fetchItems]);


  // --- HANDLERS (Unchanged logic) ---

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

      if (existingConversation) {
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id })
        .select('id')
        .single();
      if (error) throw error;
      
      navigate(`/chat/${newConversation.id}`);
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


  // --- Filter Components (Refined Icons) ---

  const PriceRangeSelect = ({ className }: { className?: string }) => (
    // Consistent SelectValue usage (children based)
    <Select value={priceRange} onValueChange={(val) => handleFilterChange('priceRange', val)}>
      <SelectTrigger className={`w-full ${className}`}>
        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
        <SelectValue>
          {PRICE_RANGE_MAP[priceRange] || "Price Range"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRICE_RANGE_MAP).map(([key, label]) => (
          <SelectItem key={key} value={key}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const CategorySelect = ({ className }: { className?: string }) => (
    // Set value to undefined if categories aren't loaded to allow SelectValue to show a loading state.
    <Select 
      value={categoriesLoaded ? selectedCategory : undefined} 
      onValueChange={(val) => handleFilterChange('selectedCategory', val)} 
      disabled={!categoriesLoaded}
    >
      <SelectTrigger className={`w-full ${className}`}>
        <Filter className="h-4 w-4 mr-2 text-gray-500" />
        <SelectValue>
          {categoriesLoaded 
            ? selectedCategory === "all"
              ? "All Categories"
              // Find name based on selected ID
              : allCategories?.find(c => c.id === selectedCategory)?.name || "Category"
            : "Loading Categories..."
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* FIX: Removed filter(c => c.id !== 'unassigned') to allow selecting the 'Other' category (Issue 1) */}
        {allCategories && allCategories.map(category => (
          <SelectItem key={category.id} value={category.id}>
            <span className="mr-2 inline-block" role="img" aria-label={category.name}>{category.icon}</span>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );


  // --- RENDER ---

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">

      {/* Verification Alert */}
      {!isVerified && (
        <div className="bg-primary/10 border-b border-primary/20 text-primary-dark sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <Upload className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-gray-800">
                  **Action Required:** Please verify your student identity to **unlock all buying/selling features**.
                </span>
              </div>
              {/* Hover Removed from Verify Now Button */}
              <Button size="sm" variant="default" className="bg-primary text-white font-semibold shadow-md" onClick={() => navigate('/kyc')}>
                Verify Now &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Slider Section */}
      <ImageSliderSection />

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="mb-12 space-y-4">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Search className="h-8 w-8 text-primary" />
            Discover Campus Deals
          </h2>
          <p className="text-lg text-gray-600">Find the best second-hand items posted by your verified peers.</p>

          {/* Desktop Filters: rounded-md. No shadow */}
          <div className="hidden lg:flex gap-4 p-5 border border-gray-200 rounded-md bg-white">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for items, categories, descriptions..."
                value={searchTerm}
                onChange={e => handleFilterChange('searchTerm', e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-primary/50 text-base"
              />
            </div>
            <CategorySelect className="lg:w-64" />
            <PriceRangeSelect className="lg:w-64" />
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={e => handleFilterChange('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="flex-shrink-0 border-gray-300">
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-xl font-bold"><Filter /> Advanced Filters</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <CategorySelect />
                  <PriceRangeSelect />
                  <Button className="mt-4">Apply Filters</Button> 
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden rounded-md h-[350px] border border-gray-100">
                <div className="aspect-[4/3] w-full bg-gray-200"></div>
                <CardContent className="p-3 space-y-3">
                  <div className="h-4 bg-gray-300 rounded mb-2 w-1/3"></div>
                  <div className="h-10 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mt-4"></div>
                  <div className="h-8 bg-gray-200 rounded mt-4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <ShoppingBag className="h-16 w-16 text-primary/70 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-gray-800">No matching items found</h3>
            <p className="text-gray-500 text-lg mb-6">
              Try adjusting your search terms or filters for better results.
            </p>
            {/* Hover Removed from List Item Now Button */}
            <Button size="lg" className="mt-4 bg-primary shadow-lg" onClick={() => navigate('/list-item')}>
              <Plus className="h-5 w-5 mr-2" />
              List an Item Now
            </Button>
          </div>
        ) : (
          // Grid Gap Tightened to gap-4
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
