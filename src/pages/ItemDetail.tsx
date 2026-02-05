// ItemDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import logo from '@/assets/mycampuskart-logo.png';
import {
  ArrowLeft, MessageCircle, Heart, Share2, MapPin, Calendar, Eye,
  User, AlertCircle, Shield, Star, AlertTriangle, DollarSign,
  Package, Key, Clock, Banknote, LogIn, ChevronRight, X, ExternalLink,
  Maximize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';
import { BargainingDialog } from '@/components/BargainingDialog';

// --- Types ---
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
  created_at?: string; 
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
  categories: Category;
  profiles: Profile;
  rental_metadata?: RentalMetadata | null;
  is_negotiable?: boolean;
}

// --- Image Helpers ---
const getDetailImage = (url: string) => 
  url.includes('cloudinary.com') ? url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200/') : url;

const getThumbImage = (url: string) => 
  url.includes('cloudinary.com') ? url.replace('/upload/', '/upload/f_auto,q_auto:low,w_100,h_100,c_fill/') : url;

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const { toast } = useToast();
  
  // State
  const [item, setItem] = useState<Item | null>(null);
  const [similarItems, setSimilarItems] = useState<Item[]>([]); // New: Similar Items
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [bargainingDialogOpen, setBargainingDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false); // New: Lightbox state

  // Order State
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [isPendingBySomeoneElse, setIsPendingBySomeoneElse] = useState(false);

  // --- Effects ---

  useEffect(() => {
    window.scrollTo(0, 0); // Reset scroll on ID change
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

  // Real-time listener (kept from original)
  useEffect(() => {
      if (user?.id && item?.id) {
          checkPendingOrder(item.id, user.id); 
          const ordersChannel = supabase
            .channel(`item_${item.id}_orders`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `item_id=eq.${item.id}`},
              () => checkPendingOrder(item.id, user.id)
            )
            .subscribe();
          return () => { supabase.removeChannel(ordersChannel); };
      }
  }, [user?.id, item?.id]); // Removed checkPendingOrder from deps to avoid loop if not memoized perfectly

  // --- Logic ---

  const checkPendingOrder = async (itemId: string, currentUserId: string) => {
    const { data: pendingOrder } = await supabase
      .from("orders")
      .select("buyer_id")
      .eq("item_id", itemId)
      .eq("status", "pending")
      .maybeSingle();
    
    if (pendingOrder) {
        const isCurrentUser = pendingOrder.buyer_id === currentUserId;
        setHasPendingOrder(isCurrentUser);
        setIsPendingBySomeoneElse(!isCurrentUser);
    } else {
        setHasPendingOrder(false);
        setIsPendingBySomeoneElse(false);
    }
  };

  const fetchItem = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select(`*, categories (*), profiles (*)`)
      .eq('id', id)
      .single();

    if (error) {
      setItem(null); 
    } else {
      setItem(data as Item);
      fetchSimilarItems(data.categories?.id, data.id); // Fetch similar
      handleViewCount(data);
    }
    setLoading(false);
  };

  const fetchSimilarItems = async (categoryId: string, currentId: string) => {
    if (!categoryId) return;
    const { data } = await supabase
      .from('items')
      .select('id, title, price, images, condition, created_at')
      .eq('category_id', categoryId)
      .neq('id', currentId) // Don't show current item
      .eq('is_sold', false)
      .limit(4);
    
    if (data) setSimilarItems(data as any);
  };

  const handleViewCount = (data: Item) => {
    const viewedKey = `item_viewed_${id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, 'true');
      supabase.from('items').update({ views: (data.views || 0) + 1 }).eq('id', id).then();
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (data) setUserProfile(data as Profile);
  };

  const checkIfFavorited = async () => {
    if (!user || !id) return;
    setCheckingFavorite(true);
    const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('item_id', id).maybeSingle();
    setIsFavorited(!!data);
    setCheckingFavorite(false);
  };

  const toggleFavorite = async () => {
    if (!user) return navigate('/auth');
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
    } catch (e) { console.error(e); }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate("/auth");
    if (!item) return;

    if (!userProfile?.is_verified) {
      toast({ title: "Verification Required", description: "Complete KYC to buy", variant: "destructive" });
      return navigate("/kyc");
    }
    if (user.id === item.seller_id) return sonnerToast.error("Cannot buy your own item");
    
    // RPC Call
    const { data: rpcResponse, error: rpcError } = await supabase.rpc("create_new_order", {
      item_id_input: item.id,
      buyer_id_input: user.id,
      seller_id_input: item.seller_id,
      agreed_price_input: item.price
    });

    if (rpcError) {
      const errorText = JSON.stringify(rpcError).toLowerCase();
      if (errorText.includes("duplicate") || errorText.includes("reserved")) {
        sonnerToast.error("Item just reserved by another buyer.");
      } else {
        sonnerToast.error("System error. Try again.");
      }
      return;
    }
    
    const response = rpcResponse as { success?: boolean; message?: string; error?: string };
    if (!response?.success) {
        sonnerToast.error(response?.error || "Reservation failed.");
        return;
    }

    sonnerToast.success("Item reserved! Go to My Orders.");
    navigate("/my-orders");
  };

  const handleChatClick = async (offerPrice?: number) => {
    if (!user) return navigate('/auth');
    if (!userProfile?.is_verified) return navigate('/kyc');
    if (!item) return;

    // Check existing conversation
    const { data: existing } = await supabase.from('conversations')
      .select('id').eq('item_id', item.id).eq('buyer_id', user.id).eq('seller_id', item.seller_id).maybeSingle();

    if (existing) {
      if (offerPrice) await sendOfferMessage(existing.id, offerPrice);
      navigate(`/chat/${existing.id}`);
    } else {
      const { data: newConv, error } = await supabase.from('conversations')
        .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id }).select().single();
      if (!error && newConv) {
        if (offerPrice) await sendOfferMessage(newConv.id, offerPrice);
        navigate(`/chat/${newConv.id}`);
      }
    }
  };

  const sendOfferMessage = async (conversationId: string, price: number) => {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user!.id,
      content: `Hi! I'm interested in "${item?.title}". Offering ₹${price.toLocaleString()}. Can we negotiate?`
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: item?.title, text: item?.description, url: window.location.href }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      sonnerToast.success("Link copied to clipboard");
    }
  };

  // --- Render Helpers ---

  if (loading) return <ItemSkeleton />;
  if (!item) return <ItemNotFound navigate={navigate} />;

  const isOwner = user?.id === item.seller_id;
  const isDisabled = !user || (!isOwner && !userProfile?.is_verified) || item.is_sold || hasPendingOrder || isPendingBySomeoneElse;
  
  const buttonText = item.is_sold ? 'Sold Out' : isPendingBySomeoneElse ? 'Reserved' : hasPendingOrder ? 'Already Reserved' : 'Buy Now';

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 md:pb-8">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <img src={logo} alt="MyCampusKart" className="h-8" />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}><Share2 className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setReportModalOpen(true)}>
              <AlertTriangle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2">
           <Link to="/" className="hover:text-primary transition-colors">Home</Link>
           <ChevronRight className="h-4 w-4 mx-2" />
           <span className="font-medium text-foreground">{item.categories.name}</span>
           <ChevronRight className="h-4 w-4 mx-2" />
           <span className="truncate max-w-[200px]">{item.title}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Images & Description (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Image Gallery */}
            <div className="space-y-3">
              <div 
                className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border shadow-sm group cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                {item.images.length > 0 ? (
                  <>
                    <img
                      src={getDetailImage(item.images[currentImageIndex])}
                      alt={item.title}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <Maximize2 className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md transform scale-75 group-hover:scale-100 transition-all duration-300" />
                     </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Eye className="h-16 w-16 mb-2 opacity-20" />
                    <p>No images</p>
                  </div>
                )}
                
                {/* Condition Badge Overlay */}
                <Badge className="absolute top-4 left-4 bg-black/60 hover:bg-black/70 backdrop-blur-md text-white border-0">
                  {item.condition}
                </Badge>
              </div>

              {/* Thumbnails */}
              {item.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={getThumbImage(img)} className="w-full h-full object-cover" alt="thumb" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {item.description}
              </CardContent>
            </Card>

            {/* Safety Tips (New Feature) */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900">
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Shield className="h-5 w-5" /> Safety Tips for Students
                 </CardTitle>
               </CardHeader>
               <CardContent className="text-sm text-muted-foreground space-y-2">
                 <li className="list-disc ml-4">Always meet in safe, public campus locations (Library, Cafeteria).</li>
                 <li className="list-disc ml-4">Check the item thoroughly before paying.</li>
                 <li className="list-disc ml-4">Avoid sharing personal financial details outside the app.</li>
               </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Info & Actions (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Info Card */}
            <Card className="border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
              <CardContent className="p-0 lg:p-6 space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">{item.title}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {item.views} views</span>
                    {item.location && (
                       <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location + " Lovely Professional University")}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                       >
                         <MapPin className="h-3.5 w-3.5" /> {item.location}
                       </a>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-primary">₹{item.price.toLocaleString()}</span>
                  {item.is_negotiable && <Badge variant="outline" className="mb-2 text-green-600 border-green-200 bg-green-50">Negotiable</Badge>}
                </div>

                {/* Rental Card (Conditional) */}
                {item.rental_metadata?.rental_duration && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                       <Key className="h-4 w-4" /> Rental Item
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <p className="text-xs text-muted-foreground">Duration</p>
                         <p className="font-medium capitalize">{item.rental_metadata.rental_duration.replace('per_', 'Per ')}</p>
                       </div>
                       {item.rental_metadata.rental_deposit && (
                         <div>
                           <p className="text-xs text-muted-foreground">Deposit</p>
                           <p className="font-medium">₹{item.rental_metadata.rental_deposit}</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Seller Profile */}
                <div onClick={() => item.profiles?.mck_id && navigate(`/profile/${item.profiles.mck_id}`)} className="cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border transition-transform group-hover:scale-105">
                      <AvatarImage src={item.profiles?.avatar_url || undefined} />
                      <AvatarFallback>{item.profiles?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{item.profiles?.full_name}</h3>
                        {item.profiles?.verification_status === 'approved' && <Shield className="h-3.5 w-3.5 text-blue-500 fill-blue-500/20" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.profiles?.mck_id}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                     <div className="bg-muted/50 p-2 rounded text-center">
                        <p className="text-xs text-muted-foreground">Deals</p>
                        <p className="font-semibold text-sm">{item.profiles?.deals_completed || 0}</p>
                     </div>
                     <div className="bg-muted/50 p-2 rounded text-center">
                        <p className="text-xs text-muted-foreground">Points</p>
                        <p className="font-semibold text-sm">{item.profiles?.campus_points || 0}</p>
                     </div>
                  </div>
                </div>

                {/* Desktop Action Buttons (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-col gap-3 pt-2">
                   {!isOwner ? (
                     <>
                        <div className="flex gap-3">
                           <Button 
                             className="flex-1 h-12 text-base font-semibold shadow-md" 
                             onClick={handleBuyNow} 
                             disabled={isDisabled}
                           >
                              {buttonText}
                           </Button>
                           <Button 
                             size="icon" 
                             variant="outline" 
                             className={`h-12 w-12 ${isFavorited ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
                             onClick={toggleFavorite}
                           >
                             <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                           </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <Button variant="outline" onClick={() => setBargainingDialogOpen(true)} disabled={isDisabled}>
                             Make Offer
                           </Button>
                           <Button variant="secondary" onClick={() => handleChatClick()} disabled={isDisabled}>
                             <MessageCircle className="h-4 w-4 mr-2" /> Chat
                           </Button>
                        </div>
                     </>
                   ) : (
                     <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>Manage Listing</Button>
                   )}
                </div>
              </CardContent>
            </Card>

             {/* Verification Banner */}
             {user && !userProfile?.is_verified && !isOwner && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 text-sm">Verification Needed</h4>
                    <p className="text-xs text-amber-700 mt-1 mb-2">You need to verify your student ID to buy or chat.</p>
                    <Button size="sm" variant="outline" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 h-8" onClick={() => navigate('/kyc')}>
                      Verify Now
                    </Button>
                  </div>
                </div>
              )}

          </div>
        </div>

        {/* Similar Items Section */}
        {similarItems.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              You might also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarItems.map((similar) => (
                <Link to={`/items/${similar.id}`} key={similar.id} className="group block space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                    <img 
                      src={getThumbImage(similar.images[0])} 
                      alt={similar.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium truncate">{similar.title}</h3>
                    <p className="font-bold text-primary">₹{similar.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(similar.created_at).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Action Bar */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-50 flex gap-2 items-center safe-area-pb">
          <div className="flex flex-col px-2">
            <span className="text-xs text-muted-foreground">Price</span>
            <span className="font-bold text-lg text-primary">₹{item.price.toLocaleString()}</span>
          </div>
          <div className="flex-1 flex gap-2 justify-end">
             <Button variant="outline" size="sm" onClick={() => handleChatClick()} disabled={isDisabled}>
               Chat
             </Button>
             <Button className="flex-1" size="sm" onClick={handleBuyNow} disabled={isDisabled}>
               {hasPendingOrder ? 'Reserved' : 'Buy Now'}
             </Button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
            <div className="relative w-full h-full">
               <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute -top-10 right-0 text-white hover:bg-white/20 rounded-full z-50"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="h-6 w-6" />
               </Button>
               <img 
                 src={getDetailImage(item.images[currentImageIndex])} 
                 className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                 alt="Full view"
               />
               
               {/* Lightbox Navigation arrows could go here */}
            </div>
        </DialogContent>
      </Dialog>

      {/* Other Modals */}
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

// Simple sub-components for cleaner code
const ItemSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
    <div className="h-6 bg-muted rounded w-32 mb-6"></div>
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 aspect-[4/3] bg-muted rounded-xl"></div>
      <div className="lg:col-span-5 space-y-4">
        <div className="h-10 bg-muted rounded w-3/4"></div>
        <div className="h-6 bg-muted rounded w-1/4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    </div>
  </div>
);

const ItemNotFound = ({ navigate }: { navigate: any }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <Package className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
    <h1 className="text-2xl font-bold mb-2">Item Not Found</h1>
    <p className="text-muted-foreground mb-6">This item may have been removed or sold.</p>
    <Button onClick={() => navigate('/')}>Browse Items</Button>
  </div>
);

export default ItemDetail;
