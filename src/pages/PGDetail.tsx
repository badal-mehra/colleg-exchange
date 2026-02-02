import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/mycampuskart-logo.png';
import {
  ArrowLeft, MessageCircle, Phone, Share2, MapPin, Calendar, Eye, User,
  Home, Users, Wifi, Bed, Lamp, BookOpen, DoorOpen, Flame, WashingMachine,
  Zap, Car, Clock, Cigarette, Wine, UserCheck, Utensils, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  mck_id: string;
  phone: string | null;
}

interface PGListing {
  id: string;
  property_type: string;
  for_gender: string;
  sharing_type: string;
  rent_per_month: number;
  security_deposit: number;
  electricity_included: boolean;
  food_included: boolean;
  area_locality: string;
  distance_from_campus: string | null;
  landmark: string | null;
  amenities: string[];
  gate_timing: string | null;
  smoking_allowed: boolean;
  alcohol_allowed: boolean;
  visitors_allowed: boolean;
  images: string[];
  contact_method: string;
  views: number;
  created_at: string;
  seller_id: string;
  profiles?: Profile;
}

const getDetailImage = (url: string) => {
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200/');
  }
  return url;
};

const getThumbImage = (url: string) => {
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto:low,w_100,h_100,c_fill/');
  }
  return url;
};

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  bed: <Bed className="h-4 w-4" />,
  mattress: <Bed className="h-4 w-4" />,
  study_table: <BookOpen className="h-4 w-4" />,
  almirah: <DoorOpen className="h-4 w-4" />,
  geyser: <Flame className="h-4 w-4" />,
  washing_machine: <WashingMachine className="h-4 w-4" />,
  power_backup: <Zap className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
};

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi',
  bed: 'Bed',
  mattress: 'Mattress',
  study_table: 'Study Table',
  almirah: 'Almirah',
  geyser: 'Geyser',
  washing_machine: 'Washing Machine',
  power_backup: 'Power Backup',
  parking: 'Parking',
};

const PGDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState<PGListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (id) fetchListing();
  }, [id]);

  useEffect(() => {
    if (user) fetchUserProfile();
  }, [user]);

  const fetchListing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pg_listings')
      .select(`*, profiles (user_id, full_name, avatar_url, mck_id, phone)`)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching PG listing:', error);
      setListing(null);
    } else {
      // Parse amenities if it's a JSON string
      const parsed = data as any;
      if (typeof parsed.amenities === 'string') {
        try {
          parsed.amenities = JSON.parse(parsed.amenities);
        } catch {
          parsed.amenities = [];
        }
      }
      setListing(parsed as PGListing);
      
      // Increment view count
      await supabase
        .from('pg_listings')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);
    }
    setLoading(false);
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setUserProfile(data);
  };

  const handleChatClick = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to chat", variant: "destructive" });
      return navigate('/auth');
    }

    if (!userProfile?.is_verified || userProfile?.verification_status !== 'approved') {
      toast({ title: "Verification Required", description: "Please complete KYC", variant: "destructive" });
      return navigate('/kyc');
    }

    if (!listing) return;

    try {
      // Check existing PG conversation
      const { data: existing } = await supabase
        .from('pg_conversations')
        .select('id')
        .eq('pg_listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.seller_id)
        .maybeSingle();

      if (existing) {
        navigate(`/pwa-chat/${existing.id}?type=pg`);
        return;
      }

      // Create new PG conversation
      const { data: newConv, error } = await supabase
        .from('pg_conversations')
        .insert({
          pg_listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send initial message
      await supabase.from('messages').insert({
        conversation_id: newConv.id,
        sender_id: user.id,
        content: `Hi! I'm interested in your ${listing.property_type.toUpperCase()} listing in ${listing.area_locality} (₹${listing.rent_per_month}/month).`,
      });

      navigate(`/pwa-chat/${newConv.id}?type=pg`);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "Failed to start conversation", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${listing?.property_type.toUpperCase()} in ${listing?.area_locality}`,
          text: `Check out this PG/Room listing - ₹${listing?.rent_per_month}/month`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      sonnerToast.success('Link copied to clipboard!');
    }
  };

  const nextImage = () => {
    if (listing && listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing && listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">PG listing not found</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  const propertyLabel = { pg: 'PG', room: 'Room', hostel: 'Hostel', flat: 'Flat' }[listing.property_type] || listing.property_type;
  const genderLabel = { boys: 'Boys Only', girls: 'Girls Only', both: 'Co-ed' }[listing.for_gender] || listing.for_gender;
  const sharingLabel = { single: 'Single Occupancy', double: 'Double Sharing', triple: 'Triple Sharing', any: 'Any Sharing' }[listing.sharing_type] || listing.sharing_type;
  const seller = listing.profiles;
  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={logo} alt="MyCampusKart" className="h-8" />
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="relative bg-muted aspect-[4/3] sm:aspect-[16/9] max-h-[400px] overflow-hidden">
        <img
          src={getDetailImage(listing.images[currentImageIndex] || '/placeholder.svg')}
          alt="Room"
          className="w-full h-full object-cover"
        />
        {listing.images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {listing.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}`}
                />
              ))}
            </div>
          </>
        )}
        <Badge className="absolute top-3 left-3 bg-orange-500">
          <Home className="h-3 w-3 mr-1" /> {propertyLabel}
        </Badge>
      </div>

      {/* Thumbnail Strip */}
      {listing.images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {listing.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentImageIndex ? 'border-orange-500' : 'border-transparent opacity-60'
              }`}
            >
              <img src={getThumbImage(img)} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6 pb-32">
        {/* Price & Basic Info */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">₹{listing.rent_per_month.toLocaleString()}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className={listing.for_gender === 'boys' ? 'bg-blue-100 text-blue-700' : listing.for_gender === 'girls' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}>
              <Users className="h-3 w-3 mr-1" /> {genderLabel}
            </Badge>
            <Badge variant="outline">{sharingLabel}</Badge>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card rounded-xl p-4 border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" /> Location
          </h3>
          <p className="text-foreground font-medium">{listing.area_locality}</p>
          {listing.landmark && <p className="text-sm text-muted-foreground">Near {listing.landmark}</p>}
          {listing.distance_from_campus && (
            <p className="text-sm text-muted-foreground mt-1">{listing.distance_from_campus} from campus</p>
          )}
        </div>

        {/* Pricing Details */}
        <div className="bg-card rounded-xl p-4 border">
          <h3 className="font-semibold mb-3">Pricing Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-medium">₹{listing.rent_per_month.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="font-medium">₹{(listing.security_deposit || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Electricity</span>
              <span className={listing.electricity_included ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                {listing.electricity_included ? 'Included' : 'Extra'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Food</span>
              <span className={listing.food_included ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                {listing.food_included ? 'Included' : 'Not Included'}
              </span>
            </div>
          </div>
        </div>

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="bg-card rounded-xl p-4 border">
            <h3 className="font-semibold mb-3">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {listing.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                  {amenityIcons[amenity] || <Shield className="h-4 w-4" />}
                  <span>{amenityLabels[amenity] || amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="bg-card rounded-xl p-4 border">
          <h3 className="font-semibold mb-3">House Rules</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {listing.gate_timing && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Gate: {listing.gate_timing}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Cigarette className={`h-4 w-4 ${listing.smoking_allowed ? 'text-green-500' : 'text-red-500'}`} />
              <span>Smoking: {listing.smoking_allowed ? 'Allowed' : 'Not Allowed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wine className={`h-4 w-4 ${listing.alcohol_allowed ? 'text-green-500' : 'text-red-500'}`} />
              <span>Alcohol: {listing.alcohol_allowed ? 'Allowed' : 'Not Allowed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className={`h-4 w-4 ${listing.visitors_allowed ? 'text-green-500' : 'text-red-500'}`} />
              <span>Visitors: {listing.visitors_allowed ? 'Allowed' : 'Not Allowed'}</span>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        {seller && (
          <div className="bg-card rounded-xl p-4 border">
            <h3 className="font-semibold mb-3">Listed By</h3>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => seller.mck_id && navigate(`/profile/${seller.mck_id}`)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={seller.avatar_url || undefined} />
                <AvatarFallback>{seller.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{seller.full_name || 'User'}</p>
                <p className="text-sm text-muted-foreground">@{seller.mck_id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" /> {listing.views || 0} views
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> Listed {new Date(listing.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
          <div className="container mx-auto flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleChatClick}>
              <MessageCircle className="h-4 w-4 mr-2" /> Chat
            </Button>
            {listing.contact_method === 'call' && seller?.phone && (
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" asChild>
                <a href={`tel:${seller.phone}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call
                </a>
              </Button>
            )}
            {listing.contact_method === 'whatsapp' && seller?.phone && (
              <Button className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                <a href={`https://wa.me/${seller.phone.replace(/\D/g, '')}?text=Hi! I'm interested in your PG listing in ${listing.area_locality}`} target="_blank">
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </a>
              </Button>
            )}
            {listing.contact_method === 'chat' && (
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleChatClick}>
                <MessageCircle className="h-4 w-4 mr-2" /> Contact Owner
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PGDetail;