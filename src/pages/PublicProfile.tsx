import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // NEW
import { 
  ArrowLeft, Award, Star, Trophy, Package, User as UserIcon, 
  AlertTriangle, Shield, CheckCircle, Home, MapPin, 
  MessageCircle, Calendar, Share2, Clock 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportModal } from '@/components/ReportModal';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/seo/SEOHead';
import { canonical, personJsonLd, breadcrumbJsonLd } from '@/lib/seo';

// --- Interfaces ---
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  mck_id: string;
  university: string;
  campus_points: number;
  deals_completed: number;
  trust_seller_badge: boolean;
  avatar_url: string | null;
  verification_status: string;
  created_at?: string; // Assumed field for "Member Since"
}

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  created_at: string;
  is_sold: boolean;
  condition: string;
  seller_id: string;
}

interface PGListing {
  id: string;
  property_type: string;
  for_gender: string;
  sharing_type: string;
  rent_per_month: number;
  area_locality: string;
  images: string[];
  created_at: string;
  is_active: boolean;
  status: string;
  seller_id: string;
}

// --- Utilities ---
const fetchUserRating = async (userId: string) => {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("to_user_id", userId);

  if (error || !data) return { avg: 0, count: 0 };
  const count = data.length;
  const avg = count === 0 ? 0 : data.reduce((sum, item) => sum + item.rating, 0) / count;
  return { avg: parseFloat(avg.toFixed(1)), count };
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

const PublicProfile = () => {
  const { mckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Item[]>([]);
  const [pgListings, setPgListings] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [sellerRating, setSellerRating] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    fetchProfileAndListings();
  }, [mckId]);

  const fetchProfileAndListings = async () => {
    if (!mckId) return;
    setLoading(true);
    
    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('mck_id', mckId)
      .single();

    if (profileError || !profileData) {
      toast({ title: "Error", description: "Profile not found", variant: "destructive" });
      setLoading(false);
      return;
    }

    setProfile(profileData);
    
    // 2. Fetch Rating & Listings Parallelly
    if (profileData.user_id) {
      const [rating, items, pgs] = await Promise.all([
        fetchUserRating(profileData.user_id),
        supabase.from('items').select('*').eq('seller_id', profileData.user_id).order('created_at', { ascending: false }),
        supabase.from('pg_listings').select('*').eq('seller_id', profileData.user_id).order('created_at', { ascending: false })
      ]);

      setSellerRating(rating);
      if (items.data) setListings(items.data as Item[]);
      if (pgs.data) setPgListings(pgs.data as PGListing[]);
    }

    setLoading(false);
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "Profile link copied to clipboard." });
  };

  const handleMessage = () => {
    if(!profile) return;
    // Assuming you have a chat route
    navigate(`/chat/${profile.user_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
          <div className="h-48 bg-muted rounded-lg w-full"></div>
          <div className="h-24 w-24 rounded-full bg-muted mx-auto -mt-12"></div>
          <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = getAvatarUrl(profile.avatar_url);
  const activeListings = listings.filter(item => !item.is_sold);
  const activePGListings = pgListings.filter(pg => pg.is_active && pg.status !== 'rented');

  const profileUrl = canonical(`/profile/${profile.mck_id}`);
  const hasListings = listings.length > 0 || pgListings.length > 0;

  return (
    <div className="min-h-screen bg-background pb-12">
      <SEOHead
        title={`${profile.full_name} (@${profile.mck_id}) — Verified Seller on MyCampusKart`}
        description={`${profile.full_name} is a verified student seller on MyCampusKart${profile.university ? ` at ${profile.university}` : ''}. ${listings.length} items & ${pgListings.length} PG listings. ${profile.deals_completed} successful deals.`}
        canonical={profileUrl}
        image={avatarUrl || undefined}
        noindex={!hasListings}
        jsonLd={[
          personJsonLd({ name: profile.full_name, url: profileUrl, image: avatarUrl, mckId: profile.mck_id }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Sellers', path: '/' },
            { name: profile.full_name, path: `/profile/${profile.mck_id}` },
          ]),
        ]}
      />
      {/* 1. Gradient Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 w-full relative">
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-24 relative z-10">
        
        {/* 2. Main Profile Card */}
        <Card className="mb-8 shadow-xl overflow-visible border-none">
          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              
              {/* Avatar */}
              <div className="relative -mt-16 md:-mt-20">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-[6px] border-background shadow-md">
                  <AvatarImage src={avatarUrl || undefined} alt={profile.full_name} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {profile.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {profile.verification_status === 'approved' && (
                  <div className="absolute bottom-2 right-2 bg-background rounded-full p-1">
                    <Shield className="h-6 w-6 text-green-500 fill-green-500/20" />
                  </div>
                )}
              </div>

              {/* Name & Basic Info */}
              <div className="flex-1 text-center md:text-left mt-2 md:mt-0 md:pb-2">
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
                  {profile.full_name}
                  {profile.trust_seller_badge && (
                    <Award className="h-6 w-6 text-yellow-500" />
                  )}
                </h1>
                
                <div className="flex flex-col md:flex-row items-center gap-2 text-muted-foreground mt-1">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">@{profile.mck_id}</span>
                  <span className="hidden md:inline">•</span>
                  <span>{profile.university}</span>
                </div>

                {/* Date Joined */}
                {profile.created_at && (
                   <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 justify-center md:justify-start">
                     <Calendar className="h-3 w-3" />
                     <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                   </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-2 w-full md:w-auto">
                 {/* <Button className="flex-1 md:flex-none shadow-sm" onClick={handleMessage}>
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                 </Button> */}
                 <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="icon"
                   className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                   onClick={() => setReportModalOpen(true)}
                 >
                   <AlertTriangle className="h-4 w-4" />
                 </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto md:mx-0">
               <div className="text-center md:text-left border-r last:border-0 md:border-none">
                 <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold">{sellerRating.avg}</span>
                 </div>
                 <p className="text-xs text-muted-foreground">{sellerRating.count} Ratings</p>
               </div>
               
               <div className="text-center md:text-left border-r last:border-0 md:border-none">
                 <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">{profile.deals_completed}</span>
                 </div>
                 <p className="text-xs text-muted-foreground">Deals Done</p>
               </div>

               <div className="text-center md:text-left">
                 <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <Trophy className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold">{profile.campus_points}</span>
                 </div>
                 <p className="text-xs text-muted-foreground">Campus Points</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. TABS for Listings */}
        <Tabs defaultValue="items" className="w-full">
          <div className="flex items-center justify-between mb-4">
             <TabsList className="bg-background border h-12 p-1 shadow-sm">
                <TabsTrigger value="items" className="px-6 text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  Items <Badge variant="secondary" className="ml-2 bg-muted-foreground/10">{listings.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pgs" className="px-6 text-base data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600">
                  PGs / Rooms <Badge variant="secondary" className="ml-2 bg-muted-foreground/10">{pgListings.length}</Badge>
                </TabsTrigger>
             </TabsList>
          </div>

          {/* ITEM LISTINGS TAB */}
          <TabsContent value="items" className="mt-0">
            {listings.length === 0 ? (
              <EmptyState icon={Package} text="No items listed yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {listings.map((item) => (
                  <ItemCard key={item.id} item={item} onClick={() => navigate(`/item/${item.id}`)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* PG LISTINGS TAB */}
          <TabsContent value="pgs" className="mt-0">
             {pgListings.length === 0 ? (
               <EmptyState icon={Home} text="No properties listed yet." />
             ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pgListings.map((pg) => (
                  <PGCard key={pg.id} pg={pg} onClick={() => navigate(`/pg/${pg.id}`)} />
                ))}
              </div>
             )}
          </TabsContent>
        </Tabs>

      </div>

      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="seller"
        targetId={profile?.user_id}
        targetName={profile?.full_name}
      />
    </div>
  );
};

// --- Sub-Components for cleaner code ---

const EmptyState = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <Card className="border-dashed shadow-sm">
    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted p-4 rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium text-foreground">{text}</p>
    </CardContent>
  </Card>
);

const ItemCard = ({ item, onClick }: { item: Item, onClick: () => void }) => (
  <Card 
    className={`group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${item.is_sold ? 'opacity-75 grayscale' : ''}`}
    onClick={onClick}
  >
    <div className="aspect-square relative bg-muted">
      {item.images?.[0] ? (
        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
      ) : (
        <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/20" /></div>
      )}
      {item.is_sold && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="font-bold text-white tracking-widest border-2 border-white px-3 py-1">SOLD</span></div>}
      <Badge variant="secondary" className="absolute bottom-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm shadow-sm flex items-center gap-1">
        <Clock className="h-3 w-3" /> {formatRelativeTime(item.created_at)}
      </Badge>
    </div>
    <CardContent className="p-3">
      <h3 className="font-medium truncate mb-1">{item.title}</h3>
      <div className="flex items-center justify-between">
        <span className="font-bold">₹{item.price}</span>
        <Badge variant="outline" className="text-[10px] h-5">{item.condition}</Badge>
      </div>
    </CardContent>
  </Card>
);

const PGCard = ({ pg, onClick }: { pg: PGListing, onClick: () => void }) => {
  const isRented = pg.status === 'rented';
  return (
    <Card className="cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-primary/50" onClick={onClick}>
      <div className="aspect-video relative bg-muted">
         {pg.images?.[0] ? (
            <img src={pg.images[0]} alt="Property" className="w-full h-full object-cover" />
         ) : (
            <div className="flex h-full items-center justify-center"><Home className="h-10 w-10 text-muted-foreground/20" /></div>
         )}
         <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600">{pg.property_type.toUpperCase()}</Badge>
         {isRented && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><span className="text-xl font-bold text-muted-foreground">No Longer Available</span></div>}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
             <div className="text-xl font-bold text-primary">₹{pg.rent_per_month}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
             <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" /> {pg.area_locality}
             </div>
          </div>
          <Badge variant="outline">{pg.sharing_type} Share</Badge>
        </div>
      </CardContent>
    </Card>
  )
};

export default PublicProfile;
