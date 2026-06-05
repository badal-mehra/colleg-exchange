// Leaderboard.tsx - PWA Optimized & Premium Badges

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  TrendingUp,
  Share2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
const SCROLL_THRESHOLD = 300;

// --- Custom Components ---

const RankBadge: React.FC<{ rank: number }> = React.memo(({ rank }) => {
  // Ultra-premium metallic styles
  const styles = {
    1: { 
      gradient: 'from-[#FFDF00] via-[#D4AF37] to-[#996515]', // True Gold
      icon: Crown, 
      glow: 'shadow-[0_0_25px_rgba(255,223,0,0.6)]',
      border: 'border-[#FFF080]',
      text: 'text-[#5A3A00]', // Dark gold/brown for contrast
      pulse: 'bg-yellow-400/40'
    },
    2: { 
      gradient: 'from-[#F5F7FA] via-[#C3CFE2] to-[#9BA4B5]', // Icy Silver
      icon: ShieldCheck, 
      glow: 'shadow-[0_0_20px_rgba(195,207,226,0.6)]',
      border: 'border-white',
      text: 'text-slate-700',
      pulse: 'bg-slate-300/40'
    },
    3: { 
      gradient: 'from-[#E3A857] via-[#C9843B] to-[#8C521A]', // Deep Bronze
      icon: Award, 
      glow: 'shadow-[0_0_20px_rgba(201,132,59,0.6)]',
      border: 'border-[#FAD6A5]',
      text: 'text-orange-950',
      pulse: 'bg-orange-600/30'
    },
  };

  const currentStyle = styles[rank as keyof typeof styles];
  if (!currentStyle) return null;
  const Icon = currentStyle.icon;

  return (
    <div className="absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 z-20">
      
      {/* 1. Breathing Animated Aura */}
      <div className={`absolute inset-0 rounded-full animate-pulse blur-md scale-125 md:scale-150 ${currentStyle.pulse}`} />
      
      {/* 2. Physical Medal Body (Reacts to Card Hover) */}
      <div className={`
        relative flex items-center justify-center 
        w-14 h-14 md:w-16 md:h-16 
        rounded-full 
        bg-gradient-to-br ${currentStyle.gradient}
        border-[3px] ${currentStyle.border}
        ${currentStyle.glow}
        transition-all duration-500 ease-out
        group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3
      `}>
        {/* Subtle inner premium texture */}
        <div className="absolute inset-1 rounded-full border border-white/40 border-dashed opacity-70" />
        
        {/* Shimmer overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 rounded-full" />
        
        {/* Main Icon */}
        <Icon className={`relative z-10 w-7 h-7 md:w-8 md:h-8 ${currentStyle.text} drop-shadow-md`} strokeWidth={2.5} />
      </div>
      
      {/* 3. Floating Rank Pill */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 
                      bg-background/95 backdrop-blur-md border border-border/50 shadow-md 
                      rounded-full px-3 py-0.5 
                      text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground
                      transition-transform duration-500 group-hover:scale-105">
         #{rank}
      </div>
    </div>
  );
});

const TopRankCard: React.FC<{ entry: LeaderboardEntry; rank: number; onClick: () => void }> = React.memo(({ entry, rank, onClick }) => {
  const isChampion = rank === 1;

  const rankStyles = {
    1: { 
      wrapper: 'md:scale-105 z-10',
      bg: 'bg-gradient-to-b from-yellow-500/15 via-card to-card', 
      border: 'border-yellow-500/50',
      text: 'from-yellow-400 to-yellow-600'
    },
    2: { 
      wrapper: 'md:mt-8',
      bg: 'bg-gradient-to-b from-slate-400/15 via-card to-card', 
      border: 'border-slate-400/30',
      text: 'from-slate-400 to-slate-600'
    },
    3: { 
      wrapper: 'md:mt-8',
      bg: 'bg-gradient-to-b from-orange-500/15 via-card to-card', 
      border: 'border-orange-500/30',
      text: 'from-orange-400 to-orange-600'
    },
  };

  const style = rankStyles[rank as keyof typeof rankStyles];

  return (
    <Card 
      onClick={onClick} 
      // The "group" class here is CRITICAL for the medal hover physics to work
      className={`group relative flex flex-col items-center text-center p-4 md:p-6 cursor-pointer
        transition-transform duration-200 active:scale-[0.97] md:hover:-translate-y-2 md:hover:shadow-2xl 
        border-2 ${style.border} ${style.bg} ${style.wrapper}
        w-full min-h-[220px] md:min-h-[320px] shadow-lg mt-6 md:mt-0`}
    >
      <RankBadge rank={rank} />
      
      <div className={`mt-6 md:mt-8 mb-3 ${isChampion ? 'w-20 h-20 md:w-28 md:h-28' : 'w-16 h-16 md:w-24 md:h-24'} flex-shrink-0 relative transition-transform duration-500 group-hover:scale-105`}>
        <Avatar className={`h-full w-full border-[3px] md:border-4 ${style.border} shadow-md`}>
          <AvatarImage src={entry.avatar_url || undefined} alt={entry.full_name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-xl md:text-2xl font-bold">
            {entry.full_name?.charAt(0) || <UserIcon className="h-6 w-6 md:h-8 md:w-8" />}
          </AvatarFallback>
        </Avatar>
        {entry.trust_seller_badge && (
           <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-background rounded-full p-0.5 shadow-md">
              <div className="bg-blue-500 p-1 md:p-1.5 h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 md:h-4 md:w-4 fill-white text-white" />
              </div>
           </div>
        )}
      </div>
      
      <div className="min-w-0 mb-3 w-full">
        <h3 className={`font-bold truncate ${isChampion ? 'text-lg md:text-2xl' : 'text-base md:text-xl'}`}>{entry.full_name}</h3>
        <p className="text-xs md:text-sm text-muted-foreground truncate">{entry.university || 'Campus Member'}</p>
      </div>

      <div className="mt-auto flex flex-col items-center w-full bg-background/50 rounded-lg md:rounded-xl p-2 md:p-3 border border-border/50">
        <div className="text-[10px] md:text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-0.5">Points</div>
        <div className={`font-black bg-clip-text text-transparent bg-gradient-to-r ${style.text} text-2xl md:text-4xl leading-none`}>
            {entry.campus_points.toLocaleString()}
        </div>
      </div>
    </Card>
  );
});

const ListItemCard: React.FC<{ entry: LeaderboardEntry; index: number; onClick: () => void }> = React.memo(({ entry, index, onClick }) => {
  return (
    <div 
      id={`rank-${index}`} 
      onClick={onClick} 
      className="flex items-center justify-between p-3 md:p-4 mb-2 md:mb-3 rounded-xl md:rounded-2xl bg-card border border-border/50 
                 active:bg-primary/10 active:scale-[0.98] md:hover:border-primary/50 md:hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
          <span className="text-sm md:text-lg font-bold text-muted-foreground">#{index}</span>
        </div>

        <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0 border border-border/50">
          <AvatarImage src={entry.avatar_url || undefined} alt={entry.full_name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {entry.full_name?.charAt(0) || <UserIcon className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm md:text-base font-bold truncate">{entry.full_name}</h3>
            {entry.trust_seller_badge && <Zap className="h-3 w-3 md:h-4 md:w-4 text-blue-500 fill-blue-500/20 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{entry.university || 'Campus Member'}</p>
        </div>
      </div>

      <div className="flex flex-col items-end text-right pl-2 flex-shrink-0">
        <div className="text-lg md:text-xl font-black text-foreground">{entry.campus_points.toLocaleString()}</div>
        <div className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Pts</div>
      </div>
    </div>
  );
});

// --- Main Leaderboard Component ---
const Leaderboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalRank, setGlobalRank] = useState<number | null>(null); 
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  
  const handleCardClick = useCallback((entry: LeaderboardEntry) => {
    if (!entry.mck_id) {
        toast({ title: "Unavailable", description: "Profile link missing.", variant: "destructive" });
        return;
    }
    navigate(`/profile/${entry.mck_id}`);
  }, [navigate, toast]);

  const fetchLeaderboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    
    const [{ data: boardData, error: boardError }, { data: userData }] = await Promise.all([
      supabase.rpc('get_monthly_leaderboard'),
      supabase.auth.getUser(),
    ]);

    if (boardError) {
      toast({ title: 'Error', description: 'Failed to load standings', variant: 'destructive' });
      setLeaderboard([]);
    } else {
      const fullList = boardData || [];
      const currentUserId = userData?.user?.id;
      if (currentUserId) {
        const userIndex = fullList.findIndex((u: any) => u.user_id === currentUserId);
        setGlobalRank(userIndex !== -1 ? userIndex + 1 : null); 
      }
      setLeaderboard(fullList.slice(0, MAX_VISIBLE_RANKS));
    }
    
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - SCROLL_THRESHOLD) {
          setVisibleCount(prev => Math.min(prev + LOAD_INCREMENT, leaderboard.length - 3));
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [leaderboard.length]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleJumpToRank = () => {
    if (globalRank && globalRank <= MAX_VISIBLE_RANKS) {
        setVisibleCount(Math.min(globalRank - 3 + 5, leaderboard.length - 3));
        setTimeout(() => {
            const el = document.getElementById(`rank-${globalRank}`);
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
    }
  };

  const handleShare = () => {
      if (navigator.share) {
          navigator.share({
              title: 'Campus Leaderboard',
              text: `I'm currently rank #${globalRank} on the Campus Leaderboard! Can you beat me?`,
              url: window.location.href,
          }).catch(console.error);
      } else {
          toast({ description: "Sharing not supported on this browser." });
      }
  };

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (entry.university && entry.university.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topThree = filteredLeaderboard.slice(0, 3);
  const remainingRanks = filteredLeaderboard.slice(3, 3 + visibleCount);
  const hasMoreToLoad = filteredLeaderboard.length > 3 + visibleCount && searchQuery === "";

  let pointsToNext = 0;
  if (globalRank && globalRank > 1 && leaderboard.length >= globalRank) {
      const myPoints = leaderboard[globalRank - 1].campus_points;
      const nextRankPoints = leaderboard[globalRank - 2].campus_points;
      pointsToNext = nextRankPoints - myPoints + 1;
  }

  return (
    <div className="min-h-screen bg-background pb-32 font-sans overflow-x-hidden pt-safe">
      
      {/* --- Sticky PWA Header --- */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 shadow-sm pt-safe-top">
         <div className="container mx-auto max-w-5xl flex items-center justify-between gap-3">
             <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-10 w-10 flex-shrink-0 active:bg-primary/10 rounded-full">
                <ArrowLeft className="h-5 w-5" />
             </Button>
             
             <div className="relative w-full max-w-md flex-grow">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                     placeholder="Search ranks..." 
                     className="pl-9 h-10 w-full rounded-full border-primary/20 bg-muted/30 text-sm focus:text-base focus-visible:ring-1"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                 />
             </div>

             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fetchLeaderboard(true)} 
                disabled={isRefreshing}
                className="h-10 w-10 flex-shrink-0 active:bg-primary/10 rounded-full"
             >
                <RefreshCw className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
             </Button>
         </div>
      </div>

      {/* --- Hero Section --- */}
      <div className="bg-primary/5 pt-6 pb-12 px-4 mb-6 md:mb-12 rounded-b-3xl">
          <div className="container mx-auto max-w-5xl text-center md:text-left flex flex-col md:flex-row items-center gap-4">
              <Trophy className="h-12 w-12 md:h-16 md:w-16 text-yellow-500 drop-shadow-sm" />
              <div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-1">Elite Rankings</h1>
                  <p className="text-sm md:text-lg text-muted-foreground">Trade, earn points, and climb to the top.</p>
              </div>
          </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* --- PWA Optimized Podium --- */}
        {!loading && topThree.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 items-end mb-8 md:mb-12 pt-4">
            
            {/* Rank 1 (Top Center on Desktop, Full Width Top on Mobile) */}
            {topThree[0] && (
               <div className="order-1 md:order-2 col-span-2 md:col-span-1 z-10">
                  <TopRankCard entry={topThree[0]} rank={1} onClick={() => handleCardClick(topThree[0])} />
               </div>
            )}
            
            {/* Rank 2 (Left on Desktop, Left Half on Mobile) */}
            {topThree[1] && (
               <div className="order-2 md:order-1 col-span-1">
                  <TopRankCard entry={topThree[1]} rank={2} onClick={() => handleCardClick(topThree[1])} />
               </div>
            )}
            
            {/* Rank 3 (Right on Desktop, Right Half on Mobile) */}
            {topThree[2] && (
               <div className="order-3 md:order-3 col-span-1">
                  <TopRankCard entry={topThree[2]} rank={3} onClick={() => handleCardClick(topThree[2])} />
               </div>
            )}
          </div>
        )}

        {/* --- The List --- */}
        {!loading && remainingRanks.length > 0 && (
          <div className="space-y-0.5 md:space-y-2 mb-10">
             <div className="flex items-center justify-between px-1 mb-3 md:mb-4">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Global Standings
                </h3>
             </div>
            {remainingRanks.map((entry, idx) => (
              <ListItemCard 
                key={entry.user_id} 
                entry={entry} 
                index={searchQuery ? filteredLeaderboard.indexOf(entry) + 1 : idx + 4} 
                onClick={() => handleCardClick(entry)} 
              />
            ))}
            
            {hasMoreToLoad && (
              <Button 
                 onClick={() => setVisibleCount(prev => prev + LOAD_INCREMENT)} 
                 variant="outline" 
                 className="w-full mt-4 md:mt-6 py-6 md:py-8 border-dashed border-2 active:bg-muted rounded-2xl"
              >
                Load More
              </Button>
            )}
          </div>
        )}

        {/* --- Empty State --- */}
        {!loading && filteredLeaderboard.length === 0 && (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed shadow-sm">
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground mb-1">No rankers found</h3>
                <p className="text-sm text-muted-foreground/70">Try adjusting your search query.</p>
            </div>
        )}

        {/* --- Mobile-Friendly Info Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Card className="bg-muted/30 border-none shadow-sm rounded-2xl">
                <CardHeader className="p-4 md:p-6 pb-2">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" /> Earning Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-2">
                    {[
                        { label: 'Sale', pts: '+10', color: 'text-green-500 bg-green-500/10' },
                        { label: 'Purchase', pts: '+5', color: 'text-blue-500 bg-blue-500/10' },
                        { label: 'ID Verification', pts: '+20', color: 'text-purple-500 bg-purple-500/10' },
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                            <span className="font-medium text-sm md:text-base">{item.label}</span>
                            <Badge variant="secondary" className={`${item.color} font-bold text-xs`}>{item.pts}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

      </div>

      {/* --- PWA Sticky Footer (Accounts for iOS Safe Area) --- */}
      {globalRank !== null && globalRank > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom pt-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none mb-4 md:mb-6">
          <div className="max-w-md mx-auto bg-foreground text-background p-3 md:p-4 rounded-2xl shadow-2xl flex items-center justify-between pointer-events-auto border border-white/10">
            
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <span className="text-lg md:text-xl font-black text-primary">#{globalRank}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-semibold opacity-90">Your Rank</span>
                    {pointsToNext > 0 ? (
                        <span className="text-[10px] md:text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> {pointsToNext} to rank up
                        </span>
                    ) : (
                        <span className="text-[10px] md:text-xs opacity-70">You're at the top!</span>
                    )}
                </div>
            </div>
            
            <div className="flex gap-2">
                 {/* Share Button (Native Mobile Feel) */}
                 <Button size="icon" variant="secondary" onClick={handleShare} className="rounded-full h-10 w-10 md:h-12 md:w-12 active:scale-95 text-foreground bg-background/20 hover:bg-background/30 border-0">
                    <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                 </Button>

                 {/* Jump to Rank Button */}
                 {globalRank <= MAX_VISIBLE_RANKS && globalRank > 3 && (
                     <Button size="icon" onClick={handleJumpToRank} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-10 w-10 md:h-12 md:w-12 active:scale-95 border-0">
                        <Locate className="h-4 w-4 md:h-5 md:w-5" />
                     </Button>
                 )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
