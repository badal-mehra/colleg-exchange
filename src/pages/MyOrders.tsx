import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionConfirmation } from "@/components/TransactionConfirmation";
import { RatingModal } from "@/components/RatingModal";
import { ArrowLeft, Package, ShoppingCart, CheckCircle, Clock, X, Star, Loader2 } from "lucide-react"; // Added Loader2 for a better spinner
import { toast } from "sonner";

// --- INTERFACES ---
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
  hasRated: boolean; // Must be defined
}

// --- UTILITY FUNCTIONS ---

// Function to check if a user has already rated an order
const hasUserRated = async (orderId: string, userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("ratings")
      .select("id")
      .eq("order_id", orderId)
      .eq("from_user_id", userId)
      .maybeSingle();

    return !!data;
};

const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center";
    switch (status) {
      case "completed":
        return <Badge className={`${baseClasses} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`}><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case "pending":
        // Use a less aggressive yellow for better contrast
        return <Badge className={`${baseClasses} bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300`}><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case "cancelled":
        // Use a lighter variant for destructive actions in a badge
        return <Badge className={`${baseClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`}><X className="mr-1 h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
};

// --- COMPONENTS ---

const OrderCard = ({ order, isSeller, onActionSuccess }: { order: Order; isSeller: boolean; onActionSuccess: () => void }) => {
    const [ratingModal, setRatingModal] = useState<{ open: boolean; orderId: string; toUserId: string; toUserName: string } | null>(null);

    const targetUser = isSeller ? order.buyer_profiles : order.seller_profiles;

    return (
        <>
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Item Image */}
                        <div className="w-full h-40 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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

                        {/* Order Info */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-bold line-clamp-1 text-base">{order.items.title}</h3>
                                    <p className="text-xl font-extrabold text-primary mt-1">₹{order.items.price.toLocaleString('en-IN')}</p>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>

                            <div className="text-sm text-muted-foreground">
                                **{isSeller ? "Buyer" : "Seller"}**: {targetUser?.full_name} ({targetUser?.mck_id})
                            </div>

                            <div className="text-xs text-muted-foreground">
                                **Order Date**: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="mt-4 pt-4 border-t border-dashed border-muted">
                        {order.status === "pending" && (
                            <TransactionConfirmation
                                order={order}
                                userType={isSeller ? "seller" : "buyer"}
                                onConfirm={onActionSuccess}
                            />
                        )}

                        {order.status === "completed" && !order.hasRated && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRatingModal({
                                    open: true,
                                    orderId: order.id,
                                    toUserId: isSeller ? order.buyer_id : order.seller_id,
                                    toUserName: targetUser?.full_name || "User"
                                })}
                                className="w-full text-indigo-600 border-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-indigo-950"
                            >
                                <Star className="mr-2 h-4 w-4" />
                                Rate {isSeller ? "Buyer" : "Seller"}
                            </Button>
                        )}

                        {order.status === "completed" && order.hasRated && (
                            <div className="flex items-center justify-center py-2 text-sm font-medium text-success dark:text-green-400">
                                <Star className="mr-2 h-4 w-4 fill-success text-success dark:fill-green-400 dark:text-green-400" />
                                Rating Submitted
                            </div>
                        )}
                        
                         {order.status === "cancelled" && (
                            <div className="flex items-center justify-center py-2 text-sm font-medium text-red-500">
                                <X className="mr-2 h-4 w-4" />
                                This order was cancelled.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            {ratingModal && (
                <RatingModal
                    open={ratingModal.open}
                    onClose={() => setRatingModal(null)}
                    orderId={ratingModal.orderId}
                    toUserId={ratingModal.toUserId}
                    toUserName={ratingModal.toUserName}
                    onSuccess={() => {
                        // Optimistically update the rating status locally before refetching
                        onActionSuccess();
                        setRatingModal(null);
                    }}
                />
            )}
        </>
    );
};


// --- MAIN COMPONENT ---

export default function MyOrders() {
  const navigate = useNavigate();
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view orders");
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);

      // 1. Fetch ALL orders for the user (both buyer and seller) in parallel
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

      // 2. Separate orders and collect profile IDs
      const sellerOrderIds = allOrders.filter(o => o.seller_id === user.id).map(o => o.buyer_id);
      const buyerOrderIds = allOrders.filter(o => o.buyer_id === user.id).map(o => o.seller_id);
      const profileIdsToFetch = Array.from(new Set([...sellerOrderIds, ...buyerOrderIds]));

      // 3. Fetch all necessary profiles in one go
      let profilesMap = new Map<string, UserProfileData>();
      if (profileIdsToFetch.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("user_id, full_name, mck_id")
            .in("user_id", profileIdsToFetch);
        
        if (profilesError) throw profilesError;
        profilesData?.forEach(p => {
            profilesMap.set(p.user_id, { full_name: p.full_name, mck_id: p.mck_id });
        });
      }

      // 4. Check rating status for ALL orders
      const ratingChecks = allOrders.map(order => hasUserRated(order.id, user.id));
      const hasRatedStatuses = await Promise.all(ratingChecks);

      // 5. Combine data and set state
      const ordersWithData = allOrders.map((order, index) => ({
        ...order,
        items: order.items as ItemData || { title: "", price: 0, images: [] },
        hasRated: hasRatedStatuses[index],
        // Attach profiles
        buyer_profiles: order.buyer_id !== user.id ? profilesMap.get(order.buyer_id) : undefined,
        seller_profiles: order.seller_id !== user.id ? profilesMap.get(order.seller_id) : undefined,
      })) as Order[];

      setSellerOrders(ordersWithData.filter(o => o.seller_id === user.id));
      setBuyerOrders(ordersWithData.filter(o => o.buyer_id === user.id));

    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      setCurrentUserId(null);
      setSellerOrders([]);
      setBuyerOrders([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Dependency on fetchOrders

  const handleOrderActionSuccess = () => {
      // Fast solution: Re-fetch all orders to update the status/rating
      fetchOrders();
      // A more 'smoother' approach would be to update the specific order state
      // (buyerOrders/sellerOrders) locally, but a full refetch is safer for now.
  }

  // Memoized lists for faster tab switching
  const salesContent = useMemo(() => {
    if (sellerOrders.length === 0) {
        return (
            <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No sales yet</h3>
                    <p className="text-muted-foreground mb-4">
                        When someone buys your items, they'll appear here. Start listing your items!
                    </p>
                    <Button onClick={() => navigate("/sell-item")}>
                        List an Item
                    </Button>
                </CardContent>
            </Card>
        );
    }
    return sellerOrders.map((order) => (
        <OrderCard key={order.id} order={order} isSeller={true} onActionSuccess={handleOrderActionSuccess} />
    ));
  }, [sellerOrders, navigate]);

  const purchasesContent = useMemo(() => {
    if (buyerOrders.length === 0) {
        return (
            <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground mb-4">
                        When you buy items, they'll appear here. Find something great!
                    </p>
                    <Button onClick={() => navigate("/dashboard")}>
                        Browse Items
                    </Button>
                </CardContent>
            </Card>
        );
    }
    return buyerOrders.map((order) => (
        <OrderCard key={order.id} order={order} isSeller={false} onActionSuccess={handleOrderActionSuccess} />
    ));
  }, [buyerOrders, navigate]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <Loader2 className="h-5 w-5 animate-spin ml-auto text-primary" />
          </div>
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales" disabled>Sales</TabsTrigger>
              <TabsTrigger value="purchases" disabled>Purchases</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-4">
            {/* Improved Skeleton Loader */}
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse shadow-lg">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Your Transactions</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-lg bg-muted p-1">
            <TabsTrigger 
                value="sales" 
                className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            >
              <Package className="mr-2 h-4 w-4" />
              Sales <span className="ml-2 font-mono text-sm">({sellerOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger 
                value="purchases" 
                className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Purchases <span className="ml-2 font-mono text-sm">({buyerOrders.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Sales Tab Content */}
          <TabsContent value="sales" className="space-y-4 mt-6">
            {salesContent}
          </TabsContent>

          {/* Purchases Tab Content */}
          <TabsContent value="purchases" className="space-y-4 mt-6">
            {purchasesContent}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
