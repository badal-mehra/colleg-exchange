import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Award, Star, Trophy, Package, User as UserIcon, AlertTriangle, Shield, CheckCircle } from 'lucide-react'; // Added Shield, CheckCircle
import { useToast } from '@/hooks/use-toast';
import { ReportModal } from '@/components/ReportModal';
import { Separator } from '@/components/ui/separator'; // Added Separator

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
}

// ⭐ ADDED: Fetch Rating Utility - Common Function
const fetchUserRating = async (userId: string) => {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("to_user_id", userId);

  if (error || !data) return { avg: 0, count: 0 };

  const count = data.length;
  const avg =
    count === 0
      ? 0
      : data.reduce((sum, item) => sum + item.rating, 0) / count;

  return { avg: parseFloat(avg.toFixed(1)), count };
};

const PublicProfile = () => {
  const { mckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  // ADDED: State for Seller Rating
  const [sellerRating, setSellerRating] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    fetchProfileAndListings();
  }, [mckId]);

  const fetchProfileAndListings = async () => {
    if (!mckId) return;

    setLoading(true);
    
    // Fetch profile by MCK-ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('mck_id', mckId)
      .single();

    if (profileError || !profileData) {
      toast({
        title: "Error",
        description: "Profile not found",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setProfile(profileData);
    
    // ADDED: Fetch Rating
    if (profileData.user_id) {
      const rating = await fetchUserRating(profileData.user_id);
      setSellerRating(rating);
    }
    // END ADDED: Fetch Rating
    
    // Fetch user's listings
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', profileData.user_id)
      .order('created_at', { ascending: false });

    if (!itemsError && itemsData) {
      setListings(itemsData);
    }

    setLoading(false);
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">The profile you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(profile.avatar_url);
  const activeListings = listings.filter(item => !item.is_sold);

  return (
    <div className="min-h-screen bg-background"> {/* Cleaned up background */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-2 text-destructive border-destructive hover:bg-destructive/10"
          >
            <AlertTriangle className="h-4 w-4" />
            Report User
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-10 p-6 shadow-xl border-t-4 border-primary">
          <CardContent className="p-0">
            <div className="flex flex-col items-center text-center">
              
              <div className="relative mb-4">
                <Avatar className="h-36 w-36 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl || undefined} alt={profile.full_name} />
                  <AvatarFallback className="text-5xl bg-primary text-primary-foreground">
                    {profile.full_name?.charAt(0) || <UserIcon className="h-20 w-20" />}
                  </AvatarFallback>
                </Avatar>
                {profile.verification_status === 'approved' && (
                  <div className="absolute bottom-0 right-0">
                    <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center border-2 border-white">
                      <Shield className="h-5 w-5 text-white fill-success" />
                    </div>
                  </div>
                )}
              </div>

              <h1 className="text-4xl font-extrabold text-foreground mb-1">
                {profile.full_name || 'Anonymous Seller'}
              </h1>
              
              <p className="text-md text-muted-foreground font-mono mb-4">
                {profile.mck_id}
              </p>
              
              {profile.university && (
                <p className="text-lg text-secondary-foreground mb-4">
                  {profile.university}
                </p>
              )}

              {/* Status and Badges Section */}
              <div className="flex flex-wrap gap-4 mt-2 justify-center">
                
                {/* Verification Badge */}
                {profile.verification_status === 'approved' && (
                  <Badge className="bg-success text-success-foreground px-4 py-1 text-sm flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Verified Student
                  </Badge>
                )}

                {/* Trusted Seller Badge */}
                {profile.trust_seller_badge && (
                  <Badge variant="outline" className="text-warning border-warning px-4 py-1 text-sm flex items-center gap-1">
                    <Award className="h-4 w-4 fill-warning" />
                    Trusted Seller
                  </Badge>
                )}

              </div>
              
              <Separator className="my-6 w-full max-w-md" />

              {/* Metric Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-xl">
                
                {/* Seller Rating */}
                <div className="flex flex-col items-center p-3 border rounded-lg bg-yellow-500/5">
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500 mb-1" />
                  <span className="text-2xl font-bold text-yellow-500">
                    {sellerRating.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    ({sellerRating.count} Reviews)
                  </span>
                </div>
                
                {/* Deals Completed */}
                <div className="flex flex-col items-center p-3 border rounded-lg bg-primary/5">
                  <Package className="h-6 w-6 text-primary mb-1" />
                  <span className="text-2xl font-bold text-primary">
                    {profile.deals_completed}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Deals Completed
                  </span>
                </div>
                
                {/* Campus Points */}
                <div className="flex flex-col items-center p-3 border rounded-lg bg-secondary/5">
                  <Trophy className="h-6 w-6 text-secondary mb-1" />
                  <span className="text-2xl font-bold text-secondary-foreground">
                    {profile.campus_points}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Campus Points
                  </span>
                </div>
                
              </div>
              
            </div>
          </CardContent>
        </Card>

        {/* Listings Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-primary" />
              Active Listings <Badge variant="secondary">{activeListings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg font-medium">This seller has no active listings yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Increased grid to 4 columns */}
                {listings.map((item) => (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${item.is_sold ? 'opacity-60 border-dashed hover:opacity-100 hover:shadow-none' : 'hover:scale-[1.02]'}`}
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      {item.is_sold && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="secondary" className="text-lg font-bold">SOLD</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2 text-base">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">₹{item.price}</span>
                        {item.condition && (
                          <Badge variant="outline" className="text-xs">{item.condition}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Modal */}
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

export default PublicProfile;
