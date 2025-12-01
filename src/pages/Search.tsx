import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, Loader2, Zap, Crown, Star, MapPin, User, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ImageCarousel from '@/components/ImageCarousel';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  ad_type: string;
  condition: string;
  location: string;
  views: number;
  is_negotiable: boolean;
  profiles: {
    full_name: string;
    trust_seller_badge: boolean;
  };
  categories: {
    name: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const getAdTypeBadge = (adType: string) => {
  switch (adType) {
    case 'urgent':
      return { icon: <Zap className="h-3 w-3" />, label: 'Urgent', color: 'bg-red-600' };
    case 'featured':
      return { icon: <Star className="h-3 w-3" />, label: 'Featured', color: 'bg-yellow-500' };
    case 'premium':
      return { icon: <Crown className="h-3 w-3" />, label: 'Premium', color: 'bg-purple-600' };
    default:
      return null;
  }
};

const Search = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [priceFilter, setPriceFilter] = useState(searchParams.get('price') || 'all');
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, icon').order('name');
    if (data) setCategories(data);
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50'
      });

      const query = searchParams.get('q');
      const category = searchParams.get('category');
      const price = searchParams.get('price');

      if (query) params.append('query', query);
      if (category && category !== 'all') params.append('categoryId', category);
      if (price && price !== 'all') {
        const [min, max] = price.split('-');
        if (min) params.append('minPrice', min);
        if (max) params.append('maxPrice', max);
      }

      const searchUrl = `https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/search-listings?${params.toString()}`;
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10YWVxdG1jaXhscnVkanN4Y2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg1MDksImV4cCI6MjA3Mzg2NDUwOX0.7IjteljUrmEBwmhtAsThCuWEKEcGNFI1yeLL4TJokFg'
        }
      });

      const result = await response.json();
      if (result.success) {
        setResults(result.data || []);
        setTotalResults(result.total || 0);
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: "Error", description: "Failed to perform search", variant: "destructive" });
      setResults([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (priceFilter !== 'all') params.set('price', priceFilter);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6">Search Listings</h1>
          
          {/* Search Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-500">Under ₹500</SelectItem>
                    <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
                    <SelectItem value="1000-5000">₹1000 - ₹5000</SelectItem>
                    <SelectItem value="5000">Above ₹5000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} className="mt-4 w-full">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-muted-foreground">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''}
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No items found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map(item => {
              const adBadge = getAdTypeBadge(item.ad_type);
              
              return (
                <Card
                  key={item.id}
                  className="group hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  <div className="relative">
                    <div className="aspect-square w-full overflow-hidden">
                      <ImageCarousel
                        images={item.images}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    
                    {adBadge && (
                      <Badge className={`absolute top-3 left-3 text-xs flex items-center gap-1 shadow-lg ${adBadge.color} text-white`}>
                        {adBadge.icon}
                        {adBadge.label}
                      </Badge>
                    )}
                    
                    <Badge variant={item.condition === 'new' ? 'default' : 'secondary'} className="absolute top-3 right-3">
                      {item.condition}
                    </Badge>
                    
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white rounded-lg px-2 py-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span className="text-xs">{item.views}</span>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-lg line-clamp-2">{item.title}</h3>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-primary">₹{item.price.toLocaleString()}</span>
                      {item.is_negotiable && <Badge variant="outline" className="text-xs">Negotiable</Badge>}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="truncate">{item.profiles?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{item.location || 'Campus'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
