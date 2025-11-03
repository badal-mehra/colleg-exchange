import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ShoppingCart,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';

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

  useEffect(() => {
    if (id) {
      fetchItem();
      if (user) {
        fetchUserProfile();
        checkIfFavorited();
      }
    }
  }, [id, user]);

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
      toast({
        title: "Error",
        description: "Item not found",
        variant: "destructive",
      });
      navigate('/');
    } else {
      setItem(data);
      // Increment view count
      await supabase
        .from('items')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);
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
      setUserProfile(data);
    }
  };

  const handleChatClick = async () => {
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

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', item!.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', item!.seller_id)
        .single();

      if (existingConversation) {
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          item_id: item!.id,
          buyer_id: user.id,
          seller_id: item!.seller_id,
        })
        .select()
        .single();

      if (error) throw error;

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

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to make a purchase",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!userProfile?.is_verified || userProfile?.verification_status !== 'approved') {
      toast({
        title: "Verification Required",
        description: "Please complete your KYC verification to make purchases",
        variant: "destructive",
      });
      navigate('/kyc');
      return;
    }

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          item_id: item!.id,
          buyer_id: user.id,
          seller_id: item!.seller_id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      sonnerToast.success('Order created successfully! Ask the seller to meet you to complete the transaction.');
      
      // Navigate to chat to coordinate with seller
      handleChatClick();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
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

  if (loading) {
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
  const isVerified = userProfile?.is_verified && userProfile?.verification_status === 'approved';

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
            <h1 className="text-xl font-bold text-primary">MyCampusKart</h1>
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
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {item.images.length > 0 ? (
                <img
                  src={item.images[currentImageIndex]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTUwSDI1MFYyNTBIMTUwVjE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
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
              <Badge className="absolute top-4 right-4">
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
                    <img
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
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
                    <AvatarImage 
                      src={item.profiles?.avatar_url ? supabase.storage.from('avatars').getPublicUrl(item.profiles.avatar_url).data.publicUrl : undefined} 
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

            {/* Action Buttons */}
            <div className="space-y-3">
              {!user && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Login Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please login to chat with the seller or save this item.
                  </p>
                </div>
              )}

              {user && !isVerified && !isOwner && (
                <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                  <div className="flex items-center gap-2 text-info">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">KYC Verification Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your identity verification to chat with sellers.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {!isOwner && (
                  <>
                    <Button 
                      className="w-full relative group overflow-hidden" 
                      size="lg"
                      onClick={handleBuyNow}
                      disabled={!user || (!isVerified && !isOwner) || item.is_sold}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ShoppingCart className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10 font-semibold">
                        {item.is_sold ? 'Sold Out' : 'Buy Now'}
                      </span>
                    </Button>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        className="flex-1" 
                        size="lg"
                        onClick={handleChatClick}
                        disabled={!user || (!isVerified && !isOwner)}
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
                        disabled={checkingFavorite}
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
    </div>
  );
};

export default ItemDetail;