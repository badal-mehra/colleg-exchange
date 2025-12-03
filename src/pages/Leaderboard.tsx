// Leaderboard.tsx - ABSOLUTE FINAL: Strict MCK-ID Enforcement

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Award,
  Star,
  Target,
  ArrowLeft,
  Crown,
  Zap,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  Locate,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton'; 

// --- Interfaces & Types ---
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  university: string;
  campus_points: number;
  trust_seller_badge: boolean;
  avatar_url?: string | null;
  mck_id?: string;
}

// --- Constants ---
const LOAD_INCREMENT = 10;
const MAX_VISIBLE_RANKS = 99;
const SCROLL_THRESHOLD = 200;

// --- Custom Components (Unchanged) ---
/**
 * Custom Rank Badge Component for the Top 3
 */
const RankBadge: React.FC<{ rank: number }> = React.memo(({ rank }) => {
  const styles = {
    1: { color: 'text-yellow-400', bg: 'bg-gradient-to-br from-yellow-600 to-yellow-300', icon: Crown },
    2: { color: 'text-gray-400', bg: 'bg-gradient-to-br from-gray-500 to-gray-200', icon: ShieldCheck },
    3: { color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-700 to-amber-400', icon: Award },
  };

  const currentStyle = styles[rank];
  const Icon = currentStyle.icon;

  if (rank > 3) return null;

  return (
    <div className={`absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 
      z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center 
      shadow-lg ${currentStyle.bg} border-2 border-white/50 ring-2 ring-background`}>
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={3} />
    </div>
  );
});

/**
 * Renders the custom card for the top 3 users (The Podium).
 */
const TopRankCard: React.FC<{ entry: LeaderboardEntry; rank: number; onClick: () => void }> = React.memo(({ entry, rank, onClick }) => {
  
  const isChampion = rank === 1;

  const rankStyles = {
    1: { 
      color: 'text-yellow-500', 
      bg: 'bg-gradient-to-br from-yellow-500/10 to-yellow-400/5', 
      border: 'border-yellow-500/50', 
      scale: 'scale-[1.03] sm:scale-[1.05] shadow-2xl ring-4 ring-yellow-500/30' 
    },
    2: { 
      color: 'text-gray-400', 
      bg: 'bg-gradient-to-br from-gray-400/10 to-gray-300/5', 
      border: 'border-gray-400/30', 
      scale: 'shadow-lg' 
    },
    3: { 
      color: 'text-amber-600', 
      bg: 'bg-gradient-to-br from-amber-600/10 to-amber-500/5', 
      border: 'border-amber-600/30', 
      scale: 'shadow-lg' 
    },
  };

  const currentStyle = rankStyles[rank];

  const avatarUrl = entry.avatar_url || undefined;


  return (
    <Card 
      onClick={onClick} 
      className={`cursor-pointer p-4 sm:p-6 flex flex-col items-center text-center
        transition-all duration-500 transform hover:shadow-2xl 
        ${currentStyle.scale} border-2 ${currentStyle.border} ${currentStyle.bg}
        w-full relative min-h-[280px] sm:min-h-[340px]`}
    >
      <RankBadge rank={rank} />
      
      <div className={`mt-6 sm:mt-8 mb-4 ${isChampion ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24'} flex-shrink-0`}>
        <Avatar className={`h-full w-full border-4 ${currentStyle.border}`}>
          <AvatarImage src={avatarUrl} alt={entry.full_name} className="object-cover" />
          <AvatarFallback className="bg-primary/80 text-white text-2xl">
            {entry.full_name?.charAt(0) || <UserIcon className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="min-w-0 mb-3">
        <h3 className={`font-bold truncate text-lg sm:text-xl ${isChampion ? 'sm:text-2xl' : ''}`}>{entry.full_name}</h3>
        <p className="text-sm text-muted-foreground truncate">{entry.university || entry.mck_id}</p>
      </div>

      <Separator className="w-1/2 mb-3 bg-border/50" />

      <div className="flex flex-col items-center">
        <div className={`font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 mb-1 ${isChampion ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}>{entry.campus_points}</div>
        <div className="text-sm font-medium text-muted-foreground">Campus Points</div>
      </div>
      
      {entry.trust_seller_badge && (
        <Badge variant="default" className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
          <Zap className="h-3 w-3 mr-1 fill-white" /> Trusted Seller
        </Badge>
      )}
    </Card>
  );
});


/**
 * Renders the streamlined list item for ranks 4 onwards.
 */
const ListItemCard: React.FC<{ entry: LeaderboardEntry; index: number; onClick: () => void }> = React.memo(({ entry, index, onClick }) => {
  const avatarUrl = entry.avatar_url || undefined;
  
  return (
    <Card 
      id={`rank-${index + 1}`} 
      onClick={onClick} 
      className="cursor-pointer p-3 sm:p-4 border-border hover:border-primary/30 transition-all duration-200 hover:shadow-md bg-card/90"
    >
      <div className="flex items-center justify-between">
        {/* LEFT: Rank, Avatar, Info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-8 flex-shrink-0 text-center">
            <span className="text-xl font-extrabold text-muted-foreground">#{index + 1}</span>
          </div>

          <Avatar className="h-10 w-10 flex-shrink-0 border border-primary/20">
            <AvatarImage src={avatarUrl} alt={entry.full_name} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary">
              {entry.full_name?.charAt(0) || <UserIcon className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold truncate">{entry.full_name}</h3>
              {entry.trust_seller_badge && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-500/50 bg-yellow-500/10 h-5 px-1.5 text-xs">
                  <Zap className="h-3 w-3" />
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{entry.university || entry.mck_id}</p>
          </div>
        </div>

        {/* RIGHT: Points */}
        <div className="flex flex-col items-end text-right min-w-0 pl-4">
          <div className="text-2xl font-bold text-primary">{entry.campus_points}</div>
          <div className="text-xs text-muted-foreground">Points</div>
        </div>
      </div>
    </Card>
  );
});

// --- Skeleton Components for UX (Unchanged) ---
const TopRankCardSkeleton: React.FC = () => (
  <Card className="p-4 sm:p-6 flex flex-col items-center text-center w-full min-h-[280px] sm:min-h-[340px] relative">
    <Skeleton className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
    <Skeleton className="mt-8 mb-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
    <Skeleton className="w-3/4 h-6 mb-2" />
    <Skeleton className="w-1/2 h-4 mb-3" />
    <Separator className="w-1/2 mb-3 bg-border/50" />
    <Skeleton className="w-1/3 h-8" />
    <Skeleton className="w-1/4 h-3 mt-1" />
  </Card>
);

const ListItemCardSkeleton: React.FC = () => (
  <Card className="p-3 sm:p-4 border-border bg-card/90">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <Skeleton className="w-8 h-6" />
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="min-w-0 space-y-1">
          <Skeleton className="w-40 h-4" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
      <div className="flex flex-col items-end text-right pl-4">
        <Skeleton className="w-12 h-6" />
        <Skeleton className="w-10 h-3" />
      </div>
    </div>
  </Card>
);

const LeaderboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 max-w-7xl mx-auto">
    <div className="flex justify-between items-center mb-10">
      <Skeleton className="w-40 h-8" />
      <div className="text-center">
        <Skeleton className="w-80 h-10 mx-auto mb-2" />
        <Skeleton className="w-60 h-6 mx-auto" />
      </div>
      <div className="w-40 h-8 hidden sm:block"></div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch mb-10">
      <TopRankCardSkeleton />
      <TopRankCardSkeleton />
      <TopRankCardSkeleton />
    </div>

    <Card className="shadow-2xl border-t-4 border-primary/50 bg-card/95">
      <CardHeader className="py-4 px-6 border-b border-border/50">
        <Skeleton className="w-48 h-6" />
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => <ListItemCardSkeleton key={i} />)}
      </CardContent>
    </Card>
  </div>
);


// --- Main Leaderboard Component ---
const Leaderboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]); 
  const [loading, setLoading] = useState(true);
  const [globalRank, setGlobalRank] = useState<number | null>(null); 
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT); 
  const [pendingJumpRank, setPendingJumpRank] = useState<number | null>(null);
  const [disableAutoLoad, setDisableAutoLoad] = useState(false); 

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  
  const handleCardClick = useCallback((entry: LeaderboardEntry) => {
    // 🔥 CRITICAL FIX: Strict MCK-ID enforcement. No fallback to user_id.
    if (!entry.mck_id) {
        console.error("Missing mck_id for this user. Cannot open profile.");
        toast({ 
            title: "Profile Unavailable", 
            description: "User profile link is currently missing a public ID. Please try again later.", 
            variant: "destructive" 
        });
        return;
    }
    
    navigate(`/profile/${entry.mck_id}`);
  }, [navigate, toast]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    const [{ data: boardData, error: boardError }, { data: userData }] = await Promise.all([
      supabase.rpc('get_monthly_leaderboard'),
      supabase.auth.getUser(),
    ]);

    if (boardError) {
      console.error('Error fetching leaderboard:', boardError);
      toast({ title: 'Error', description: 'Failed to load leaderboard', variant: 'destructive' });
      setLeaderboard([]);
    } else {
      const fullList = boardData || [];
      
      const currentUserId = userData?.user?.id;
      if (currentUserId) {
        const userIndex = fullList.findIndex(u => u.user_id === currentUserId);
        setGlobalRank(userIndex !== -1 ? userIndex + 1 : null); 
      }

      setLeaderboard(fullList.slice(0, MAX_VISIBLE_RANKS));
    }
    setLoading(false);
  };

  // Effect to watch for DOM update and then scroll 
  useEffect(() => {
    if (pendingJumpRank) {
      const el = document.getElementById(`rank-${pendingJumpRank}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setPendingJumpRank(null);

        // Re-enable auto-scroll after a delay to ensure jump-scroll has settled
        setTimeout(() => setDisableAutoLoad(false), 500); 
      }
    }
  }, [visibleCount, pendingJumpRank]); 


  // Auto-load on scroll with Debounce
  useEffect(() => {
    if (loading || leaderboard.length <= 3 + visibleCount) return;
    
    const handleScroll = () => {
      // Guard to prevent auto-loading when smooth scroll is active (e.g., from jump button)
      if (disableAutoLoad) return; 

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - SCROLL_THRESHOLD) {
          setVisibleCount(prev => Math.min(prev + LOAD_INCREMENT, leaderboard.length - 3));
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [loading, leaderboard.length, visibleCount, disableAutoLoad]);


  useEffect(() => {
    fetchLeaderboard();
  }, []);

  /**
   * Scroll function for "Jump to My Rank" button
   */
  const handleJumpToRank = () => {
    if (globalRank && globalRank > 3) {
      const targetRank = globalRank;
      
      // 1. Temporarily disable auto-loading
      setDisableAutoLoad(true);

      // 2. Expand list to include the target rank if it's within 99
      if (targetRank <= MAX_VISIBLE_RANKS) {
        // Set visible count to include the target rank + 5 buffer
        const newVisibleCount = Math.min(targetRank - 3 + 5, leaderboard.length - 3); 
        setVisibleCount(newVisibleCount);

        // 3. Set the pending jump rank. Effect will handle the scroll after render.
        setPendingJumpRank(targetRank);
      } else {
        // If rank is > 99, the sticky card is shown, but we can't jump to a non-existent list item.
        // We ensure auto-load is re-enabled if no scroll is triggered.
        setTimeout(() => setDisableAutoLoad(false), 500);
      }
    }
  };


  if (loading) {
    return <LeaderboardSkeleton />; 
  }

  const topThree = leaderboard.slice(0, 3);
  const remainingRanksToDisplay = leaderboard.slice(3, 3 + visibleCount);
  const totalRanksFetched = leaderboard.length;
  const hasMoreToLoad = totalRanksFetched > 3 + visibleCount;

  // Check if user's rank is between 4 and 99, and is NOT currently visible
  const showJumpButton = globalRank && globalRank > 3 && globalRank <= MAX_VISIBLE_RANKS && globalRank > 3 + visibleCount;


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 bg-dot-pattern pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header & Back Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between items-center mb-10 text-center sm:text-left">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:bg-primary/10 transition duration-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 mb-2 tracking-tight">
              Campus Elite Leaderboard
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground/80 font-medium">Monthly Top Performers - Ranked by Campus Points</p>
          </div>
          
          <div className="w-24 hidden sm:block"></div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="space-y-10">
          
          {/* 🥇 The Podium (Top 3) */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
              {topThree[0] && (
                <div className="order-1 sm:order-2">
                  <TopRankCard entry={topThree[0]} rank={1} onClick={() => handleCardClick(topThree[0])} />
                </div>
              )}
              {topThree[1] && (
                <div className="order-2 sm:order-1">
                  <TopRankCard entry={topThree[1]} rank={2} onClick={() => handleCardClick(topThree[1])} />
                </div>
              )}
              {topThree[2] && (
                <div className="order-3 sm:order-3">
                  <TopRankCard entry={topThree[2]} rank={3} onClick={() => handleCardClick(topThree[2])} />
                </div>
              )}
            </div>
          )}

          {/* Fallback for No Data */}
          {leaderboard.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border/50 shadow-inner">
              <Trophy className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-2 text-muted-foreground">Leaderboard is empty</h3>
              <p className="text-base text-muted-foreground">Be the first to start earning points and claim the #1 spot!</p>
            </div>
          )}
          
          {/* 🏆 Ranks 4+ List */}
          {remainingRanksToDisplay.length > 0 && (
            <Card className="shadow-2xl border-t-4 border-primary/50 bg-card/95">
              <CardHeader className="py-4 px-6 border-b border-border/50">
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" /> Ranks 4 - {3 + remainingRanksToDisplay.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {remainingRanksToDisplay.map((entry, index) => (
                  <ListItemCard 
                    key={entry.user_id} 
                    entry={entry} 
                    index={index + 3} 
                    onClick={() => handleCardClick(entry)} 
                  />
                ))}
                
                {/* Manual Load More Button */}
                {hasMoreToLoad && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => setVisibleCount(prev => Math.min(prev + LOAD_INCREMENT, totalRanksFetched - 3))}
                      variant="outline"
                      className="text-primary hover:bg-primary/10 border-primary/50"
                    >
                      Load More
                    </Button>
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMoreToLoad && remainingRanksToDisplay.length > 0 && (
                   <div className="text-center py-4 text-sm text-muted-foreground">
                       You've reached the end of the Top {MAX_VISIBLE_RANKS}
                   </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rewards & Points Section (Unchanged) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Exclusive Monthly Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="font-bold text-yellow-600 dark:text-yellow-400">🥇 1st Place</div>
                  <div className="text-sm text-foreground text-right">₹500 Campus Voucher + Premium Badge</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-400/10 border border-gray-400/20">
                  <div className="font-bold text-gray-600 dark:text-gray-400">🥈 2nd Place</div>
                  <div className="text-sm text-foreground text-right">₹300 Campus Voucher</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-600/10 border border-amber-600/20">
                  <div className="font-bold text-amber-600 dark:text-amber-400">🥉 3rd Place</div>
                  <div className="text-sm text-foreground text-right">₹200 Campus Voucher</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-muted/30 to-background border-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Target className="h-5 w-5 text-primary" /> Campus Points Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Earning Points */}
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-1 text-primary">
                        <Sparkles className='h-4 w-4' /> Earning Points
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className='flex justify-between'>Complete a sale: <span className="font-medium text-green-500">+10 points</span></li>
                      <li className='flex justify-between'>Make a purchase: <span className="font-medium text-blue-500">+5 points</span></li>
                      <li className='flex justify-between'>Get verified: <span className="font-medium text-yellow-500">+20 points</span></li>
                      <li className='flex justify-between'>First listing: <span className="font-medium text-indigo-500">+15 points</span></li>
                    </ul>
                  </div>
                  {/* Badges & Rewards */}
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-1 text-primary">
                        <Trophy className='h-4 w-4' /> Unlocks & Rewards
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className='flex justify-between'>7+ deals: <span className="font-medium text-yellow-500">Trusted Seller Badge</span></li>
                      <li className='flex justify-between'>Top 3 monthly: <span className="font-medium text-green-500">Cash Vouchers</span></li>
                      <li className='flex justify-between'>100+ points: <span className="font-medium text-blue-500">Premium Features</span></li>
                      <li className='flex justify-between'>500+ points: <span className="font-medium text-yellow-600">VIP Status</span></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky "My Rank" Card (Appears if rank > 3) */}
      {globalRank !== null && globalRank > 3 && (
        <div className={`fixed bottom-0 md:bottom-4 left-0 md:left-1/2 md:transform md:-translate-x-1/2 w-full md:w-auto 
            bg-primary text-primary-foreground p-4 md:rounded-xl shadow-2xl z-50 transition-all duration-300
            block`} 
        >
          <div className="flex justify-between items-center text-lg font-medium max-w-lg mx-auto md:min-w-[300px]">
            <span className="flex items-center gap-2">
                <Crown className="h-5 w-5 fill-primary-foreground" /> Your Global Rank
            </span>
            <span className="font-extrabold text-2xl">#{globalRank}</span>
          </div>
        </div>
      )}

      {/* Floating "Jump to My Rank" Button */}
      {showJumpButton && (
        <Button
            onClick={handleJumpToRank}
            className="fixed bottom-20 right-4 md:bottom-20 md:right-8 z-50 rounded-full h-12 w-12 p-0 shadow-lg 
                       bg-blue-500 hover:bg-blue-600 text-white animate-bounce-slow"
        >
            <Locate className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default Leaderboard;
