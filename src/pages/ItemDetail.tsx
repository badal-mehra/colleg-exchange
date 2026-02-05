// ItemDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/mycampuskart-logo.png';
import {
  ArrowLeft, MessageCircle, Heart, Share2, MapPin, Calendar, Eye,
  User, AlertCircle, Shield, AlertTriangle, DollarSign,
  Package, Key, LogIn, ChevronRight, X, Maximize2, Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';
import { BargainingDialog } from '@/components/BargainingDialog';

// --- Cloudinary Optimization Helpers ---
const getDetailImage = (url: string) => {
  if (url && url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200/');
  }
  return url;
};

const getThumbImage = (url: string) => {
  if (url && url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto:low,w_100,h_100,c_fill/');
  }
  return url;
};

// --- Interfaces ---
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

interface RentalMetadata {
  rental_duration?: string;
  rental_deposit?: number;
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
  categories: Category | null;
  profiles: Profile | null;
  rental_metadata?: RentalMetadata | null;
  is_negotiable?: boolean;
}

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const { toast } = useToast();
  
  // State
  const [item, setItem] = useState<Item | null>(null);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);
  
  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [bargainingDialogOpen, setBargainingDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Order State
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [isPendingBySomeoneElse, setIsPendingBySomeoneElse] = useState(false);

  // --- Effects ---

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when ID changes
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

  // Combined checkPendingOrder function
  const checkPendingOrder = useCallback(async (itemId: string, currentUserId: string) => {
    const { data: pendingOrder, error } = await supabase
      .from("orders")
      .select("buyer_id")
      .eq("item_id", itemId)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
        setHasPendingOrder(false);
        setIsPendingBySomeoneElse(false);
        return;
    }
    
    if (pendingOrder) {
        const isCurrentUser = pendingOrder.buyer_id === currentUserId;
        setHasPendingOrder(isCurrentUser);
        setIsPendingBySomeoneElse(!isCurrentUser);
    } else {
        setHasPendingOrder(false);
        setIsPendingBySomeoneElse(false);
    }
  }, []);

  // Use onSnapshot for real-time updates
  useEffect(() => {
      if (user?.id && item?.id) {
          // Initial check
          checkPendingOrder(item.id, user.id); 

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
                checkPendingOrder(item.id, user.id);
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(ordersChannel);
          };
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
      setItem(null); 
    } else {
      const itemData = data as Item;
      setItem(itemData);
      
      // Fetch similar items if category exists
      if (itemData.categories?.id) {
        fetchSimilarItems(itemData.categories.id, itemData.id);
      }

      // Increment view count
      const viewedKey = `item_viewed_${id}`;
      const hasViewed = sessionStorage.getItem(viewedKey);
      if (!hasViewed) {
        sessionStorage.setItem(viewedKey, 'true');
        supabase
          .from('items')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id)
          .then(() => {});
      }
    }
    setLoading(false);
  };

  const fetchSimilarItems = async (categoryId: string, currentId: string) => {
    const { data } = await supabase
      .from('items')
      .select('id, title, price, images, condition, created_at')
      .eq('category_id', categoryId)
      .neq('id', currentId)
      .eq('is_sold', false)
      .limit(4);
    
    if (data) {
        setSimilarItems(data as any);
    }
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
      toast({ title: "Login Required", description: "Please login to add to cart", variant: "destructive" });
      navigate('/auth');
      return;
    }
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_id', id);
        setIsFavorited(false);
        sonnerToast.success('Removed from cart');
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, item_id: id });
        setIsFavorited(true);
        sonnerToast.success('Added to cart');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBuyNow = async () => {
    // 1. Check Login
    if (!user) {
        toast({ title: "Login Required", description: "Please login to buy items", variant: "default" });
        return navigate("/auth");
    }
    
    // 2. Check Verification
    const isVerified = userProfile?.is_verified && userProfile?.verification_status === 'approved';
    if (!isVerified) {
      toast({ title: "Verification Required", description: "Complete your Student KYC to buy", variant: "destructive" });
      return navigate("/kyc");
    }

    if (!item) return;

    if (user.id === item.seller_id) {
      toast({ title: "Error", description: "You cannot buy your own item", variant: "destructive" });
      return;
    }
    
    if (item.is_sold) {
      toast({ title: "Error", description: "This item is sold.", variant: "destructive" });
      return;
    }

    // RPC Call
    const { data: rpcResponse, error: rpcError } = await supabase.rpc("create_new_order", {
      item_id_input: item.id,
      buyer_id_input: user.id,
      seller_id_input: item.seller_id,
      agreed_price_input: item.price
    });

    if (rpcError) {
      const errorText = JSON.stringify(rpcError).toLowerCase();
      if (errorText.includes("duplicate pending order") || errorText.includes("already reserved")) {
        sonnerToast.error("Item reserved by another buyer.");
      } else {
        sonnerToast.error("System error processing order.");
      }
      return;
    }
    
    const response = rpcResponse as { success?: boolean; message?: string; error?: string } | null;

    if (!response?.success) {
        sonnerToast.error(response?.error || "Order failed.");
        navigate("/my-orders"); 
        return;
    }

    sonnerToast.success("Item reserved! Go to My Orders.");
    navigate("/my-orders");
    
    setHasPendingOrder(true);
    setIsPendingBySomeoneElse(false);
  };

  const handleChatClick = async (offerPrice?: number) => {
    // 1. Check Login
    if (!user) {
      toast({ title: "Login Required", description: "Please login to chat", variant: "default" });
      navigate('/auth');
      return;
    }

    // 2. Check Verification
    if (!userProfile?.is_verified || userProfile?.verification_status !== 'approved') {
      toast({ title: "Verification Required", description: "Please complete KYC", variant: "destructive" });
      navigate('/kyc');
      return;
    }

    try {
      if (!item) return; 

      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', item.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', item.seller_id)
        .maybeSingle();

      if (existingConversation) {
        if (offerPrice) await sendOfferMessage(existingConversation.id, offerPrice);
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id })
        .select()
        .single();

      if (error) throw error;

      if (offerPrice) await sendOfferMessage(newConversation.id, offerPrice);
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({ title: "Error", description: "Failed to start conversation", variant: "destructive" });
    }
  };

  const sendOfferMessage = async (conversationId: string, price: number) => {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user!.id,
      content: `Hi! I'm interested in "${item?.title}". I'd like to offer ₹${price.toLocaleString()}. Can we negotiate?`
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title,
          text: item?.description,
          url: window.location.href,
        });
      } catch (error) { console.log('Error sharing:', error); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      sonnerToast.success("Link copied");
    }
  };

  // --- Rendering ---
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-32 mb-4"></div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="h-96 bg-muted rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Item Not Found</h1>
        <Button onClick={() => navigate('/')}>Go Back Home</Button>
      </div>
    );
  }

  const isOwner = user?.id === item.seller_id;
  const isVerified = user && userProfile?.is_verified && userProfile?.verification_status === 'approved'; 
  
  // Logic for disabled states
  const isDisabled = !user || (!isVerified && !isOwner) || item.is_sold || hasPendingOrder || isPendingBySomeoneElse;
  
  // Button text logic
  const buttonText = item.is_sold
    ? 'Sold Out'
    : isPendingBySomeoneElse
    ? 'Reserved'
    : hasPendingOrder
    ? 'Already Reserved'
    : 'Buy Now';

  // Smart Mobile Button Handler
  const handleMobileMainAction = () => {
      if (!user) return navigate('/auth');
      if (!isVerified) return navigate('/kyc');
      handleBuyNow();
  };

  const mobileButtonLabel = !user 
      ? 'Login to Chat' 
      : !isVerified 
      ? 'Verify to Chat'
      : hasPendingOrder 
      ? 'Reserved' 
      : 'Buy Now';

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 lg:pb-8">
      {/* --- Header --- */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent">
            <ArrowLeft className="h-5 w-5" /> Back
          </Button>
          <img src={logo} alt="MyCampusKart" className="h-8" />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setReportModalOpen(true)}>
              <AlertTriangle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* --- Breadcrumbs --- */}
        <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-hidden whitespace-nowrap">
           <Link to="/" className="hover:text-primary transition-colors">Home</Link>
           {item.categories && (
             <>
               <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
               <span className="font-medium text-foreground">{item.categories.name}</span>
             </>
           )}
           <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
           <span className="truncate">{item.title}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* --- LEFT: Images (Span 7) --- */}
          <div className="lg:col-span-7 space-y-4">
            <div 
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white dark:bg-muted border shadow-sm group cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            >
              {item.images && item.images.length > 0 ? (
                <>
                  <img
                    src={getDetailImage(item.images[currentImageIndex])}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Maximize2 className="text-white drop-shadow-md h-10 w-10" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Eye className="h-16 w-16 mb-2 opacity-20" />
                  <p>No images available</p>
                </div>
              )}
              <Badge className="absolute top-4 left-4 bg-black/70 text-white border-0 hover:bg-black/80">
                {item.condition}
              </Badge>
            </div>
            
            {/* Thumbnails */}
            {item.images && item.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getThumbImage(image)} 
                      alt={`thumb ${index}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Safety Tips Card */}
            <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Shield className="h-5 w-5" /> Safety First
                 </CardTitle>
               </CardHeader>
               <CardContent className="text-sm text-muted-foreground">
                 <ul className="list-disc ml-4 space-y-1">
                   <li>Meet in safe, public places on campus.</li>
                   <li>Check the item thoroughly before paying.</li>
                   <li>Keep all chats inside MyCampusKart.</li>
                 </ul>
               </CardContent>
            </Card>
          </div>

          {/* --- RIGHT: Details & Actions (Span 5) --- */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card rounded-xl border p-6 shadow-sm space-y-6">
              
              <div>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">{item.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {item.views} views</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(item.created_at).toLocaleDateString()}</span>
                  {item.location && (
                    <div className="flex items-center gap-1 text-primary">
                      <MapPin className="h-4 w-4" /> {item.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">₹{item.price.toLocaleString()}</span>
                {item.rental_metadata?.rental_duration && (
                  <span className="text-lg text-muted-foreground font-medium mb-1.5">
                    /{item.rental_metadata.rental_duration.replace('per_', '')}
                  </span>
                )}
              </div>

              {/* Rental Specifics */}
              {item.rental_metadata?.rental_duration && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                      <Key className="h-4 w-4" /> Rental Details
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit:</span>
                      <span className="font-bold">
                        {item.rental_metadata.rental_deposit ? `₹${item.rental_metadata.rental_deposit}` : 'None'}
                      </span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {item.description}
                </p>
              </div>

              <Separator />

              {/* Seller Info */}
              <div 
                className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => item.profiles?.mck_id && navigate(`/profile/${item.profiles.mck_id}`)}
              >
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={item.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{item.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.profiles?.full_name || 'User'}</h3>
                    {item.profiles?.verification_status === 'approved' && (
                      <Badge variant="secondary" className="h-5 text-[10px] px-1 bg-blue-100 text-blue-700">Verified</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.profiles?.mck_id}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* --- DESKTOP ACTION AREA --- */}
              <div className="hidden lg:flex flex-col gap-3 pt-2">
                
                {/* CASE 1: NOT LOGGED IN */}
                {!user && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 space-y-3 text-center">
                            <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <LogIn className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Login to Buy & Chat</h3>
                                <p className="text-xs text-muted-foreground">Create a free account to contact the seller.</p>
                            </div>
                            <Button className="w-full font-semibold" onClick={() => navigate('/auth')}>
                                Login / Signup
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* CASE 2: LOGGED IN BUT UNVERIFIED (And not owner) */}
                {user && !isVerified && !isOwner && (
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-amber-800 font-semibold">
                                <AlertCircle className="h-5 w-5" />
                                <span>Verification Required</span>
                            </div>
                            <p className="text-xs text-amber-700">
                                You must complete your student KYC verification to buy items or chat with sellers.
                            </p>
                            <Button variant="outline" className="w-full border-amber-300 text-amber-900 hover:bg-amber-100" onClick={() => navigate('/kyc')}>
                                Verify My ID
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* CASE 3: LOGGED IN & VERIFIED (Normal Flow) */}
                {user && (isVerified || isOwner) && (
                  <>
                    {!isOwner ? (
                      <>
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 h-12 text-base shadow-sm" 
                            size="lg"
                            onClick={handleBuyNow}
                            disabled={isDisabled}
                          >
                            <Package className="h-5 w-5 mr-2" />
                            {buttonText}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className={`h-12 w-12 border-2 ${isFavorited ? 'border-red-500 text-red-500 bg-red-50' : ''}`}
                            onClick={toggleFavorite}
                          >
                             <Heart className={`h-6 w-6 ${isFavorited ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <Button variant="outline" onClick={() => setBargainingDialogOpen(true)} disabled={isDisabled}>
                             <DollarSign className="h-4 w-4 mr-2" /> Make Offer
                           </Button>
                           <Button variant="secondary" onClick={() => handleChatClick()} disabled={isDisabled}>
                             <MessageCircle className="h-4 w-4 mr-2" /> Chat
                           </Button>
                        </div>
                      </>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                        Manage Your Listing
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Similar Items Section (HIDDEN IF LOGGED OUT) --- */}
        {user && similarItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarItems.map((similar) => (
                <Link to={`/items/${similar.id}`} key={similar.id} className="group block bg-card rounded-lg border overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img 
                      src={getThumbImage(similar.images[0])} 
                      alt={similar.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium truncate text-sm">{similar.title}</h3>
                    <p className="font-bold text-primary text-sm mt-1">₹{similar.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- Sticky Mobile Action Bar --- */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-50 flex gap-3 items-center safe-area-pb">
          <div className="flex flex-col px-1">
            <span className="text-xs text-muted-foreground">Price</span>
            <span className="font-bold text-lg text-primary">₹{item.price.toLocaleString()}</span>
          </div>
          <div className="flex-1 flex gap-2 justify-end">
             {/* If NOT LOGGED IN */}
             {!user ? (
                 <Button className="w-full" onClick={() => navigate('/auth')}>
                    <LogIn className="h-4 w-4 mr-2" /> Login to Chat
                 </Button>
             ) : !isVerified ? (
                 /* If UNVERIFIED */
                 <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => navigate('/kyc')}>
                    <Shield className="h-4 w-4 mr-2" /> Verify to Buy
                 </Button>
             ) : (
                 /* NORMAL FLOW */
                 <>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleChatClick()} disabled={isDisabled}>
                        Chat
                    </Button>
                    <Button className="flex-[1.5]" size="sm" onClick={handleBuyNow} disabled={isDisabled}>
                        {hasPendingOrder ? 'Reserved' : 'Buy Now'}
                    </Button>
                 </>
             )}
          </div>
        </div>
      )}

      {/* --- Custom Lightbox --- */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img 
            src={getDetailImage(item.images[currentImageIndex])} 
            className="max-w-full max-h-[85vh] object-contain rounded-md"
            alt="Fullscreen view"
          />
          
          {item.images.length > 1 && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {item.images.map((_, idx) => (
                   <div 
                     key={idx} 
                     className={`h-2 w-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`} 
                   />
                ))}
             </div>
          )}
        </div>
      )}

      {/* --- Other Modals --- */}
      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="listing"
        targetId={item?.id}
        targetName={item?.title}
      />

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
