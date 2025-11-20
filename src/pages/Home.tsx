import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Card components are now technically unused but left for safety
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Select components are now unused
import logo from '@/assets/mycampuskart-logo.png';
import {
  Search,
  User,
  LogIn,
  Filter, // Filter is now unused
  ShoppingBag, // ShoppingBag is now unused
  Eye, // Eye is now unused
  MapPin, // MapPin is now unused
  ChevronLeft,
  ChevronRight,
  Star,
  Crown,
  Zap,
  Clock, // Clock is now unused
  ArrowRight,
  ShieldCheck, // New icon for the CTA section
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Tooltip is now unused
import { Footer } from '@/components/Footer';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

// Item interface is now technically unused but left for safety
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

// getAdTypeBenefits is now technically unused but left for safety
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
  // const [items, setItems] = useState<Item[]>([]); // Removed: Not needed without listings
  // const [loading, setLoading] = useState(true); // Removed: Not needed without listings
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Removed: Not needed without filter

  // 🔥 FIX 1: Initial fetch for Categories (runs once) - Keep if we want categories for other uses
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

  // fetchItems and the related useEffect are REMOVED as they are not needed for this simplified view.

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  // getAdTypeBadge is now technically unused but left for safety
  // const getAdTypeBadge = (adType: string) => {
  //   return getAdTypeBenefits(adType);
  // };


  // --- NEW: Hero Section with prominent Login CTA ---
  const HeroSectionWithCTA = () => {
    return (
      <section className="py-20 md:py-32 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6 animate-bounce-slow" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            The Campus Marketplace for Students
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Find the best deals on books, gadgets, and furniture. **Login now** to see listings from your peers!
          </p>

          <div className="flex justify-center flex-col sm:flex-row gap-4 mb-10">
            <Button size="lg" className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300" onClick={() => navigate('/auth')}>
              <LogIn className="h-5 w-5 mr-2" />
              Login with your University Email to Explore Deals
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/auth')}>
              <User className="h-5 w-5 mr-2" />
              Sign Up in Seconds
            </Button>
          </div>

          {/* Simplified Search Input - Remains for a user-friendly look */}
          <div className="mt-8 max-w-xl mx-auto w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for an item (login required)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-primary/20 bg-white/90 shadow-md h-12 text-base"
                disabled // Disabled since listing fetch is removed
              />
            </div>
          </div>
        </div>
      </section>
    );
  };
  // --- END NEW: Hero Section with prominent Login CTA ---

  // Image slidebar component (UPDATED: Search/Filter is removed from here)
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
          
          {/* REMOVED: Search Bar / Filter that was here */}
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

      {/* New: Hero Section with prominent Login CTA */}
      <HeroSectionWithCTA />

      {/* Image Slidebar Section (Kept, but is now below the CTA) */}
      <ImageSlidebarSection />

      {/* REMOVED: Featured Listings Section */}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
