import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Eye, 
  Trash2, 
  Edit, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Package,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '@/components/ImageCarousel';

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
}

const MyListings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error",
        description: "Failed to load your listings",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      fetchMyListings();
    }
  };

  const toggleSoldStatus = async (itemId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('items')
      .update({ is_sold: !currentStatus })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating item status:', error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Item marked as ${!currentStatus ? 'sold' : 'available'}`,
      });
      fetchMyListings();
    }
  };

  const stats = {
    total: items.length,
    available: items.filter(item => !item.is_sold).length,
    sold: items.filter(item => item.is_sold).length,
    totalViews: items.reduce((sum, item) => sum + item.views, 0),
    totalValue: items.reduce((sum, item) => sum + item.price, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover-scale">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              My Listings
            </h1>
            <p className="text-muted-foreground mt-2">Manage your items and track your sales</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="hover-scale">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Items</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.available}</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.sold}</div>
                    <div className="text-sm text-muted-foreground">Sold</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Eye className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.totalViews}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listings Grid */}
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">Start selling by creating your first listing</p>
              <Button onClick={() => navigate('/sell')} className="bg-gradient-to-r from-primary to-primary/80">
                Create Listing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <Card 
                  key={item.id} 
                  className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden bg-card hover-scale"
                >
                  <div className="relative">
                    <ImageCarousel 
                      images={item.images} 
                      alt={item.title}
                      className="h-48"
                    />
                    <Badge 
                      variant={item.is_sold ? 'destructive' : 'default'}
                      className="absolute top-2 left-2 text-xs"
                    >
                      {item.is_sold ? 'Sold' : 'Available'}
                    </Badge>
                    <Badge 
                      variant={item.condition === 'new' ? 'default' : 'secondary'}
                      className="absolute top-2 right-2 text-xs"
                    >
                      {item.condition}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-primary">₹{item.price.toLocaleString()}</span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{item.views} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {item.location}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={() => navigate(`/item/${item.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant={item.is_sold ? "secondary" : "default"}
                          className="flex-1 h-8 text-xs"
                          onClick={() => toggleSoldStatus(item.id, item.is_sold)}
                        >
                          {item.is_sold ? <Package className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                          {item.is_sold ? 'Relist' : 'Sold'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 px-3"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
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
    </div>
  );
};

export default MyListings;