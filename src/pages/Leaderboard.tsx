// Leaderboard.tsx - Fully Optimized, Fully Responsive, All Devices Friendly

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
  User as UserIcon,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// --- Types ---
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  university: string;
  campus_points: number;
  trust_seller_badge: boolean;
  avatar_url?: string | null;
  mck_id?: string;
}

// --- Rank Badge ---
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const styles = {
    1: { bg: 'bg-gradient-to-br from-yellow-600 to-yellow-300', icon: Crown },
    2: { bg: 'bg-gradient-to-br from-gray-500 to-gray-200', icon: ShieldCheck },
    3: { bg: 'bg-gradient-to-br from-amber-700 to-amber-400', icon: Award }
  };

  const Icon = styles[rank].icon;

  return (
    <div className={`absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 
      z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center 
      shadow-lg ${styles[rank].bg} border-2 border-white/50`}>
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={3} />
    </div>
  );
};

// --- Top Rank Card ---
const TopRankCard: React.FC<{ entry: LeaderboardEntry; rank: number }> = ({ entry, rank }) => {
  const rankStyles = {
    1: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
    2: { border: 'border-gray-400/30', bg: 'bg-gray-400/10' },
    3: { border: 'border-amber-600/30', bg: 'bg-amber-600/10' }
  };

  const avatarUrl = entry.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(entry.avatar_url).data.publicUrl
    : undefined;

  return (
    <Card
      className={`p-4 sm:p-6 flex flex-col items-center text-center relative 
      border-2 ${rankStyles[rank].border} ${rankStyles[rank].bg} 
      w-full min-h-[260px] sm:min-h-[340px]`}
    >
      <RankBadge rank={rank} />

      <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mt-6 border-4 border-white shadow-md">
        <AvatarImage src={avatarUrl} className="object-cover" />
        <AvatarFallback className="bg-primary/80 text-white text-xl">
          {entry.full_name?.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <h3 className="font-bold text-lg sm:text-xl mt-4 truncate">{entry.full_name}</h3>
      <p className="text-xs text-muted-foreground truncate">{entry.university || entry.mck_id}</p>

      <Separator className="w-1/2 my-3" />

      <div className="font-extrabold text-4xl sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
        {entry.campus_points}
      </div>
      <div className="text-xs text-muted-foreground">Campus Points</div>

      {entry.trust_seller_badge && (
        <Badge className="mt-3 bg-yellow-500 text-white font-semibold">
          <Zap className="h-3 w-3 mr-1" /> Trusted Seller
        </Badge>
      )}
    </Card>
  );
};

// --- Rank 4+ Card ---
const ListItemCard: React.FC<{ entry: LeaderboardEntry; index: number }> = ({ entry, index }) => {
  const avatarUrl = entry.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(entry.avatar_url).data.publicUrl
    : undefined;

  return (
    <Card className="p-3 sm:p-4 flex items-center justify-between hover:shadow-md transition">
      {/* Left */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <span className="text-lg sm:text-xl font-extrabold text-muted-foreground w-8 text-center">
          #{index + 1}
        </span>

        <Avatar className="h-10 w-10 border border-primary/20">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {entry.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{entry.full_name}</h3>
            {entry.trust_seller_badge && (
              <Badge className="text-yellow-600 border-yellow-500/50 bg-yellow-500/10 h-5 px-1 text-xs">
                <Zap className="h-3 w-3" />
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{entry.university || entry.mck_id}</p>
        </div>
      </div>

      {/* Right */}
      <div className="text-right">
        <div className="text-xl font-bold text-primary">{entry.campus_points}</div>
        <div className="text-xs text-muted-foreground">Points</div>
      </div>
    </Card>
  );
};

// --- MAIN COMPONENT ---
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
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard',
        variant: 'destructive'
      });
    } else {
      setLeaderboard(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-full max-w-md p-6 space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mb-10 text-center sm:text-left">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              Campus Elite Leaderboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Monthly top performers</p>
          </div>

          <div className="w-20 sm:w-24"></div>
        </div>

        {/* Top 3 */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">

            {/* Rank 1 - Center on desktop */}
            <div className="order-1 sm:order-2">
              <TopRankCard entry={topThree[0]} rank={1} />
            </div>

            {/* Rank 2 */}
            {topThree[1] && (
              <div className="order-2 sm:order-1">
                <TopRankCard entry={topThree[1]} rank={2} />
              </div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <div className="order-3 sm:order-3">
                <TopRankCard entry={topThree[2]} rank={3} />
              </div>
            )}
          </div>
        )}

        {/* Ranks 4+ */}
        {remaining.length > 0 && (
          <Card className="mt-10 bg-card shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Trophy className="h-5 w-5" /> All Other Ranks
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {remaining.map((entry, i) => (
                <ListItemCard key={entry.user_id} entry={entry} index={i + 3} />
              ))}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default Leaderboard;
