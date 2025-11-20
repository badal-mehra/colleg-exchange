import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logo from '@/assets/mycampuskart-logo.png';
import {
  Search,
  User,
  LogIn,
  Filter,
  ShoppingBag,
  Eye,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  Crown,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Footer } from '@/components/Footer';

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
  views: number;
  created_at: string;
  categories: Category;
  ad_type: string;
  is_negotiable: boolean;
  tags: string[];
  expires_at: string;
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

const Home = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 🔥 FIX 1: Initial fetch for Categories (runs once)
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error) {
      setCategories(data || []);
    }
  };

  const fetchItems = async () => {
    // setLoading(true); // setLoading is now in the useEffect hook
    let query = supabase
      .from('items')
      .select(`
        *,
        categories (*)
      `)
      .eq('is_sold', false)
      .gt('expires_at', new Date().toISOString())
      .order('ad_type', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12);

    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (!error) {
      setItems(data || []);
    }
    setLoading(false);
  };

  // 🔥 FIX 2: Consolidate fetchItems logic into a single debounced effect 
  // This runs on mount and whenever search/filter state changes.
  useEffect(() => {
    setLoading(true); // Set loading state immediately upon change
    const debounceTimer = setTimeout(() => {
      fetchItems();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory]);

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const getAdTypeBadge = (adType: string) => {
    return getAdTypeBenefits(adType);
  };

  // Image slidebar component (UPDATED FOR CONSISTENCY)
  const ImageSlidebarSection = () => {
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

      if (!error) {
        setSliderImages(data || []);
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
      <section className="py-12 bg-card/50">
        <div className="container mx-auto px-4">
          
          {/* 🔥 FIX 3: Added h-96 class for fixed height to prevent flicker on load/re-render */}
          <div className="relative carousel-container rounded-2xl overflow-hidden shadow-lg h-96">
            {sliderImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                } ${image.link_url ? 'cursor-pointer' : ''}`}
                onClick={() => handleSlideClick(image)}
              >
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-12">
                  <div className="text-center text-white space-y-3 max-w-2xl px-4">
                    {image.title && <h2 className="text-2xl lg:text-4xl font-bold drop-shadow-lg">{image.title}</h2>}
                    {image.description && (
                      <p className="text-base lg:text-xl opacity-95 drop-shadow-md">{image.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
              {sliderImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Search Bar (Moved out of the space-y-6 container for consistency) */}
          <div className="mt-8 max-w-2xl mx-auto w-full animate-scale-in"> {/* Added mt-8 for spacing */}
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-card/50 rounded-xl border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for books, electronics, furniture..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 bg-background/50"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48 border-0 bg-background/50">
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
              <Button className="md:px-8">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={logo} 
                alt="MyCampusKart" 
                className="h-12 cursor-pointer"
                onClick={() => navigate('/')}
              />
              <Badge variant="outline" className="hidden md:flex">
                Campus Marketplace
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/auth')}>
                <User className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Image Slidebar Section */}
      <ImageSlidebarSection />

      {/* Featured Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Listings</h2>
              <p className="text-muted-foreground">Discover great deals from verified students</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse overflow-hidden">
                  <div className="listing-image-container bg-muted"></div>
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
                Try adjusting your search or check back later for new listings
              </p>
            </div>
          ) : (
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item, index) => {
                  const adBenefits = getAdTypeBadge(item.ad_type);
                  return (
                    <Card 
                      key={item.id} 
                      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-border hover:border-primary/20 overflow-hidden bg-card animate-fade-in hover-scale"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => handleItemClick(item.id)}
                    >
                       <div className="relative">
                        <div className="listing-image-container bg-muted flex items-center justify-center overflow-hidden">
                          {item.images.length > 0 ? (
                            <img 
                              src={item.images[0]} 
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L2F2Zz4K';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <ShoppingBag className="h-12 w-12 mb-2" />
                              <span className="text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Ad Type Badge with Tooltip */}
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
                    
                    <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.views}</span>
                    </div>
                    
                    {/* Negotiable Badge */}
                    {item.is_negotiable && (
                      <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-xs text-muted-foreground">Negotiable</span>
                      </div>
                    )}
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
                      
                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{item.location || 'Campus'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {Math.max(0, Math.ceil((new Date(item.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}d left
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full h-8 text-xs mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/auth');
                        }}
                      >
                        Login to View Details
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
      </section>


      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
