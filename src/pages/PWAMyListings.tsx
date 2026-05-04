import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Trash2, 
  Package,
  Plus,
  MoreVertical,
  CheckCircle,
  RefreshCw,
  ChevronRight,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import PWAPageWrapper from '@/components/PWAPageWrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';

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
}

const PWAMyListings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');

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
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Item removed successfully",
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
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Marked as ${!currentStatus ? 'sold' : 'available'}`,
      });
      fetchMyListings();
    }
  };

  const activeItems = items.filter(item => !item.is_sold);
  const soldItems = items.filter(item => item.is_sold);
  const displayedItems = activeTab === 'active' ? activeItems : soldItems;

  const stats = {
    active: activeItems.length,
    sold: soldItems.length,
    totalViews: items.reduce((sum, item) => sum + (item.views || 0), 0),
  };

  const ListingSkeleton = () => (
    <div className="flex gap-3 p-3 bg-card rounded-xl border border-border/50">
      <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );

  return (
    <PWAPageWrapper
      title="My Listings"
      showBack
      rightAction={
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-9 w-9"
          onClick={() => navigate('/sell')}
        >
          <Plus className="h-5 w-5" />
        </Button>
      }
    >
      <div className="px-4 pb-24 space-y-4 max-w-2xl mx-auto">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="text-center p-3 bg-card rounded-xl border border-border/50">
            <div className="text-xl font-bold text-primary">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-3 bg-card rounded-xl border border-border/50">
            <div className="text-xl font-bold text-green-500">{stats.sold}</div>
            <div className="text-xs text-muted-foreground">Sold</div>
          </div>
          <div className="text-center p-3 bg-card rounded-xl border border-border/50">
            <div className="text-xl font-bold">{stats.totalViews}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Active ({activeItems.length})
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sold'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Sold ({soldItems.length})
          </button>
        </div>

        {/* Listings */}
        <div className="space-y-3">
          {loading ? (
            <>
              <ListingSkeleton />
              <ListingSkeleton />
              <ListingSkeleton />
            </>
          ) : displayedItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">
                {activeTab === 'active' ? 'No active listings' : 'No sold items'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {activeTab === 'active' 
                  ? 'Start selling by creating your first listing' 
                  : 'Items you sell will appear here'}
              </p>
              {activeTab === 'active' && (
                <Button onClick={() => navigate('/sell')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              )}
            </div>
          ) : (
            displayedItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 bg-card rounded-xl border border-border/50 active:scale-[0.98] transition-transform"
              >
                {/* Image */}
                <div 
                  className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted cursor-pointer"
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {item.ad_type && item.ad_type !== 'basic' && (
                    <Badge 
                      className="absolute top-1 left-1 text-[10px] px-1.5 py-0"
                      variant={item.ad_type === 'premium' ? 'default' : 'secondary'}
                    >
                      {item.ad_type}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                  <div className="text-base font-bold text-primary mt-0.5">
                    ₹{item.price.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.views || 0}
                    </span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => navigate(`/item/${item.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleSoldStatus(item.id, item.is_sold)}>
                        {item.is_sold ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Relist
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Sold
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteItem(item.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PWAPageWrapper>
  );
};

export default PWAMyListings;
