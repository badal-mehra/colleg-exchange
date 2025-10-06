import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  User, 
  LogOut, 
  Filter,
  Heart,
  MessageCircle,
  Eye,
  ShoppingBag,
  Upload,
  Shield,
  Star,
  MapPin,
  Package,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Crown,
  Zap,
  Clock,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '@/components/ImageCarousel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [priceRange, setPriceRange] = useState<string>('all');

  useEffect(() => {
    fetchProfile();
    fetchCategories();
    fetchItems();
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user.id });
      
      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from('items')
      .select(`
        *,
        categories (*),
        profiles (*)
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Add price filtering
    if (priceRange && priceRange !== 'all') {
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
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, priceRange]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleStartConversation = async (item: Item) => {
    if (!user || item.seller_id === user.id) return;

    // Check if user is verified
    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification to start chatting",
        variant: "destructive",
      });
      navigate('/kyc');
      return;
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('item_id', item.id)
      .eq('buyer_id', user.id)
      .eq('seller_id', item.seller_id)
      .single();

    if (existingConversation) {
      navigate(`/chat/${existingConversation.id}`);
      return;
    }

    // Create new conversation
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
        variant: "destructive",
      });
    } else {
      navigate(`/chat/${newConversation.id}`);
    }
  };

  const isVerified = profile?.is_verified && profile?.verification_status === 'approved';

  // Image Slider Component
  const ImageSliderSection = () => {
    const [sliderImages, setSliderImages] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
      fetchSliderImages();
    }, []);

    const fetchSliderImages = async () => {
      const { data, error } = await supabase
        .from('image_slidebar')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setSliderImages(data);
      }
    };

    const nextSlide = () => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    };

    const prevSlide = () => {
      setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
    };

    useEffect(() => {
      if (sliderImages.length > 0) {
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
      }
    }, [sliderImages.length]);

    if (sliderImages.length === 0) return null;

    const handleSlideClick = (image: any) => {
      if (image.link_url) {
        window.open(image.link_url, '_blank');
      }
    };

    return (
      <section className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg">
          {sliderImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out will-change-opacity ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              } ${image.link_url ? 'cursor-pointer' : ''}`}
              onClick={() => handleSlideClick(image)}
            >
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center">
                <div className="text-center text-white space-y-2 sm:space-y-4 max-w-2xl px-4">
                  {image.title && <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold drop-shadow-lg">{image.title}</h2>}
                  {image.description && (
                    <p className="text-sm sm:text-base lg:text-xl opacity-90 drop-shadow-md">{image.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-all z-20 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(index);
                }}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-4 sm:w-6' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b glass-effect sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text">MyCampusKart</h1>
                {profile && (
                  <Badge variant={isVerified ? "default" : "secondary"} className="hidden sm:flex animate-pulse text-xs">
                    {isVerified ? "✓ Verified" : "Pending"}
                  </Badge>
                )}
              </div>
              <Button 
                size="sm"
                onClick={() => navigate('/sell')}
                className="lg:hidden bg-gradient-to-r from-primary to-primary/80 hover-scale"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              <Button variant="outline" size="sm" onClick={() => navigate('/my-chats')} className="hover-scale shrink-0">
                <MessageCircle className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">My Chats</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/my-orders')} className="hover-scale shrink-0">
                <ShoppingBag className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Orders</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/my-listings')} className="hover-scale shrink-0">
                <Package className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">My Items</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/leaderboard')} className="hover-scale shrink-0">
                <Trophy className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Leaderboard</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="hover-scale gap-2 shrink-0">
                {profile?.avatar_url ? (
                  <Avatar className="h-4 w-4 lg:h-5 lg:w-5">
                    <AvatarImage 
                      src={`${supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}`} 
                      alt={profile.full_name} 
                    />
                    <AvatarFallback className="text-xs">{profile.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="hidden lg:inline">Profile</span>
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="hover-scale border-primary/50 text-primary shrink-0"
                >
                  <Shield className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Admin</span>
                </Button>
              )}
              <Button 
                size="sm"
                onClick={() => navigate('/sell')}
                className="hidden lg:flex bg-gradient-to-r from-primary to-primary/80 hover-scale shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Sell Item
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0">
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

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

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for items, categories, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-effect"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 glass-effect">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full lg:w-48 glass-effect">
                <Star className="h-4 w-4 mr-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-3">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' 
                ? "Try adjusting your search or filters" 
                : "Be the first to list an item on your campus!"
              }
            </p>
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => {
                const adBenefits = getAdTypeBenefits(item.ad_type);
                return (
                  <Card 
                    key={item.id} 
                    className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer border border-border hover:border-primary/30 overflow-hidden bg-card animate-fade-in hover-scale"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    <div className="relative">
                      <ImageCarousel 
                        images={item.images} 
                        alt={item.title}
                        className="h-48"
                      />
                      {adBenefits && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              className={`absolute top-2 left-2 text-xs flex items-center gap-1 ${adBenefits.color} cursor-help`}
                            >
                              {adBenefits.icon}
                              {adBenefits.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{adBenefits.benefits}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Badge 
                        variant={item.condition === 'new' ? 'default' : 'secondary'}
                        className="absolute top-2 right-2 text-xs"
                      >
                        {item.condition}
                      </Badge>
                    </div>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-card-foreground">
                      {item.title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-primary">₹{item.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {item.profiles?.full_name || 'Anonymous'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{item.views}</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1 pt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {item.location}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartConversation(item);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-3">
                        <Heart className="h-3 w-3" />
                      </Button>
                    </div>
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