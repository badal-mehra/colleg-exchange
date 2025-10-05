import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SellerQRDisplay } from "@/components/SellerQRDisplay";
import { ArrowLeft, Package, QrCode, User, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  created_at: string;
  qr_expires_at: string | null;
  qr_used: boolean;
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

const MyOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch seller orders with buyer profiles
      const { data: sellerData, error: sellerError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });

      if (sellerError) throw sellerError;
      
      // Manually fetch related data
      const sellerOrdersWithData = await Promise.all(
        (sellerData || []).map(async (order) => {
          const [itemData, profileData] = await Promise.all([
            supabase.from('items').select('title, price, images').eq('id', order.item_id).single(),
            supabase.from('profiles').select('full_name, mck_id').eq('user_id', order.buyer_id).single()
          ]);
          
          return {
            ...order,
            items: itemData.data || { title: '', price: 0, images: [] },
            buyer_profiles: profileData.data
          };
        })
      );
      setSellerOrders(sellerOrdersWithData as any);

      // Fetch buyer orders with seller profiles
      const { data: buyerData, error: buyerError } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user!.id)
        .order('created_at', { ascending: false });

      if (buyerError) throw buyerError;
      
      const buyerOrdersWithData = await Promise.all(
        (buyerData || []).map(async (order) => {
          const [itemData, profileData] = await Promise.all([
            supabase.from('items').select('title, price, images').eq('id', order.item_id).single(),
            supabase.from('profiles').select('full_name, mck_id').eq('user_id', order.seller_id).single()
          ]);
          
          return {
            ...order,
            items: itemData.data || { title: '', price: 0, images: [] },
            seller_profiles: profileData.data
          };
        })
      );
      setBuyerOrders(buyerOrdersWithData as any);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowQR(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const OrderCard = ({ order, isSeller }: { order: Order; isSeller: boolean }) => (
    <Card key={order.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
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

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold line-clamp-1">{order.items.title}</h3>
                <p className="text-sm text-muted-foreground">₹{order.items.price}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {isSeller ? order.buyer_profiles?.full_name : order.seller_profiles?.full_name}
              </span>
              <span className="text-xs">
                ({isSeller ? order.buyer_profiles?.mck_id : order.seller_profiles?.mck_id})
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
            </div>

            {isSeller && order.status === 'pending' && (
              <Button
                onClick={() => handleGenerateQR(order.id)}
                size="sm"
                className="w-full mt-2"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">
              Sales ({sellerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="purchases">
              Purchases ({buyerOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4 mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
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
            ) : sellerOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No sales yet</h3>
                  <p className="text-sm text-muted-foreground">
                    When someone buys your items, they'll appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isSeller={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4 mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
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
            ) : buyerOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No purchases yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    When you buy items, they'll appear here
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Browse Items
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {buyerOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isSeller={false} />
                ))}
                
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <QrCode className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Ready to confirm purchase?</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Meet the seller and scan their QR code to complete the transaction
                        </p>
                        <Button 
                          onClick={() => navigate('/scan-qr')}
                          size="sm"
                          className="mt-3"
                        >
                          Open QR Scanner
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedOrderId && (
        <SellerQRDisplay
          orderId={selectedOrderId}
          open={showQR}
          onClose={() => {
            setShowQR(false);
            setSelectedOrderId("");
            fetchOrders(); // Refresh orders after QR generation
          }}
        />
      )}
    </div>
  );
};

export default MyOrders;