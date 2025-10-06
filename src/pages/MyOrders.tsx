import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionConfirmation } from "@/components/TransactionConfirmation";
import { RatingModal } from "@/components/RatingModal";
import { ArrowLeft, Package, ShoppingCart, CheckCircle, Clock, X, Star } from "lucide-react";
import { toast } from "sonner";

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
  items: {
    title: string;
    price: number;
    images: string[];
  };
  buyer_profiles?: {
    full_name: string;
    mck_id: string;
  };
  seller_profiles?: {
    full_name: string;
    mck_id: string;
  };
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<{ open: boolean; orderId: string; toUserId: string; toUserName: string } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view orders");
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      setUserProfile(profile);

      // Fetch seller orders
      const { data: sellerData, error: sellerError } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (sellerError) throw sellerError;

      // Fetch related data for seller orders
      const sellerOrdersWithData = await Promise.all(
        (sellerData || []).map(async (order) => {
          const [itemData, profileData] = await Promise.all([
            supabase.from("items").select("title, price, images").eq("id", order.item_id).single(),
            supabase.from("profiles").select("full_name, mck_id").eq("user_id", order.buyer_id).single()
          ]);
          
          return {
            ...order,
            items: itemData.data || { title: "", price: 0, images: [] },
            buyer_profiles: profileData.data
          };
        })
      );
      setSellerOrders(sellerOrdersWithData as any);

      // Fetch buyer orders
      const { data: buyerData, error: buyerError } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (buyerError) throw buyerError;

      // Fetch related data for buyer orders
      const buyerOrdersWithData = await Promise.all(
        (buyerData || []).map(async (order) => {
          const [itemData, profileData] = await Promise.all([
            supabase.from("items").select("title, price, images").eq("id", order.item_id).single(),
            supabase.from("profiles").select("full_name, mck_id").eq("user_id", order.seller_id).single()
          ]);
          
          return {
            ...order,
            items: itemData.data || { title: "", price: 0, images: [] },
            seller_profiles: profileData.data
          };
        })
      );
      setBuyerOrders(buyerOrdersWithData as any);

    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><X className="mr-1 h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const OrderCard = ({ order, isSeller }: { order: Order; isSeller: boolean }) => (
    <Card className="hover-scale">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Item Image */}
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
                <h3 className="font-semibold line-clamp-1">{order.items.title}</h3>
                <p className="text-lg font-bold text-primary">₹{order.items.price}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="text-sm text-muted-foreground">
              {isSeller ? "Buyer" : "Seller"}: {isSeller ? order.buyer_profiles?.full_name : order.seller_profiles?.full_name}
              {" "}({isSeller ? order.buyer_profiles?.mck_id : order.seller_profiles?.mck_id})
            </div>

            <div className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Transaction Confirmation */}
        <div className="mt-4">
          {order.status === "pending" && (
            <TransactionConfirmation
              order={order}
              userType={isSeller ? "seller" : "buyer"}
              onConfirm={fetchOrders}
            />
          )}

          {order.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRatingModal({
                open: true,
                orderId: order.id,
                toUserId: isSeller ? order.buyer_id : order.seller_id,
                toUserName: (isSeller ? order.buyer_profiles?.full_name : order.seller_profiles?.full_name) || "User"
              })}
              className="w-full"
            >
              <Star className="mr-2 h-4 w-4" />
              Rate {isSeller ? "Buyer" : "Seller"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">My Orders</h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">
              <Package className="mr-2 h-4 w-4" />
              Sales ({sellerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="purchases">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Purchases ({buyerOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4 mt-6">
            {sellerOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No sales yet</h3>
                  <p className="text-muted-foreground mb-4">
                    When someone buys your items, they'll appear here
                  </p>
                  <Button onClick={() => navigate("/sell-item")}>
                    List an Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sellerOrders.map((order) => (
                <OrderCard key={order.id} order={order} isSeller={true} />
              ))
            )}
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4 mt-6">
            {buyerOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                  <p className="text-muted-foreground mb-4">
                    When you buy items, they'll appear here
                  </p>
                  <Button onClick={() => navigate("/dashboard")}>
                    Browse Items
                  </Button>
                </CardContent>
              </Card>
            ) : (
              buyerOrders.map((order) => (
                <OrderCard key={order.id} order={order} isSeller={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {ratingModal && (
        <RatingModal
          open={ratingModal.open}
          onClose={() => setRatingModal(null)}
          orderId={ratingModal.orderId}
          toUserId={ratingModal.toUserId}
          toUserName={ratingModal.toUserName}
        />
      )}
    </div>
  );
}
