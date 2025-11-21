// Leaderboard.tsx - Cleaned & Fixed Version (Sales/Revenue/Deals Removed)
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Medal,
  Award,
  Star,
  Target,
  ArrowLeft,
  Crown,
  Zap,
  User as UserIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  university: string;
  campus_points: number;
  trust_seller_badge: boolean;
  avatar_url?: string | null;
  mck_id?: string;
}

const Leaderboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_monthly_leaderboard');

    if (error) {
      console.error('Error fetching leaderboard:', error);
      toast({ title: 'Error', description: 'Failed to load leaderboard', variant: 'destructive' });
    } else {
      setLeaderboard(data || []);
    }
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getRankCardClass = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/10 via-yellow-400/10 to-yellow-500/10 border-yellow-500/30';
      case 1:
        return 'bg-gradient-to-r from-gray-400/10 via-gray-300/10 to-gray-400/10 border-gray-400/30';
      case 2:
        return 'bg-gradient-to-r from-amber-600/10 via-amber-500/10 to-amber-600/10 border-amber-600/30';
      default:
        return 'bg-card border-border hover:border-primary/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover-scale">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/60 rounded-2xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Campus Leaderboard
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">Top performers ranked by Campus Points 🏆</p>
          </div>

          {/* Rewards Section */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Monthly Rewards & Perks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-400/10 rounded-lg border border-yellow-500/20">
                  <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="font-semibold text-yellow-600 dark:text-yellow-400">🥇 1st Place</div>
                  <div className="text-sm text-muted-foreground">₹500 Campus Voucher + Premium Badge</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-gray-400/10 to-gray-300/10 rounded-lg border border-gray-400/20">
                  <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="font-semibold text-gray-600 dark:text-gray-400">🥈 2nd Place</div>
                  <div className="text-sm text-muted-foreground">₹300 Campus Voucher</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-amber-600/10 to-amber-500/10 rounded-lg border border-amber-600/20">
                  <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="font-semibold text-amber-600 dark:text-amber-400">🥉 3rd Place</div>
                  <div className="text-sm text-muted-foreground">₹200 Campus Voucher</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No data yet</h3>
              <p className="text-muted-foreground">Start earning points to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <Card key={entry.user_id} className={`${getRankCardClass(index)} hover:shadow-lg transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* LEFT SIDE */}
                      <div className="flex items-start md:items-center gap-4 min-w-0">
                        <div className="flex items-center justify-center w-12 h-12">
                          {getRankIcon(index)}
                        </div>

                        <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-primary/20">
                          <AvatarImage
                            src={entry.avatar_url ? `${supabase.storage.from('avatars').getPublicUrl(entry.avatar_url).data.publicUrl}` : undefined}
                            alt={entry.full_name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                            {entry.full_name?.charAt(0) || <UserIcon className="h-7 w-7" />}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold truncate">{entry.full_name}</h3>
                            {entry.trust_seller_badge && (
                              <Badge variant="secondary" className="bg-gradient-to-r from-warning/20 to-warning/10 text-warning">
                                <Zap className="h-3 w-3 mr-1" /> Trusted Seller
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{entry.university || entry.mck_id}</p>
                        </div>
                      </div>

                      {/* RIGHT SIDE — Only Campus Points */}
                      <div className="flex flex-col items-center md:items-end text-right min-w-0">
                        <div className="text-3xl font-bold text-primary truncate">{entry.campus_points}</div>
                        <div className="text-xs text-muted-foreground truncate">Campus Points</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* How Points Work */}
          <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> How Campus Points Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Earning Points 🎯</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Complete a sale: <span className="text-success font-medium">+10 points</span></li>
                    <li>• Make a purchase: <span className="text-primary font-medium">+5 points</span></li>
                    <li>• Get verified: <span className="text-warning font-medium">+20 points</span></li>
                    <li>• First listing: <span className="text-info font-medium">+15 points</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Badges & Rewards 🏅</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 7+ deals: <span className="text-warning font-medium">Trusted Seller Badge</span></li>
                    <li>• Top 3 monthly: <span className="text-success font-medium">Cash Vouchers</span></li>
                    <li>• 100+ points: <span className="text-primary font-medium">Premium Features</span></li>
                    <li>• 500+ points: <span className="text-warning font-medium">VIP Status</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
