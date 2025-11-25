// Dashboard.tsx - ✅ REDESIGNED, PROFESSIONAL, MODERN, & OPTIMIZED (Positioning Fixed)

import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

// --- UTILITY FUNCTIONS ---
const unique = (arr: (string | null | undefined)[]) => Array.from(new Set(arr)).filter((i): i is string => !!i);

// Cloudinary Thumbnail Helper
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
        color: 'bg-gradient-to-r from-yellow-400 to-amber-300 text-black border border-yellow-500/50',
        benefits: 'Top placement • 3x visibility • Highlighted border'
      };
    case 'premium':
      return {
        icon: <Crown className="h-3 w-3" />,
        label: 'Premium',
        color: 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white border border-purple-300/50',
        benefits: 'Priority listing • Boost button • Extended duration'
      };
    case 'urgent':
      return {
        icon: <Zap className="h-3 w-3" />,
        label: 'Urgent',
        color: 'bg-gradient-to-r from-red-600 to-pink-500 text-white border border-red-300/50',
        benefits: 'Flash indicator • Quick sell price • 48hr highlight'
      };
    default:
      return null;
  }
};


// --- IMAGE SLIDER (Refined Styling) ---
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
      // Smoother loading state
      <section className="py-12 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="h-60 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl animate-pulse bg-gray-200"></div>
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
    // Cleaner background and shadow
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="relative carousel-container rounded-2xl overflow-hidden shadow-2xl h-60 sm:h-80 md:h-96 group">
          <div
            className={`absolute inset-0 transition-opacity duration-500 opacity-100 z-10 ${currentImage.link_url ? 'cursor-pointer' : ''}`}
            onClick={handleSlideClick}
          >
            <img
              src={currentImage.image_url}
              alt={currentImage.title || `Slide ${currentSlide + 1}`}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              loading="lazy"
            />
            {/* Darker, more professional overlay and text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center pb-8 sm:pb-12">
              <div className="text-center text-white space-y-3 max-w-4xl px-4">
                {currentImage.title && <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-lg">{currentImage.title}</h2>}
                {currentImage.link_url && <Button variant="secondary" className="mt-4 text-base font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all">Explore Now</Button>}
              </div>
            </div>
          </div>
          {sliderImages.length > 1 && (
            <>
              {/* Refined navigation buttons */}
              <button
                onClick={e => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/50 text-white p-3 sm:p-4 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 hidden md:block border border-white/30"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/50 text-white p-3 sm:p-4 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 hidden md:block border border-white/30"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          {/* Subtle bottom indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={e => { e.stopPropagation(); setCurrentSlide(index); }}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-primary w-6 shadow-md' : 'bg-white/50 w-2'}`}
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


// --- ITEM CARD (Refined Styling and Positioning) ---
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
  const [isChatting, setIsChatting] = useState(false);

  const thumbnailImages = useMemo(() => {
    return item.images.map(getThumb);
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
    // Refined card hover effect and border
    <Card
      className="group hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 ease-in-out cursor-pointer border border-gray-200 hover:border-primary/50 overflow-hidden bg-white rounded-xl hover:-translate-y-1 w-full"
      onClick={() => navigate(`/item/${item.id}`)}
    >
      <div className="relative">
        <div className="aspect-square w-full rounded-t-xl overflow-hidden">
          <ImageCarousel 
            images={thumbnailImages} 
            alt={item.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy" 
          />
        </div>

        {/* 🚀 Condition Badge (Top Left - as requested) */}
        <Badge variant={item.condition === 'new' ? 'default' : 'secondary'} className="absolute top-3 left-3 text-xs shadow-lg bg-white/90 text-gray-800 backdrop-blur-sm border border-gray-200 z-10">
          {item.condition}
        </Badge>
        
        {/* 🚀 Ad Badge (Top Right - as requested) */}
        {adBenefits && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* POSITIONING CHANGE: from left-3 to right-3 */}
                <Badge className={`absolute top-3 right-3 text-xs flex items-center gap-1 shadow-lg font-semibold ${adBenefits.color} cursor-help z-10`}>
                  {adBenefits.icon}
                  {adBenefits.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="text-xs font-medium bg-black text-white border-none">
                <p>{adBenefits.benefits}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        
        {/* 🚀 Views Counter (Bottom Right - as requested) */}
        {/* POSITIONING CHANGE: from left-3 to right-3 */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-md backdrop-blur-sm">
          <Eye className="h-3 w-3" />
          <span className="text-xs font-medium">{item.views.toLocaleString()}</span>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-extrabold text-xl leading-snug line-clamp-2 text-gray-900">
          {item.title}
        </h3>

        {/* Price and Negotiable Badge */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-primary tracking-tight">₹{item.price.toLocaleString()}</span>
          {item.is_negotiable && <Badge variant="outline" className="text-xs border-green-500 text-green-700 font-medium">Negotiable</Badge>}
        </div>

        {/* Seller Info and Location (Cleaner border separation) */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Truncate user name more aggressively if needed */}
                  <span className="text-sm text-gray-700 truncate max-w-[120px] font-medium hover:text-primary transition-colors">
                    {item.profiles?.full_name || 'Anonymous'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{item.profiles?.full_name || 'Anonymous'}</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 truncate font-medium">
                {item.location || 'Campus'}
              </span>
            </div>
          </TooltipProvider>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3">
          <Button
            size="lg" // Slightly larger buttons feel more premium
            className="flex-1 h-10 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            onClick={onChat}
            disabled={item.seller_id === user?.id || isChatting || !isVerified}
          >
            {isChatting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            {item.seller_id === user?.id ? 'Your Item' : isChatting ? 'Starting Chat...' : 'Chat Seller'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className={`h-10 px-4 border-primary text-primary hover:bg-primary/10 transition-colors shadow-sm ${
                // Optional: Highlight favorite button more clearly if item is favorited (requires state check outside this scope, but for styling, this is the refined look)
                // Assuming it's not favorited for default style:
                'hover:border-primary/80'
            }`}
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


  // Data Enrichment Function (Unchanged logic)
  const enrichItemsWithDetails = useCallback(async (rawItems: RawItem[]): Promise<EnrichedItem[]> => {
    if (rawItems.length === 0 || !allCategories) return []; 

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

  // Single Category Fetch
  const fetchAllCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('id, name, icon').order('name');
    if (!error) {
      const defaultCategory = { id: 'unassigned', name: 'Other', icon: '❓' }; // Renamed from 'Unassigned'
      setAllCategories([...data as MinimalCategory[], defaultCategory]);
    }
    else console.error('Error fetching categories:', error);
  }, []);


  // --- EFFECTS (Unchanged logic) ---

  // Initial Data Load (Profile and Categories)
  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id);
    fetchAllCategories();
  }, [user, fetchProfile, fetchAllCategories]);

  // Debounced Item Fetch on Filter/Search Change (Waits for categories to load)
  useEffect(() => {
    if (!categoriesLoaded) return;

    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, priceRange, fetchItems, categoriesLoaded]);


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


  // --- Filter Components (Refined Icons) ---

  const PriceRangeSelect = ({ className }: { className?: string }) => (
    <Select value={priceRange} onValueChange={(val) => handleFilterChange('priceRange', val)}>
      <SelectTrigger className={`w-full ${className}`}>
        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
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
        <Filter className="h-4 w-4 mr-2 text-gray-500" />
        <SelectValue placeholder={categoriesLoaded ? "Category" : "Loading Categories..."} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {allCategories && allCategories
          .map(category => (
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

      {/* 🚀 Verification Alert (Redesigned for Professionalism) */}
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
              <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md" onClick={() => navigate('/kyc')}>
                Verify Now &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Slider Section */}
      <ImageSliderSection />

      <div className="container mx-auto px-4 py-12">
        {/* 🚀 Search and Filters (Redesigned: Clean, integrated into the flow) */}
        <div className="mb-12 space-y-4">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Search className="h-8 w-8 text-primary" />
            Discover Campus Deals
          </h2>
          <p className="text-lg text-gray-600">Find the best second-hand items posted by your verified peers.</p>

          {/* Desktop Filters (Inline with a clean border) */}
          <div className="hidden lg:flex gap-4 p-5 border border-gray-200 rounded-xl bg-white shadow-lg">
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

          {/* Mobile Filters (Unchanged sheet for functionality, but using new components) */}
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
                  {/* Applied filter button is usually handled by closing the sheet, but keeping this for explicit action */}
                  <Button className="mt-4">Apply Filters</Button> 
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden rounded-xl h-[350px] border border-gray-100 shadow-sm">
                <div className="aspect-square w-full bg-gray-200"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-7 bg-primary/30 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded mt-4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-dashed border-gray-300">
            <ShoppingBag className="h-16 w-16 text-primary/70 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-gray-800">No matching items found</h3>
            <p className="text-gray-500 text-lg mb-6">
              Try adjusting your search terms or filters for better results.
            </p>
            <Button size="lg" className="mt-4 bg-primary hover:bg-primary/90 shadow-lg" onClick={() => navigate('/list-item')}>
              <Plus className="h-5 w-5 mr-2" />
              List an Item Now
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            {/* 🚀 NATIVE GRID REPLACEMENT: Fast and Build-Safe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
      </div>
    </div>
  );
};

export default Dashboard;
