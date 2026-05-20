import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  X, 
  Star, 
  ChevronRight,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PWAPageWrapper from '@/components/PWAPageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionConfirmation } from "@/components/TransactionConfirmation";
import { RatingModal } from "@/components/RatingModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Interfaces ---
interface ItemData {
  title: string;
  price: number;
  images: string[];
}

interface UserProfileData {
  full_name: string;
  mck_id: string;
}

interface Order {
  id: string;
  item_id: string;
  seller_id: string;
  buyer_id: string;
  status: string;
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  seller_confirmed_at?: string;
  buyer_confirmed_at?: string;
  created_at: string;
  items: ItemData;
  buyer_profiles?: UserProfileData;
  seller_profiles?: UserProfileData;
  hasRated: boolean;
}

const PWAMyOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  
  // Rating Modal State
  const [ratingModal, setRatingModal] = useState<{ 
    open: boolean; 
    orderId: string; 
    toUserId: string; 
    toUserName: string 
  } | null>(null);

  // --- Fetch Logic ---
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: allOrders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          items (title, price, images)
        `)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      
      if (ordersError) throw ordersError;
      if (!allOrders) {
          setLoading(false);
          return;
      }

      // Profile Fetching
      const sellerOrderIds = allOrders.filter(o => o.seller_id === user.id).map(o => o.buyer_id);
      const buyerOrderIds = allOrders.filter(o => o.buyer_id === user.id).map(o => o.seller_id);
      const profileIdsToFetch = Array.from(new Set([...sellerOrderIds, ...buyerOrderIds]));

      let profilesMap = new Map<string, UserProfileData>();
      if (profileIdsToFetch.length > 0) {
        const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name, mck_id")
            .in("user_id", profileIdsToFetch);
        
        profilesData?.forEach(p => {
            profilesMap.set(p.user_id, { full_name: p.full_name, mck_id: p.mck_id });
        });
      }

      // Check Ratings
      const ratingChecks = allOrders.map(async (order) => {
        const { data } = await supabase
          .from("ratings")
          .select("id")
          .eq("order_id", order.id)
          .eq("from_user_id", user.id)
          .maybeSingle();
        return !!data;
      });
      const hasRatedStatuses = await Promise.all(ratingChecks);

      // Combine Data
      const ordersWithData = allOrders.map((order, index) => ({
        ...order,
        items: order.items as unknown as ItemData || { title: "Item Unavailable", price: 0, images: [] },
        hasRated: hasRatedStatuses[index],
        buyer_profiles: order.buyer_id !== user.id ? profilesMap.get(order.buyer_id) : undefined,
        seller_profiles: order.seller_id !== user.id ? profilesMap.get(order.seller_id) : undefined,
      })) as Order[];

      setSellerOrders(ordersWithData.filter(o => o.seller_id === user.id));
      setBuyerOrders(ordersWithData.filter(o => o.buyer_id === user.id));

    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Helpers ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-[10px] h-5">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 text-[10px] h-5">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-[10px] h-5">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] h-5">{status}</Badge>;
    }
  };

  const OrderCard = ({ order, isSeller }: { order: Order; isSeller: boolean }) => {
    const targetUser = isSeller ? order.buyer_profiles : order.seller_profiles;
    
    return (
      <div className="bg-card rounded-xl border border-border/50 p-3 shadow-sm active:scale-[0.99] transition-transform duration-200">
        <div className="flex gap-3">
          {/* Image */}
          <div 
            className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted cursor-pointer"
            onClick={() => navigate(`/item/${order.item_id}`)}
          >
            {order.items.images?.[0] ? (
              <img
                src={order.items.images[0]}
                alt={order.items.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-medium text-sm line-clamp-1">{order.items.title}</h3>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-base font-bold text-primary mt-0.5">₹{order.items.price.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {isSeller ? "Sold to:" : "Bought from:"} <span className="font-medium text-foreground">{targetUser?.full_name || "User"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-3 border-t border-dashed border-border/60 flex items-center justify-between gap-3">
          <div className="text-[10px] text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </div>

          <div className="flex-1 flex justify-end gap-2">
            {order.status === "pending" && (
              <div className="w-full">
                <TransactionConfirmation
                  order={order}
                  userType={isSeller ? "seller" : "buyer"}
                  onConfirm={fetchOrders}
                />
              </div>
            )}

            {order.status === "completed" && !order.hasRated && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs w-full"
                onClick={() => setRatingModal({
                    open: true,
                    orderId: order.id,
                    toUserId: isSeller ? order.buyer_id : order.seller_id,
                    toUserName: targetUser?.full_name || "User"
                })}
              >
                <Star className="h-3 w-3 mr-1.5" />
                Rate {isSeller ? "Buyer" : "Seller"}
              </Button>
            )}

            {order.status === "completed" && order.hasRated && (
               <div className="flex items-center text-xs text-green-600 font-medium px-2">
                  <Star className="h-3 w-3 mr-1 fill-current" /> Rated
               </div>
            )}
            
            {order.status === "cancelled" && (
               <div className="flex items-center text-xs text-muted-foreground px-2">
                  <X className="h-3 w-3 mr-1" /> Order Closed
               </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const OrderSkeleton = () => (
    <div className="bg-card rounded-xl border border-border/50 p-3 shadow-sm">
      <div className="flex gap-3">
        <Skeleton className="w-20 h-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border/50">
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  );

  const displayedOrders = activeTab === 'purchases' ? buyerOrders : sellerOrders;

  return (
    <PWAPageWrapper 
      title="My Orders" 
      showBack 
      onBack={() => navigate('/pwa-profile')}
    >
      <div className="px-4 pb-24 space-y-4 max-w-2xl mx-auto">
        
        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'purchases'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Purchases
            {buyerOrders.length > 0 && <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{buyerOrders.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'sales'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            Sales
            {sellerOrders.length > 0 && <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{sellerOrders.length}</span>}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {loading ? (
            <>
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </>
          ) : displayedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                {activeTab === 'purchases' ? (
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1">No {activeTab} yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                {activeTab === 'purchases' 
                  ? "Items you buy will appear here." 
                  : "Items you sell will appear here."}
              </p>
              <Button 
                onClick={() => navigate(activeTab === 'purchases' ? '/' : '/sell')} 
                size="sm" 
                className="rounded-full px-6"
              >
                {activeTab === 'purchases' ? "Start Shopping" : "List Item"}
              </Button>
            </div>
          ) : (
            displayedOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                isSeller={activeTab === 'sales'} 
              />
            ))
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <RatingModal
          open={ratingModal.open}
          onClose={() => setRatingModal(null)}
          orderId={ratingModal.orderId}
          toUserId={ratingModal.toUserId}
          toUserName={ratingModal.toUserName}
          onSuccess={() => {
            fetchOrders();
            setRatingModal(null);
          }}
        />
      )}
    </PWAPageWrapper>
  );
};

export default PWAMyOrders;
