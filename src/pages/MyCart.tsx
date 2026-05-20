import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Heart,
  Trash2,
  ShoppingCart,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    // Fetch favorites
    const { data: favoritesData, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch items for each favorite
    const favoritesWithItems = await Promise.all(
      (favoritesData || []).map(async (favorite) => {
        const { data: itemData } = await supabase
          .from('items')
          .select('id, title, price, images, condition, location, created_at')
          .eq('id', favorite.item_id)
          .single();

        return {
          ...favorite,
          items: itemData || { 
            id: '', 
            title: 'Unknown Item', 
            price: 0, 
            images: [], 
            condition: '', 
            location: '', 
            created_at: '' 
          }
        };
      })
    );

    setFavorites(favoritesWithItems);
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    } else {
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast({
        title: "Removed",
        description: "Item removed from favorites",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary fill-primary" />
                My Favorites
              </h1>
            </div>
            <Badge variant="secondary" className="text-sm">
              {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShoppingCart className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">No favorites yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start adding items to your favorites by clicking the heart icon on items you like.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              Browse Items
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((favorite) => (
              <Card 
                key={favorite.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/50"
              >
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Image */}
                    <div 
                      className="w-full h-48 bg-gradient-to-br from-muted/50 to-muted cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/item/${favorite.items.id}`)}
                    >
                      {favorite.items?.images?.length > 0 ? (
                        <img 
                          src={favorite.items.images[0]} 
                          alt={favorite.items.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFavorite(favorite.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    {/* Condition Badge */}
                    {favorite.items?.condition && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2 shadow-md"
                      >
                        {favorite.items.condition}
                      </Badge>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-4 space-y-3">
                    <div 
                      className="cursor-pointer"
                      onClick={() => navigate(`/item/${favorite.items.id}`)}
                    >
                      <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {favorite.items?.title}
                      </h3>
                      <p className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        ₹{favorite.items?.price?.toLocaleString()}
                      </p>
                    </div>

                    {favorite.items?.location && (
                      <p className="text-sm text-muted-foreground">
                        📍 {favorite.items.location}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => navigate(`/item/${favorite.items.id}`)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => removeFavorite(favorite.id)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCart;
