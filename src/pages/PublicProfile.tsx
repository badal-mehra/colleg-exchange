import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Award, Star, Trophy, Package, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportModal } from '@/components/ReportModal';

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

const PublicProfile = () => {
  const { mckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 hover-scale">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="mb-8 glass-effect">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-white">
                  {profile.full_name?.charAt(0) || <UserIcon className="h-16 w-16" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold gradient-text">{profile.full_name || 'Anonymous User'}</h1>
                  {profile.verification_status === 'approved' && (
                    <Badge className="bg-success/10 text-success border-success/20 w-fit mx-auto md:mx-0">
                      ✓ Verified Student
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-mono text-primary">{profile.mck_id}</p>
                  {profile.university && (
                    <p className="text-muted-foreground">{profile.university}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{profile.campus_points}</span>
                    <span className="text-sm text-muted-foreground">Points</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg">
                    <Star className="h-5 w-5 text-accent" />
                    <span className="font-semibold">{profile.deals_completed}</span>
                    <span className="text-sm text-muted-foreground">Deals</span>
                  </div>

                  {profile.trust_seller_badge && (
                    <Badge className="bg-warning/10 text-warning border-warning/20 flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Trusted Seller
                    </Badge>
                  )}
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setReportModalOpen(true)}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Report User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Listings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Active Listings ({listings.filter(item => !item.is_sold).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No listings yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover-scale transition-all"
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
                          <Badge variant="secondary">SOLD</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">₹{item.price}</span>
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
