// ItemDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/mycampuskart-logo.png';
import {
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  Share2, 
  MapPin, 
  Calendar, 
  Eye,
  User,
  AlertCircle,
  Shield,
  Star,
  AlertTriangle,
  DollarSign,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';
import { BargainingDialog } from '@/components/BargainingDialog';

// --- Cloudinary Optimization Helpers ---

// For the main detail image view (w_1200 for good quality, still optimized)
const getDetailImage = (url: string) => {
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200/');
  }
  return url;
};

// For the small gallery strip thumbnails (w_100 for maximum speed)
const getThumbImage = (url: string) => {
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto:low,w_100,h_100,c_fill/');
  }
  return url;
};

// --- Define the shape of your data interfaces (Unchanged) ---
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verification_status: string;
  avatar_url: string | null;
  mck_id: string;
  trust_seller_badge: boolean;
  campus_points: number;
  deals_completed: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

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
  categories: Category;
  profiles: Profile;
}

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const { toast } = useToast();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [bargainingDialogOpen, setBargainingDialogOpen] = useState(false);

  // Existing state for current user's pending order
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  // State to check if item is reserved by *someone else*
  const [isPendingBySomeoneElse, setIsPendingBySomeoneElse] = useState(false);

  // --- Data Fetching Hooks ---

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      fetchUserProfile();
      checkIfFavorited();
    } else {
      setUserProfile(null);
      setIsFavorited(false);
    }
  }, [user, id]);

  // Combined checkPendingOrder function (for both self and external reservations)
  const checkPendingOrder = useCallback(async (itemId: string, currentUserId: string) => {
    // Query for any pending order on this item
    const { data: pendingOrder, error } = await supabase
      .from("orders")
      .select("buyer_id")
      .eq("item_id", itemId)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
        console.error("Error checking pending orders:", error);
        setHasPendingOrder(false);
        setIsPendingBySomeoneElse(false);
        return;
    }
    
    if (pendingOrder) {
        const buyerId = pendingOrder.buyer_id;
        // Check if the pending order belongs to the current user
        const isCurrentUser = buyerId === currentUserId;
        
        setHasPendingOrder(isCurrentUser);
        setIsPendingBySomeoneElse(!isCurrentUser);
    } else {
        // No pending order found at all
        setHasPendingOrder(false);
        setIsPendingBySomeoneElse(false);
    }
  }, []);

  // Use onSnapshot for real-time updates (reacts to status changes like cancellation)
  useEffect(() => {
      if (user?.id && item?.id) {
          // Initial check
          checkPendingOrder(item.id, user.id); 

          // Set up real-time listener for any order related to this item
          const ordersChannel = supabase
            .channel(`item_${item.id}_orders`)
            .on(
              'postgres_changes',
              { 
                event: '*', 
                schema: 'public', 
                table: 'orders',
                filter: `item_id=eq.${item.id}`
              },
              (payload) => {
                // Re-run the check whenever an order for this item changes (created, updated/cancelled)
                console.log('Realtime order update received:', payload.eventType);
                checkPendingOrder(item.id, user.id);
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(ordersChannel);
          };
      } else {
          setHasPendingOrder(false);
          setIsPendingBySomeoneElse(false);
      }
  }, [user?.id, item?.id, checkPendingOrder]);


  // --- Helper Functions ---
  
  const fetchItem = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        categories (*),
        profiles (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Item fetch failed:", error); 
      setItem(null); 
    } else {
      setItem(data as Item);
      // Increment view count (fire and forget)
      if (data) {
        await supabase
          .from('items')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id);
      }
    }
    setLoading(false);
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error) {
      setUserProfile(data as Profile);
    } else {
      setUserProfile(null);
    }
  };

  const checkIfFavorited = async () => {
    if (!user || !id) return;
    
    setCheckingFavorite(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', id)
      .maybeSingle();

    if (!error && data) {
      setIsFavorited(true);
    } else {
      setIsFavorited(false);
    }
    setCheckingFavorite(false);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your cart",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!userProfile?.is_verified || userProfile?.verification_status !== 'approved') {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification",
        variant: "destructive",
      });
      navigate('/kyc');
      return;
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', id);

        if (error) throw error;

        setIsFavorited(false);
        sonnerToast.success('Removed from cart');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_id: id,
          });

        if (error) throw error;

        setIsFavorited(true);
        sonnerToast.success('Added to cart');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
    }
  };
  
  // -------------------------------------------------------------------
  // FINAL: HANDLE BUY NOW FUNCTION - Race condition error fixed
  // -------------------------------------------------------------------
  const handleBuyNow = async () => {
    if (!user) return navigate("/auth");
    
    // Critical check added
    if (!item) {
        sonnerToast.error("Item data not loaded properly. Please refresh.");
        return;
    }

    const isVerified = userProfile?.is_verified && userProfile?.verification_status === 'approved';
    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Complete your KYC to buy this item",
        variant: "destructive",
      });
      return navigate("/kyc");
    }

    if (user.id === item.seller_id) {
      toast({
        title: "Error",
        description: "You cannot buy your own item",
        variant: "destructive",
      });
      return;
    }
    
    if (item.is_sold) {
      toast({
        title: "Error",
        description: "This item has already been sold.",
        variant: "destructive",
      });
      return;
    }

    // CREATE ORDER using a hypothetical RPC for robust server-side validation
    const { data: rpcResponse, error: rpcError } = await supabase.rpc("create_new_order", {
      item_id_input: item.id,
      buyer_id_input: user.id,
      seller_id_input: item.seller_id,
      agreed_price_input: item.price // Pass the necessary inputs
    });

    if (rpcError) {
      console.error("Order Failed (RPC Error):", rpcError);
      
      // ✅ FIX 1: Check for a database conflict/race condition error string
      const errorText = JSON.stringify(rpcError).toLowerCase();

      if (errorText.includes("duplicate pending order") || errorText.includes("already reserved")) {
        // This handles the race condition where another buyer just reserved it
        sonnerToast.error("This item has just been reserved by another buyer.");
      } else {
        // Generic network or unexpected DB error
        sonnerToast.error("Could not process order due to a system error. Please try again.");
      }
      return;
    }
    
    // Handle business logic failure (e.g., duplicate order check from RPC, for current user)
    if (!rpcResponse?.success) {
        sonnerToast.error(
            rpcResponse?.error ||
            "You already reserved this item. Go to My Orders to complete it."
        );
        // Redirect buyer to My Orders for smoother UX
        navigate("/my-orders"); 
        return;
    }

    // Success case
    sonnerToast.success(rpcResponse.message || "Item reserved successfully! Complete the transaction in My Orders.");
    navigate("/my-orders");
    
    // Optimistic update: set state immediately, though the real-time listener will confirm it.
    setHasPendingOrder(true);
    setIsPendingBySomeoneElse(false);
  };
  // -------------------------------------------------------------------
  
  const handleChatClick = async (offerPrice?: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to chat with seller",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!userProfile?.is_verified || userProfile?.verification_status !== 'approved') {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification to start chatting",
        variant: "destructive",
      });
      navigate('/kyc');
      return;
    }

    // Existing chat and new conversation logic (kept intact)
    try {
      if (!item) return; 

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', item.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', item.seller_id)
        .maybeSingle();

      if (existingConversation) {
        if (offerPrice) {
          await supabase
            .from('messages')
            .insert({
              conversation_id: existingConversation.id,
              sender_id: user.id,
              content: `Hi! I'm interested in "${item.title}". I'd like to offer ₹${offerPrice.toLocaleString()} for this item. Can we negotiate?`
            });
        }
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          item_id: item.id,
          buyer_id: user.id,
          seller_id: item.seller_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send first message if offer price provided
      if (offerPrice) {
        await supabase
          .from('messages')
          .insert({
            conversation_id: newConversation.id,
            sender_id: user.id,
            content: `Hi! I'm interested in "${item.title}". I'd like to offer ₹${offerPrice.toLocaleString()} for this item. Can we negotiate?`
          });
      }

      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title,
          text: item?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Item link copied to clipboard",
      });
    }
  };

  // --- Conditional Rendering ---
  
  if (loading) {
    // Loading skeleton (kept intact)
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-6 bg-muted rounded w-24"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Item Not Found (kept intact)
  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Item Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.seller_id;
  const isVerified = user && userProfile?.is_verified && userProfile?.verification_status === 'approved'; 

  // Determine the disabled status and button text
  const isDisabled = 
    !user || 
    (!isVerified && !isOwner) || 
    item.is_sold || 
    hasPendingOrder || 
    isPendingBySomeoneElse;

  const buttonText = item.is_sold
    ? 'Sold Out'
    : isPendingBySomeoneElse
    ? 'Reserved by Another Buyer'
    : hasPendingOrder
    ? 'Already Reserved'
    : 'Buy Now';
    
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <img 
              src={logo} 
              alt="MyCampusKart" 
              className="h-10"
            />
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setReportModalOpen(true)}>
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {item.images.length > 0 ? (
                // ✅ Egress Fix 1: Use getDetailImage for the main, large view.
                <img
                  src={getDetailImage(item.images[currentImageIndex])}
                  alt={item.title}
                  className="w-full h-full object-contain"
                  // ✅ Egress Fix 2: Lazy load for the main image (first image is usually already visible/preloaded)
                  loading={currentImageIndex === 0 ? 'eager' : 'lazy'} 
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy9wYXR0ZXJuLXF1YWRyYW50L3R5cG9ncmFwaGljLWdlb21ldHJ5LXR5cGUtaWQiIHN0eWxlPSJmbGlwLXk6c2NhbGUoLTEpOyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTUwSDI1MFYyNTBIMTUwVjE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-16 w-16 mx-auto mb-4" />
                    <p>No images available</p>
                  </div>
                </div>
              )}
              {/* ✅ FIX FOR DETAIL PAGE: CONDITION BADGE PLACEMENT */}
              <Badge className="absolute bottom-4 right-4 bg-primary text-white">
                {item.condition}
              </Badge>
            </div>
            
            {item.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    {/* ✅ Egress Fix 3: Use getThumbImage for gallery strip */}
                    <img
                      src={getThumbImage(image)} 
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy" // ✅ Egress Fix 4: Lazy load thumbnails
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details (kept intact) */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {item.views} views
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
                {item.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-primary mb-4">
                ₹{item.price.toLocaleString()}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {item.description}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale cursor-pointer" onClick={() => item.profiles?.mck_id && navigate(`/profile/${item.profiles.mck_id}`)}>
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    {/* ✅ Egress Fix 5: Assume avatar_url is the direct URL (prepares for Cloudinary Avatar migration) */}
                    <AvatarImage 
                      src={item.profiles?.avatar_url || undefined} 
                      alt={item.profiles?.full_name} 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {item.profiles?.full_name?.charAt(0) || <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {item.profiles?.full_name || 'Anonymous User'}
                      </h3>
                      {item.profiles?.verification_status === 'approved' && (
                        <Badge variant="verified" tooltip="Verified User" className="h-4 px-1">
                          <Shield className="h-3 w-3" />
                        </Badge>
                      )}
                      {item.profiles?.trust_seller_badge && (
                        <Badge variant="warning" tooltip="Trusted Seller" className="h-4 px-1">
                          <Star className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    {item.profiles?.mck_id && (
                      <p className="text-sm font-mono text-primary mb-1">{item.profiles.mck_id}</p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{item.profiles?.campus_points || 0} points</span>
                      <span>{item.profiles?.deals_completed || 0} deals</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons (Logic refined) */}
            <div className="space-y-3">
              {/* Login/KYC checks (kept intact) */}
              {!user && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Login Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please **login to chat** with the seller or save this item.
                  </p>
                  <Button variant="outline" className="mt-2 w-full" onClick={() => navigate('/auth')}>
                    Login / Sign Up
                  </Button>
                </div>
              )}

              {user && !isVerified && !isOwner && (
                <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                  <div className="flex items-center gap-2 text-info">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">KYC Verification Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your identity verification to enable interactions like **chatting and offering**.
                  </p>
                  <Button variant="default" className="mt-2 w-full" onClick={() => navigate('/kyc')}>
                    Complete Verification
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {!isOwner && (
                  <>
                    {/* BUY NOW BUTTON with full proactive check and labels */}
                    <Button
                      className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-colors"
                      size="lg"
                      onClick={handleBuyNow}
                      disabled={isDisabled}
                    >
                      <Package className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">{buttonText}</span>
                    </Button>
                    
                    {/* MAKE AN OFFER BUTTON - Disabled when reserved by anyone */}
                    <Button 
                      className="w-full relative group overflow-hidden" 
                      size="lg"
                      variant="outline"
                      onClick={() => setBargainingDialogOpen(true)}
                      disabled={isDisabled}
                    >
                      <DollarSign className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10 font-semibold">
                        {item.is_sold || isPendingBySomeoneElse
                          ? 'Item Unavailable' 
                          : 'Make an Offer'}
                      </span>
                    </Button>
                    
                    <div className="flex gap-3">
                      {/* CHAT BUTTON - Disabled when reserved by anyone */}
                      <Button 
                        variant="outline"
                        className="flex-1" 
                        size="lg"
                        onClick={() => handleChatClick()}
                        disabled={isDisabled}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        <span className="font-semibold">Chat</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite();
                        }}
                        disabled={checkingFavorite || item.is_sold}
                        className={`transition-colors ${
                          isFavorited 
                            ? 'bg-destructive/10 text-destructive border-destructive hover:bg-destructive/20' 
                            : 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {isOwner && (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This is your listing. You can edit or manage it from your dashboard.
                  </p>
                  <Button variant="outline" className="mt-2" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="listing"
        targetId={item?.id}
        targetName={item?.title}
      />

      {/* Bargaining Dialog */}
      <BargainingDialog
        isOpen={bargainingDialogOpen}
        onClose={() => setBargainingDialogOpen(false)}
        originalPrice={item?.price || 0}
        onSubmit={(offerPrice) => handleChatClick(offerPrice)}
        itemTitle={item?.title || ''}
      />
    </div>
  );
};

export default ItemDetail;
