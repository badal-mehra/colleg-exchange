// Dashboard.tsx - Redesigned and Optimized Version

import React, { useEffect, useState, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Plus, User, Filter, Heart, MessageCircle, Eye, ShoppingBag, 
  Upload, Star, MapPin, ChevronLeft, ChevronRight, Crown, Zap, Clock 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '@/components/ImageCarousel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

// --- UTILITY FUNCTIONS ---
const getAdTypeBenefits = (adType: string) => {
  switch (adType) {
    case 'featured':
      return {
        icon: <Star className="h-3 w-3" />,
        label: 'Featured',
        color: 'bg-gradient-to-r from-primary to-primary/80',
        benefits: 'Top placement • 3x visibility • Highlighted border'
      };
    case 'premium':
      return {
        icon: <Crown className="h-3 w-3" />,
        label: 'Premium',
        color: 'bg-gradient-to-r from-warning to-warning/80',
        benefits: 'Priority listing • Boost button • Extended duration'
      };
    case 'urgent':
      return {
        icon: <Zap className="h-3 w-3" />,
        label: 'Urgent',
        color: 'bg-gradient-to-r from-destructive to-destructive/80',
        benefits: 'Flash indicator • Quick sell price • 48hr highlight'
      };
    default:
      return null;
  }
};

// --- SEPARATE COMPONENT: Image Slider ---
const ImageSliderSectionComponent = () => {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch slider images once on mount
  useEffect(() => {
    const fetchSliderImages = async () => {
      const { data, error } = await supabase
        .from('image_slidebar')
        .select('id, image_url, title, description, link_url')
        .eq('is_active', true)
        .order('sort_order');
      
      if (!error && data) {
        setSliderImages(data as SliderImage[]);
      }
    };
    fetchSliderImages();
  }, []);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % sliderImages.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  // Auto-slide interval
  useEffect(() => {
    if (sliderImages.length > 0) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [sliderImages.length]);

  if (sliderImages.length === 0) return null;

  const handleSlideClick = (image: SliderImage) => {
    if (image.link_url) {
      window.open(image.link_url, '_blank', "noopener,noreferrer");
    }
  };
  
  return (
    <section className="py-12 bg-card/50"> 
      <div className="container mx-auto px-4">
        <div className="relative carousel-container rounded-2xl overflow-hidden shadow-lg h-60 sm:h-80 md:h-96"> {/* Fixed height for better UI consistency */}
          {sliderImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              } ${image.link_url ? 'cursor-pointer' : ''}`}
              onClick={() => handleSlideClick(image)}
            >
              <img 
                src={image.image_url} 
                alt={image.title || `Slide ${index + 1}`} 
                className="w-full h-full object-cover" 
                loading="lazy" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-end justify-center pb-8 sm:pb-12">
                <div className="text-center text-white space-y-2 max-w-2xl px-4">
                  {image.title && <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold drop-shadow-lg">{image.title}</h2>}
                  {image.description && <p className="text-sm sm:text-base lg:text-xl opacity-90 drop-shadow-md hidden sm:block">{image.description}</p>}
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation buttons */}
          <button 
            onClick={e => { e.stopPropagation(); prevSlide(); }} 
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-all z-20 hover:scale-110" 
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button 
            onClick={e => { e.stopPropagation(); nextSlide(); }} 
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-all z-20 hover:scale-110" 
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 sm:space-x-2 z-20">
            {sliderImages.map((_, index) => (
              <button 
                key={index} 
                onClick={e => { e.stopPropagation(); setCurrentSlide(index); }} 
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-4 sm:w-6' : 'bg-white/50'
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // const [isAdmin, setIsAdmin] = useState(false); // Admin check is not critical for item display
  const [priceRange, setPriceRange] = useState<string>('all');
  
  const isVerified = profile?.is_verified && profile?.verification_status === 'approved';

  // --- DATA FETCHING FUNCTIONS ---
  
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (!error) setProfile(data);
    else console.error('Error fetching profile:', error);
  };
  
  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error) setCategories(data || []);
    else console.error('Error fetching categories:', error);
  };
  
  const fetchItems = async () => {
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
        description: "Failed to load items",
        variant: "destructive"
      });
    } else {
      setItems(data as Item[] || []);
    }
    setLoading(false);
  };

  // --- EFFECTS ---
  
  // CRITICAL FIX: Initial fetch for profile and categories (Runs once on mount)
  useEffect(() => {
    if (!user) return; 
    
    fetchProfile(user.id);
    fetchCategories();
    // Admin check is now removed or would be moved to a separate custom hook for cleaner separation
  }, [user]); 

  // FIX: Debounced fetch for items on filter/search change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, priceRange]);
  
  // --- HANDLERS ---
  
  const handleStartConversation = async (item: Item) => {
    if (!user || item.seller_id === user.id) return;
    
    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification to start chatting",
        variant: "destructive"
      });
      navigate('/kyc');
      return;
    }

    // Check/Create conversation
    let { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('item_id', item.id)
      .eq('buyer_id', user.id)
      .eq('seller_id', item.seller_id)
      .maybeSingle(); // Use maybeSingle for better error handling

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
      
      if (error) {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive"
        });
        return;
      }
      existingConversation = newConversation;
    }
    
    navigate(`/chat/${existingConversation.id}`);
  };

  const handleFavoriteToggle = async (e: React.MouseEvent, item: Item) => {
    e.stopPropagation(); // Prevent card navigation

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to manage favorites",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification to use this feature",
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
        // Remove favorite
        await supabase.from('favorites').delete().eq('id', existing.id);
        toast({
          title: "Removed from Favorites",
        });
      } else {
        // Add favorite
        await supabase.from('favorites').insert({ user_id: user.id, item_id: item.id });
        toast({
          title: "Added to Favorites",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex-1 bg-gray-50/50"> 
      
      {/* Verification Alert */}
      {!isVerified && (
        <div className="bg-warning/10 border-warning/20 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-warning" />
                <span className="text-sm">
                  Please verify your student identity to start buying and selling items.
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/kyc')}>
                Verify Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Slider Section */}
      <ImageSliderSection />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4 p-4 rounded-xl shadow-lg bg-white/90 backdrop-blur-sm border">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" />
            Find Your Next Deal
          </h2>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search for items, categories, descriptions..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 border-gray-300" 
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full lg:w-48 border-gray-300">
                <Clock className="h-4 w-4 mr-2" /> {/* Changed icon for variety */}
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
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden rounded-xl">
                <div className="aspect-square w-full bg-gray-200"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2 w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-xl shadow-inner border border-dashed">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-700">No items found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' ? "Try adjusting your search or filters" : "Be the first to list an item on your campus!"}
            </p>
            <Button className="mt-4" onClick={() => navigate('/list-item')}>
              <Plus className="h-4 w-4 mr-2" />
              List an Item
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(item => {
                const adBenefits = getAdTypeBenefits(item.ad_type);
                return (
                  <Card 
                    key={item.id} 
                    className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 cursor-pointer border border-border hover:border-primary/50 overflow-hidden bg-white/95 rounded-xl" 
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    <div className="relative">
                      <div className="aspect-square w-full rounded-t-xl overflow-hidden">
                        {/* ImageCarousel is assumed to be a separate component */}
                        <ImageCarousel images={item.images} alt={item.title} className="h-full w-full" />
                      </div>
                      
                      {/* Ad Type Badge with Tooltip */}
                      {adBenefits && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={`absolute top-3 left-3 text-xs flex items-center gap-1 shadow-md ${adBenefits.color} cursor-help`}>
                              {adBenefits.icon}
                              {adBenefits.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{adBenefits.benefits}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Badge variant={item.condition === 'new' ? 'default' : 'secondary'} className="absolute top-3 right-3 text-xs shadow-md">
                        {item.condition}
                      </Badge>
                      
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white rounded-full px-2 py-1 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs">{item.views}</span>
                      </div>
                    </div>
                    
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-base leading-snug line-clamp-2 text-gray-900">
                        {item.title}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-primary">₹{item.price.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      
                      {/* Seller/Meta Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/70">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-gray-600 truncate max-w-[100px]">
                            {item.profiles?.full_name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-gray-600 truncate">
                            {item.location || 'Campus'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-3">
                        <Button 
                          size="sm" 
                          className="flex-1 h-9 text-sm font-semibold" 
                          onClick={e => handleStartConversation(item)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 px-3 border-primary text-primary hover:bg-primary/10"
                          onClick={(e) => handleFavoriteToggle(e, item)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
