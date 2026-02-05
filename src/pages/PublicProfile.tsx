import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, Award, Star, Trophy, Package, User as UserIcon, 
  AlertTriangle, Shield, CheckCircle, Home, MapPin, 
  MessageCircle, Calendar, Share2, Search, Filter,
  ExternalLink, Copy, ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportModal } from '@/components/ReportModal';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  created_at?: string;
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

// Generates a unique gradient background based on the user's name
const generateGradient = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c1 = `hsl(${hash % 360}, 70%, 50%)`;
  const c2 = `hsl(${(hash + 80) % 360}, 70%, 40%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};

// Generates initials (e.g. "John Doe" -> "JD")
const getInitials = (name: string) => {
  if (!name) return "U";
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const fetchUserRating = async (userId: string) => {
  const { data, error } = await supabase.from("ratings").select("rating").eq("to_user_id", userId);
  if (error || !data) return { avg: 0, count: 0 };
  const count = data.length;
  const avg = count === 0 ? 0 : data.reduce((sum, item) => sum + item.rating, 0) / count;
  return { avg: parseFloat(avg.toFixed(1)), count };
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
  
  if (diffInHours < 24) return 'New today';
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

const PublicProfile = () => {
  const { mckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Item[]>([]);
  const [pgListings, setPgListings] = useState<PGListing[]>([]);
  const [sellerRating, setSellerRating] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  useEffect(() => {
    fetchProfileAndListings();
    window.scrollTo(0, 0); 
  }, [mckId]);

  const fetchProfileAndListings = async () => {
    if (!mckId) return;
    setLoading(true);
    
    // Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('mck_id', mckId)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);
    
    // Parallel Fetching
    if (profileData.user_id) {
      const [ratingRes, itemsRes, pgsRes] = await Promise.all([
        fetchUserRating(profileData.user_id),
        supabase.from('items').select('*').eq('seller_id', profileData.user_id).order('created_at', { ascending: false }),
        supabase.from('pg_listings').select('*').eq('seller_id', profileData.user_id).order('created_at', { ascending: false })
      ]);

      setSellerRating(ratingRes);
      if (itemsRes.data) setListings(itemsRes.data as Item[]);
      if (pgsRes.data) setPgListings(pgsRes.data as PGListing[]);
    }
    setLoading(false);
  };

  // --- FIXED AVATAR URL LOGIC ---
  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath || avatarPath === 'null') return undefined; // Return undefined to trigger Fallback
    if (avatarPath.startsWith('http')) return avatarPath;
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  const handleShare = async () => {
    const shareData = {
      title: `${profile?.full_name}'s Profile`,
      text: `Check out items from ${profile?.full_name} on MyCampusKart!`,
      url: window.location.href
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Error sharing:', err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Profile link copied to clipboard." });
    }
  };

  // --- Filter Logic ---
  const filteredItems = useMemo(() => {
    let items = listings.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.is_sold
    );
    if (sortBy === 'price_asc') items.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') items.sort((a, b) => b.price - a.price);
    return items;
  }, [listings, searchQuery, sortBy]);

  // --- Loading Skeleton ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-48 bg-muted animate-pulse" />
        <div className="container max-w-5xl px-4 -mt-20">
          <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <div className="flex gap-4 items-end">
              <div className="h-32 w-32 rounded-full bg-muted animate-pulse border-4 border-background" />
              <div className="space-y-2 mb-2 flex-1">
                <div className="h-8 w-1/2 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <UserIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-semibold">User not found</h2>
        <Button variant="link" onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      
      {/* 1. Dynamic Identity Banner */}
      <div 
        className="h-48 md:h-64 w-full relative overflow-hidden"
        style={{ background: generateGradient(profile.full_name || 'User') }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="container mx-auto px-4 py-6 relative z-10">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-24 relative z-10">
        
        {/* 2. Main Profile Card */}
        <Card className="mb-8 shadow-xl border-none overflow-hidden backdrop-blur-sm bg-card/95">
          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              
              {/* Avatar Section */}
              <div className="relative -mt-16 md:-mt-20 group">
                <Avatar className="h-32 w-32 md:h-44 md:w-44 border-[6px] border-background shadow-xl transition-transform transform group-hover:scale-105 bg-background">
                  <AvatarImage 
                    src={getAvatarUrl(profile.avatar_url)} 
                    alt={profile.full_name} 
                    className="object-cover" 
                  />
                  <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                {profile.verification_status === 'approved' && (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                        <div className="absolute bottom-2 right-2 bg-background rounded-full p-1.5 shadow-sm ring-1 ring-border cursor-help">
                          <CheckCircle className="h-6 w-6 text-green-500 fill-green-100" />
                        </div>
                       </TooltipTrigger>
                       <TooltipContent><p>Verified Student Identity</p></TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left mt-2 md:mt-0 md:pb-4">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                    {profile.full_name}
                  </h1>
                  {profile.trust_seller_badge && (
                    <Award className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground mt-3">
                  <Badge variant="outline" className="font-normal text-sm px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                     @{profile.mck_id}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" /> {profile.university}
                  </div>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex gap-3 mb-4">
                 <Button className="shadow-lg hover:shadow-xl transition-all" onClick={() => navigate(`/chat/${profile.user_id}`)}>
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                 </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                         navigator.clipboard.writeText(window.location.href);
                         toast({ title: "Copied!", description: "Link copied to clipboard" });
                      }}>
                        <Copy className="h-4 w-4 mr-2" /> Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`https://wa.me/?text=Check out ${profile.full_name} on MyCampusKart: ${window.location.href}`, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" /> WhatsApp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setReportModalOpen(true)}>
                   <AlertTriangle className="h-4 w-4" />
                 </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto md:mx-0">
               <div className="flex flex-col items-center md:items-start p-2 rounded-lg transition-colors cursor-default">
                 <div className="flex items-center gap-2 mb-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold">{sellerRating.avg}</span>
                 </div>
                 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{sellerRating.count} Reviews</p>
               </div>
               
               <div className="flex flex-col items-center md:items-start p-2 border-l border-r md:border-x-0 rounded-lg transition-colors">
                 <div className="flex items-center gap-2 mb-1">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">{profile.deals_completed}</span>
                 </div>
                 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sold</p>
               </div>

               <div className="flex flex-col items-center md:items-start p-2 rounded-lg transition-colors">
                 <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold">{profile.campus_points}</span>
                 </div>
                 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Listings Tabs */}
        <Tabs defaultValue="items" className="w-full space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <TabsList className="h-auto p-1 bg-muted/50 border self-start">
                <TabsTrigger value="items" className="px-6 py-2 text-sm">
                  Marketplace <Badge variant="secondary" className="ml-2">{listings.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pgs" className="px-6 py-2 text-sm">
                  Properties <Badge variant="secondary" className="ml-2">{pgListings.length}</Badge>
                </TabsTrigger>
             </TabsList>

             <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search listings..." 
                    className="pl-9 bg-background h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10"><Filter className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price_asc')}>Price: Low to High</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price_desc')}>Price: High to Low</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>

          <TabsContent value="items" className="mt-0 min-h-[300px]">
            {filteredItems.length === 0 ? (
              <EmptyState 
                icon={Package} 
                title={searchQuery ? "No matches found" : "No active listings"}
                desc={searchQuery ? "Try adjusting your search terms." : "This seller hasn't listed any items recently."}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} onClick={() => navigate(`/item/${item.id}`)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pgs" className="mt-0 min-h-[300px]">
             {pgListings.length === 0 ? (
               <EmptyState icon={Home} title="No properties listed" desc="This user has no PG or Room listings available." />
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

      {/* 4. Sticky Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t p-4 z-50 md:hidden flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         <Button className="flex-1 shadow-md h-12 text-base" onClick={() => navigate(`/chat/${profile.user_id}`)}>
            <MessageCircle className="h-5 w-5 mr-2" /> Chat
         </Button>
         <Button variant="outline" size="icon" className="h-12 w-12 border-primary/20" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
         </Button>
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

// --- Sub-Components ---

const EmptyState = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">{desc}</p>
  </div>
);

const ItemCard = ({ item, onClick }: { item: Item, onClick: () => void }) => (
  <Card 
    className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-muted bg-card"
    onClick={onClick}
  >
    <div className="aspect-[4/3] relative bg-secondary/30 overflow-hidden">
      {item.images?.[0] ? (
        <img 
          src={item.images[0]} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
      ) : (
        <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/20" /></div>
      )}
      
      {/* Badges */}
      <div className="absolute top-2 left-2">
         {item.condition && <Badge className="text-[10px] bg-black/60 text-white hover:bg-black/70 border-none backdrop-blur-sm">{item.condition}</Badge>}
      </div>
      
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
         <Badge variant="secondary" className="text-[10px] bg-white/90 backdrop-blur text-black shadow-sm font-normal">
           {formatRelativeTime(item.created_at)}
         </Badge>
      </div>
    </div>
    <CardContent className="p-3">
      <h3 className="font-medium text-sm truncate mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
      <div className="flex items-center justify-between">
        <span className="font-bold text-base">₹{item.price.toLocaleString()}</span>
        <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
           <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const PGCard = ({ pg, onClick }: { pg: PGListing, onClick: () => void }) => {
  const isRented = pg.status === 'rented' || !pg.is_active;
  return (
    <Card className="cursor-pointer overflow-hidden group transition-all hover:shadow-lg border-muted" onClick={onClick}>
      <div className="aspect-video relative bg-muted overflow-hidden">
         {pg.images?.[0] ? (
            <img src={pg.images[0]} alt="Property" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
         ) : (
            <div className="flex h-full items-center justify-center"><Home className="h-10 w-10 text-muted-foreground/20" /></div>
         )}
         <div className="absolute top-2 left-2">
            <Badge className="bg-background/90 text-foreground hover:bg-background shadow-sm border-none backdrop-blur-md">
               {pg.property_type.toUpperCase()}
            </Badge>
         </div>
         {isRented && <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-[2px]"><span className="font-bold text-muted-foreground border-2 border-current px-4 py-1 rounded">RENTED</span></div>}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
             <div className="text-xl font-bold text-primary">₹{pg.rent_per_month.toLocaleString()}<span className="text-xs font-normal text-muted-foreground ml-1">/mo</span></div>
             <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" /> <span className="truncate max-w-[150px]">{pg.area_locality}</span>
             </div>
          </div>
          <Badge variant="outline" className="capitalize">{pg.sharing_type}</Badge>
        </div>
      </CardContent>
    </Card>
  )
};

export default PublicProfile;
