// Dashboard.tsx - Enhanced, Refactored, and User-Friendly Version

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
  Upload, Star, MapPin, ChevronLeft, ChevronRight, Crown, Zap, Clock, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '@/components/ImageCarousel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // New component for Mobile Filters

// --- INTERFACES ---
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
  is_sold: boolean;
  views: number;
  created_at: string;
  seller_id: string;
  ad_type: string;
  is_negotiable: boolean;
  tags: string[];
  expires_at: string;
  categories: Category;
  profiles: Profile;
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

// --- SEPARATE COMPONENT: Image Slider (Cleaned up, added a simple loading state) ---
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
        setSliderImages([]); // Set to empty array on error/no data
      }
    };
    fetchSliderImages();
  }, []);

  const nextSlide = useCallback(() => {
    if (sliderImages && sliderImages.length > 0) {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }
  }, [sliderImages]);

  const prevSlide = useCallback(() => {
    if (sliderImages && sliderImages.length > 0) {
      setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length);
    }
  }, [sliderImages]);

  // Auto-slide interval
  useEffect(() => {
    if (sliderImages && sliderImages.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [sliderImages, nextSlide]);

  if (sliderImages === null) {
    // Skeleton Loader for Slider
    return (
      <section className="py-12 bg-gray-100/50">
        <div className="container mx-auto px-4">
          <div className="h-60 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-lg animate-pulse bg-gray-200"></div>
        </div>
      </section>
    );
  }

  if (sliderImages.length === 0) return null;

  const currentImage = sliderImages[currentSlide];

  const handleSlideClick = () => {
    if (currentImage.link_url) {
      window.open(currentImage.link_url, '_blank', "noopener,noreferrer");
    }
  };

  return (
    <section className="py-12 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="relative carousel-container rounded-2xl overflow-hidden shadow-xl h-60 sm:h-80 md:h-96 group">
          {/* Main Slide Content */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 opacity-100 z-10 ${currentImage.link_url ? 'cursor-pointer' : ''}`}
            onClick={handleSlideClick}
          >
            <img
              src={currentImage.image_url}
              alt={currentImage.title || `Slide ${currentSlide + 1}`}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-8 sm:pb-12">
              <div className="text-center text-white space-y-2 max-w-3xl px-4">
                {currentImage.title && <h2 className="text-xl sm:text-3xl lg:text-5xl font-extrabold drop-shadow-lg">{currentImage.title}</h2>}
                {currentImage.description && <p className="text-sm sm:text-base lg:text-xl opacity-90 drop-shadow-md hidden md:block">{currentImage.description}</p>}
                {currentImage.link_url && <Button variant="secondary" className="mt-4 animate-bounce-slow">Explore Now</Button>}
              </div>
            </div>
          </div>

          {/* Navigation buttons - Hidden on small screens, appear on hover */}
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

          {/* Dots indicator */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={e => { e.stopPropagation(); setCurrentSlide(index); }}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-6' : 'bg-white/50 w-2'
                }`}
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

// --- SEPARATE COMPONENT: Item Card ---
interface ItemCardProps {
  item: Item;
  user: any;
  isVerified: boolean;
  navigate: (path: string) => void;
  handleStartConversation: (item: Item) => Promise<void>;
  handleFavoriteToggle: (e: React.MouseEvent, item: Item) => Promise<void>;
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item, user, isVerified, navigate, handleStartConversation, handleFavoriteToggle }) => {
  const adBenefits = getAdTypeBenefits(item.ad_type);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

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
    <Card
      key={item.id}
      className="group hover:shadow-2xl hover:shadow-primary/20 transition-transform duration-300 ease-in-out cursor-pointer border border-border hover:border-primary/50 overflow-hidden bg-white rounded-xl hover:-translate-y-1"
      onClick={() => navigate(`/item/${item.id}`)}
    >
      <div className="relative">
        <div className="aspect-square w-full rounded-t-xl overflow-hidden">
          <ImageCarousel images={item.images} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>

        {/* Ad Type Badge with Tooltip */}
        {adBenefits && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`absolute top-3 left-3 text-xs flex items-center gap-1 shadow-lg font-semibold ${adBenefits.color} cursor-help`}>
                {adBenefits.icon}
                {adBenefits.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{adBenefits.benefits}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Badge variant={item.condition === 'new' ? 'default' : 'secondary'} className="absolute top-3 right-3 text-xs shadow-lg">
          {item.condition}
        </Badge>

        <div className="absolute bottom-2 left-2 bg-black/60 text-white rounded-lg px-2 py-1 flex items-center gap-1 shadow-md">
          <Eye className="h-3 w-3" />
          <span className="text-xs font-medium">{item.views.toLocaleString()} views</span>
        </div>
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-lg leading-snug line-clamp-2 text-gray-900">
          {item.title}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-primary">₹{item.price.toLocaleString()}</span>
          {item.is_negotiable && <Badge variant="outline" className="text-xs border-primary/50 text-primary/80">Negotiable</Badge>}
        </div>

        {/* Seller/Meta Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border/70">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-gray-600 truncate max-w-[100px] font-medium">
                  {item.profiles?.full_name || 'Anonymous'}
                </span>
              </TooltipTrigger>
              <TooltipContent>{item.profiles?.full_name || 'Anonymous'}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-gray-600 truncate font-medium">
              {item.location || 'Campus'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3">
          <Button
            size="sm"
            className="flex-1 h-9 text-sm font-semibold"
            onClick={onChat}
            disabled={item.seller_id === user?.id || isChatting || !isVerified}
          >
            {isChatting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            {item.seller_id === user?.id ? 'Your Item' : isChatting ? 'Starting Chat...' : 'Chat'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 border-primary text-primary hover:bg-primary/10"
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
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategory: 'all',
    priceRange: 'all',
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const { searchTerm, selectedCategory, priceRange } = filters;

  const isVerified = useMemo(() => profile?.is_verified && profile?.verification_status === 'approved', [profile]);

  // --- DATA FETCHING FUNCTIONS ---

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (!error) setProfile(data);
    else console.error('Error fetching profile:', error);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('id, name, icon').order('name');
    if (!error) setCategories(data || []);
    else console.error('Error fetching categories:', error);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('items').select(`
        *,
        categories (*),
        profiles (*)
      `).eq('is_sold', false).order('created_at', {
      ascending: false
    });

    // Filtering logic
    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (searchTerm) {
      // Use full-text search index if available, otherwise OR ilike
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      if (max) {
        query = query.gte('price', min).lte('price', max);
      } else {
        query = query.gte('price', min);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to load items. Please try again.",
        variant: "destructive"
      });
    } else {
      setItems(data as Item[] || []);
    }
    setLoading(false);
  }, [searchTerm, selectedCategory, priceRange, toast]);

  // --- EFFECTS ---

  useEffect(() => {
    if (!user) return;

    fetchProfile(user.id);
    fetchCategories();
    // No need to call fetchItems here, as the dependency effect handles initial fetch
  }, [user, fetchProfile, fetchCategories]);

  // Debounced fetch for items on filter/search change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, priceRange, fetchItems]);

  // --- HANDLERS ---

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStartConversation = useCallback(async (item: Item) => {
    if (!user || item.seller_id === user.id) return;

    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification to start chatting.",
        variant: "destructive"
      });
      navigate('/kyc');
      return;
    }

    try {
      // 1. Check/Create conversation
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
          .insert({
            item_id: item.id,
            buyer_id: user.id,
            seller_id: item.seller_id
          })
          .select('id')
          .single();

        if (error) throw error;
        existingConversation = newConversation;
      }

      navigate(`/chat/${existingConversation.id}`);
    } catch (error) {
      console.error('Error handling conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, isVerified, navigate, toast]);

  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent, item: Item) => {
    e.stopPropagation(); // Prevent card navigation

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to manage favorites.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification to use this feature.",
        variant: "destructive",
      });
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
      // OPTIONAL: A more advanced version would also update the item's favorite status in the local state for immediate feedback.
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
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
    <Select value={selectedCategory} onValueChange={(val) => handleFilterChange('selectedCategory', val)}>
      <SelectTrigger className={`w-full ${className}`}>
        <Filter className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map(category => (
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
                  **Action Required:** Please verify your student identity to unlock buying/selling features.
                </span>
              </div>
              <Button size="sm" variant="default" className="bg-warning text-white hover:bg-warning/90" onClick={() => navigate('/kyc')}>
                Verify Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Slider Section */}
      <ImageSliderSection />

      <div className="container mx-auto px-4 py-12">
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
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
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
                  <Button onClick={() => setIsFilterSheetOpen(false)}>Apply Filters</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden rounded-xl h-[350px]">
                <div className="aspect-square w-full bg-gray-200"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-7 bg-primary/20 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-inner border border-dashed border-gray-300">
            <ShoppingBag className="h-16 w-16 text-primary/70 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-gray-700">No matching items found</h3>
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm || selectedCategory !== 'all' ? "Try adjusting your search terms or filters for better results." : "Be the first to list an item on your campus!"}
            </p>
            <Button size="lg" className="mt-4" onClick={() => navigate('/list-item')}>
              <Plus className="h-5 w-5 mr-2" />
              List an Item Now
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {items.map(item => (
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
