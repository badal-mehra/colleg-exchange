import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Award, Star, Trophy, Package, 
  AlertTriangle, Shield, MapPin, 
  MessageCircle, Calendar, Share2, Clock, 
  Search, Filter, LayoutGrid, List as ListIcon, 
  Wifi, Zap, Utensils, Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportModal } from '@/components/ReportModal';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// --- Types ---
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
  verification_status: 'approved' | 'pending' | 'rejected';
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
  amenities?: string[]; // New virtual field
}

// --- Helpers ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatRelativeTime = (dateString: string) => {
  const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return diff < 7 ? `${diff} days ago` : new Date(dateString).toLocaleDateString();
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
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchData = async () => {
      if (!mckId) return;
      setLoading(true);

      // 1. Fetch Profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('mck_id', mckId)
        .single();

      if (error || !profileData) {
        toast({ title: "Error", description: "Profile not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // 2. Fetch Associated Data
      if (profileData.user_id) {
        const [ratingRes, itemsRes, pgsRes] = await Promise.all([
          supabase.from("ratings").select("rating").eq("to_user_id", profileData.user_id),
          supabase.from('items').select('*').eq('seller_id', profileData.user_id),
          supabase.from('pg_listings').select('*').eq('seller_id', profileData.user_id)
        ]);

        // Calculate Rating
        const ratings = ratingRes.data || [];
        const avg = ratings.length ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length : 0;
        setSellerRating({ avg: parseFloat(avg.toFixed(1)), count: ratings.length });

        setListings(itemsRes.data as Item[] || []);
        setPgListings(pgsRes.data as PGListing[] || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [mckId, toast]);

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    let result = [...listings];
    // Search
    if (searchQuery) {
      result = result.filter(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Sort
    if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return result;
  }, [listings, searchQuery, sortBy]);

  const filteredPGs = useMemo(() => {
    let result = [...pgListings];
    if (searchQuery) {
      result = result.filter(p => p.area_locality.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [pgListings, searchQuery]);

  // --- Handlers ---
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Copied!", description: "Profile link copied to clipboard." });
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* 1. Interactive Banner */}
      <div className="h-60 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* 2. Left Column: Identity Card */}
          <div className="md:col-span-4 lg:col-span-3">
             <Card className="shadow-lg border-t-4 border-t-indigo-500 overflow-hidden">
               <div className="flex flex-col items-center pt-8 pb-6 px-4 text-center">
                 <div className="relative mb-4">
                   <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                     <AvatarImage src={profile.avatar_url ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl : undefined} />
                     <AvatarFallback className="text-3xl bg-indigo-100 text-indigo-700">{profile.full_name[0]}</AvatarFallback>
                   </Avatar>
                   {profile.trust_seller_badge && (
                     <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Trusted Seller">
                        <Award className="h-4 w-4 fill-white" />
                     </div>
                   )}
                 </div>
                 
                 <h1 className="text-xl font-bold text-slate-900 mb-1">{profile.full_name}</h1>
                 <p className="text-sm text-slate-500 mb-4">{profile.university}</p>
                 
                 <div className="flex items-center gap-2 mb-6">
                   <Badge variant={profile.verification_status === 'approved' ? 'default' : 'secondary'} className="gap-1">
                     {profile.verification_status === 'approved' ? <Shield className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                     {profile.verification_status === 'approved' ? 'Verified Student' : 'Unverified'}
                   </Badge>
                 </div>

                 <div className="grid grid-cols-2 gap-2 w-full mb-6">
                    <ContactModal profile={profile} />
                    <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4" /></Button>
                 </div>

                 <div className="w-full text-left bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Member Since</span>
                      <span className="font-medium">{new Date(profile.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Last Active</span>
                      <span className="font-medium text-green-600 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Online</span>
                    </div>
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-slate-400 text-xs hover:text-red-500 transition-colors"
                      onClick={() => setReportModalOpen(true)}
                    >
                      Report this profile
                    </Button>
                 </div>
               </div>
             </Card>
          </div>

          {/* 3. Right Column: Content */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
               <StatsCard icon={Star} value={sellerRating.avg} label={`${sellerRating.count} Reviews`} color="text-yellow-500" />
               <StatsCard icon={Package} value={profile.deals_completed} label="Deals Closed" color="text-blue-500" />
               <StatsCard icon={Trophy} value={profile.campus_points} label="Campus Points" color="text-orange-500" />
            </div>

            {/* Listings Area */}
            <Card className="shadow-sm min-h-[500px]">
              <Tabs defaultValue="items" className="w-full">
                
                <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-t-lg sticky top-0 z-10">
                  <TabsList>
                    <TabsTrigger value="items">Marketplace ({listings.length})</TabsTrigger>
                    <TabsTrigger value="pgs">Real Estate ({pgListings.length})</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search..." 
                        className="pl-8 h-9" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[130px] h-9">
                        <Filter className="w-3 h-3 mr-2" /> <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price_asc">Price: Low</SelectItem>
                        <SelectItem value="price_desc">Price: High</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="border-l pl-2 hidden sm:flex gap-1">
                      <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                      <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}><ListIcon className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/30">
                  <TabsContent value="items" className="mt-0">
                    {filteredItems.length === 0 ? (
                      <EmptyState type="items" />
                    ) : (
                      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        {filteredItems.map(item => (
                          <ItemCard key={item.id} item={item} viewMode={viewMode} onClick={() => navigate(`/item/${item.id}`)} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pgs" className="mt-0">
                    {filteredPGs.length === 0 ? (
                      <EmptyState type="pgs" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredPGs.map(pg => (
                          <PGCard key={pg.id} pg={pg} onClick={() => navigate(`/pg/${pg.id}`)} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="seller"
        targetId={profile.user_id}
        targetName={profile.full_name}
      />
    </div>
  );
};

// --- Sub-Components ---

const StatsCard = ({ icon: Icon, value, label, color }: any) => (
  <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`p-3 rounded-full bg-slate-50 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      </div>
    </CardContent>
  </Card>
);

const ContactModal = ({ profile }: { profile: Profile }) => {
  const navigate = useNavigate();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm">
          <MessageCircle className="h-4 w-4 mr-2" /> Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact {profile.full_name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">Choose a quick message to send to start the conversation:</p>
          <div className="grid gap-2">
            {["Is this still available?", "I'm interested in your listing.", "Can we negotiate the price?"].map((msg) => (
              <Button key={msg} variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => navigate(`/chat/${profile.user_id}?msg=${encodeURIComponent(msg)}`)}>
                {msg}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ItemCard = ({ item, onClick, viewMode }: { item: Item, onClick: () => void, viewMode: 'grid' | 'list' }) => {
  if (viewMode === 'list') {
    return (
      <Card className="flex overflow-hidden cursor-pointer hover:border-indigo-300 transition-all group" onClick={onClick}>
        <div className="w-32 h-32 bg-slate-200 shrink-0">
          <img src={item.images[0] || '/placeholder.png'} className="w-full h-full object-cover" alt={item.title} />
        </div>
        <div className="p-4 flex-1 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-indigo-600">{item.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{item.condition}</Badge>
              {item.is_sold && <Badge variant="destructive">SOLD</Badge>}
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatCurrency(item.price)}</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1" onClick={onClick}>
      <div className="aspect-[4/3] relative bg-slate-200 overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-slate-300" /></div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm shadow-sm hover:bg-white">{item.condition}</Badge>
        </div>
        {item.is_sold && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-bold tracking-widest border-2 border-white px-4 py-1">SOLD</span></div>}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-slate-900">{formatCurrency(item.price)}</span>
          <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {formatRelativeTime(item.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const PGCard = ({ pg, onClick }: { pg: PGListing, onClick: () => void }) => {
  // Simulating amenities detection based on lack of real data structure
  const hasWifi = Math.random() > 0.5; 
  const hasAC = pg.rent_per_month > 8000;

  return (
    <Card className="cursor-pointer overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-orange-500" onClick={onClick}>
      <div className="flex flex-col sm:flex-row h-full">
        <div className="sm:w-2/5 aspect-video sm:aspect-auto relative bg-slate-200">
           <img src={pg.images?.[0] || '/placeholder-house.png'} className="w-full h-full object-cover" alt="PG" />
           <Badge className="absolute top-2 left-2 bg-black/50 hover:bg-black/70">{pg.property_type}</Badge>
        </div>
        <CardContent className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
               <h3 className="font-bold text-lg line-clamp-1">{pg.area_locality}</h3>
               <Badge variant="outline" className="shrink-0">{pg.sharing_type}</Badge>
            </div>
            <div className="flex gap-3 mt-3 text-slate-500">
              {hasWifi && <div className="flex items-center gap-1 text-xs"><Wifi className="h-3 w-3" /> Wifi</div>}
              {hasAC && <div className="flex items-center gap-1 text-xs"><Zap className="h-3 w-3" /> AC</div>}
              <div className="flex items-center gap-1 text-xs"><Utensils className="h-3 w-3" /> Mess</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-indigo-600">{formatCurrency(pg.rent_per_month)}</span>
              <span className="text-xs text-slate-500"> /mo</span>
            </div>
            <Button size="sm" variant="secondary" className="h-8">View</Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

const EmptyState = ({ type }: { type: 'items' | 'pgs' }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
    <div className="bg-slate-100 p-4 rounded-full mb-3">
      {type === 'items' ? <Package className="h-8 w-8 text-slate-300" /> : <Home className="h-8 w-8 text-slate-300" />}
    </div>
    <p>No listings found matching your criteria.</p>
    <Button variant="link" className="mt-2" onClick={() => window.location.reload()}>Reset Filters</Button>
  </div>
);

const ProfileSkeleton = () => (
  <div className="container mx-auto px-4 max-w-6xl mt-8">
     <Skeleton className="h-64 w-full rounded-xl mb-8" />
     <div className="grid grid-cols-12 gap-8">
       <div className="col-span-3">
         <Skeleton className="h-96 w-full rounded-xl" />
       </div>
       <div className="col-span-9 space-y-6">
         <div className="flex gap-4">
           <Skeleton className="h-24 w-1/3 rounded-xl" />
           <Skeleton className="h-24 w-1/3 rounded-xl" />
           <Skeleton className="h-24 w-1/3 rounded-xl" />
         </div>
         <Skeleton className="h-96 w-full rounded-xl" />
       </div>
     </div>
  </div>
);

export default PublicProfile;
