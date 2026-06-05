import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Heart,
  Trash2,
  ShoppingCart,
  MapPin,
  BellRing
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPush } from "@/hooks/usePushNotifications";

interface Item {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  location: string;
  created_at: string;
}

interface Favorite {
  id: string;
  item_id: string;
  created_at: string;
  items: Item; 
}

const MyCart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);

    // 1. Fetch just the favorites first
    const { data: favoritesData, error: favError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favError) {
      console.error('Error fetching favorites:', favError);
      toast({
        title: "Whoops!",
        description: "Failed to load your favorites. Try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // If no favorites, stop here and clear loading
    if (!favoritesData || favoritesData.length === 0) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    // 2. Extract all item_ids and fetch the items in ONE single query
    const itemIds = favoritesData.map(fav => fav.item_id);
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('id, title, price, images, condition, location, created_at')
      .in('id', itemIds); 

    if (itemsError) {
      console.error('Error fetching item details:', itemsError);
      toast({
        title: "Whoops!",
        description: "Failed to load item details.",
        variant: "destructive",
      });
    } else {
      // 3. Stitch them together using a Map for instant lookups
      const itemsMap = new Map(itemsData.map(item => [item.id, item]));
      
      const favoritesWithItems = favoritesData.map(fav => ({
        ...fav,
        // Fallback to empty item if the original item was deleted from the DB
        items: itemsMap.get(fav.item_id) || {
          id: fav.item_id,
          title: 'Item no longer available',
          price: 0,
          images: [],
          condition: 'N/A',
          location: 'N/A',
          created_at: ''
        }
      }));

      setFavorites(favoritesWithItems as Favorite[]);
    }
    
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent navigating to the item when clicking delete
    
    // Optimistic UI update: Remove it from screen instantly, then delete from DB
    const previousFavorites = [...favorites];
    setFavorites(favorites.filter(f => f.id !== favoriteId));

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) {
      // Revert if it fails
      setFavorites(previousFavorites);
      toast({
        title: "Error",
        description: "Couldn't remove the item. Check your connection.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removed",
        description: "Item dropped from favorites.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="container mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded-xl w-48 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sleek Mobile-Friendly Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              Wishlist
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium rounded-full">
              {favorites.length}
            </Badge>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => subscribeToPush(user?.id)}
              title="Enable Notifications"
              className="rounded-full active:scale-95"
            >
              <BellRing className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
              <Heart className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Keep track of items you love by tapping the heart icon on any listing.
              </p>
            </div>
            <Button 
              size="lg"
              onClick={() => navigate('/')}
              className="rounded-full px-8 active:scale-95 transition-transform"
            >
              Explore Items
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((favorite) => (
              <Card 
                key={favorite.id}
                onClick={() => {
                  // Only navigate if the item wasn't deleted
                  if(favorite.items.title !== 'Item no longer available') {
                    navigate(`/item/${favorite.items.id}`);
                  }
                }}
                className="overflow-hidden cursor-pointer group active:scale-[0.98] transition-all duration-200 border-border/40 hover:border-primary/30"
              >
                <div className="flex flex-row sm:flex-col h-full">
                  {/* Image Section - Adjusts for mobile (left side) vs PC (top) */}
                  <div className="relative w-32 sm:w-full sm:h-48 shrink-0 bg-muted">
                    {favorite.items?.images?.length > 0 ? (
                      <img 
                        src={favorite.items.images[0]} 
                        alt={favorite.items.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {favorite.items?.condition && favorite.items.condition !== 'N/A' && (
                      <Badge 
                        className="absolute top-2 left-2 bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm"
                      >
                        {favorite.items.condition}
                      </Badge>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-col justify-between flex-1 p-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-base line-clamp-2 leading-tight">
                          {favorite.items?.title || "Untitled Item"}
                        </h3>
                      </div>
                      <p className="text-lg font-bold text-primary mt-1">
                        ₹{favorite.items?.price?.toLocaleString() || '0'}
                      </p>
                      
                      {favorite.items?.location && favorite.items.location !== 'N/A' && (
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{favorite.items.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Touch-friendly Action Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                      <Button 
                        variant="secondary"
                        className="w-full rounded-xl active:scale-95"
                        disabled={favorite.items.title === 'Item no longer available'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if(favorite.items.title !== 'Item no longer available') {
                            navigate(`/item/${favorite.items.id}`);
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 shrink-0"
                        onClick={(e) => removeFavorite(favorite.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCart;
