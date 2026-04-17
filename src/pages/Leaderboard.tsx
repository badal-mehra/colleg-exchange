// Leaderboard.tsx - REDESIGNED: Enhanced Gamification & UI/UX

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
  TrendingUp
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

// --- Custom Components ---

const RankBadge: React.FC<{ rank: number }> = React.memo(({ rank }) => {
  const styles = {
    1: { bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', icon: Crown, ring: 'ring-yellow-400/50' },
    2: { bg: 'bg-gradient-to-br from-slate-300 to-slate-500', icon: ShieldCheck, ring: 'ring-slate-400/50' },
    3: { bg: 'bg-gradient-to-br from-orange-400 to-red-500', icon: Award, ring: 'ring-orange-400/50' },
  };

  const currentStyle = styles[rank as keyof typeof styles];
  if (!currentStyle) return null;
  const Icon = currentStyle.icon;

  return (
    <div className={`absolute -top-5 left-1/2 transform -translate-x-1/2 
      z-10 w-12 h-12 rounded-full flex items-center justify-center 
      shadow-xl ${currentStyle.bg} border-2 border-white/20 ring-4 ${currentStyle.ring} animate-in zoom-in duration-500`}>
      <Icon className="h-6 w-6 text-white drop-shadow-md" strokeWidth={2.5} />
    </div>
  );
});

const TopRankCard: React.FC<{ entry: LeaderboardEntry; rank: number; onClick: () => void }> = React.memo(({ entry, rank, onClick }) => {
  const isChampion = rank === 1;

  const rankStyles = {
    1: { 
      wrapper: 'scale-105 z-10',
      bg: 'bg-gradient-to-b from-yellow-500/10 via-background to-background', 
      border: 'border-yellow-500/50',
      text: 'from-yellow-400 to-yellow-600'
    },
    2: { 
      wrapper: 'mt-4 sm:mt-8',
      bg: 'bg-gradient-to-b from-slate-400/10 via-background to-background', 
      border: 'border-slate-400/30',
      text: 'from-slate-400 to-slate-600'
    },
    3: { 
      wrapper: 'mt-4 sm:mt-8',
      bg: 'bg-gradient-to-b from-orange-500/10 via-background to-background', 
      border: 'border-orange-500/30',
      text: 'from-orange-400 to-orange-600'
    },
  };

  const style = rankStyles[rank as keyof typeof rankStyles];

  return (
    <Card 
      onClick={onClick} 
      className={`group cursor-pointer p-6 flex flex-col items-center text-center
        transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl 
        border-2 ${style.border} ${style.bg} ${style.wrapper}
        w-full relative min-h-[320px] overflow-visible`}
    >
      <RankBadge rank={rank} />
      
      <div className={`mt-8 mb-4 transition-transform duration-300 group-hover:scale-110 ${isChampion ? 'w-28 h-28' : 'w-24 h-24'} flex-shrink-0 relative`}>
        <Avatar className={`h-full w-full border-4 ${style.border} shadow-lg`}>
          <AvatarImage src={entry.avatar_url || undefined} alt={entry.full_name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {entry.full_name?.charAt(0) || <UserIcon className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>
        {entry.trust_seller_badge && (
           <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-md">
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 p-1 h-8 w-8 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 fill-white text-white" />
              </Badge>
           </div>
        )}
      </div>
      
      <div className="min-w-0 mb-4 w-full">
        <h3 className={`font-bold truncate ${isChampion ? 'text-2xl' : 'text-xl'}`}>{entry.full_name}</h3>
        <p className="text-sm text-muted-foreground truncate">{entry.university || 'Campus Member'}</p>
      </div>

      <div className="mt-auto flex flex-col items-center w-full bg-background/50 rounded-xl p-3 border border-border/50">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">Campus Points</div>
        <div className={`font-black bg-clip-text text-transparent bg-gradient-to-r ${style.text} text-4xl`}>
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
      className="group flex items-center justify-between p-4 mb-3 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer hover:bg-primary/5"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
          <span className="text-lg font-bold text-muted-foreground group-hover:text-primary">#{index}</span>
        </div>

        <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-transparent group-hover:border-primary/20 transition-all">
          <AvatarImage src={entry.avatar_url || undefined} alt={entry.full_name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {entry.full_name?.charAt(0) || <UserIcon className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold truncate group-hover:text-primary transition-colors">{entry.full_name}</h3>
            {entry.trust_seller_badge && (
                <Zap className="h-4 w-4 text-blue-500 fill-blue-500/20" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{entry.university || 'Campus Member'}</p>
        </div>
      </div>

      <div className="flex flex-col items-end text-right pl-4">
        <div className="text-xl font-black text-foreground">{entry.campus_points.toLocaleString()}</div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pts</div>
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
  const [globalRank, setGlobalRank] = useState<number | null>(null); 
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  
  const handleCardClick = useCallback((entry: LeaderboardEntry) => {
    if (!entry.mck_id) {
        toast({ 
            title: "Profile Unavailable", 
            description: "User profile link is missing. Please try again later.", 
            variant: "destructive" 
        });
        return;
    }
    navigate(`/profile/${entry.mck_id}`);
  }, [navigate, toast]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    // Simulated fetch for structure - replace with your actual Supabase calls
    const [{ data: boardData, error: boardError }, { data: userData }] = await Promise.all([
      supabase.rpc('get_monthly_leaderboard'),
      supabase.auth.getUser(),
    ]);

    if (boardError) {
      toast({ title: 'Error', description: 'Failed to load leaderboard', variant: 'destructive' });
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
    if (globalRank) {
      const targetRank = globalRank;
      if (targetRank <= MAX_VISIBLE_RANKS) {
        setVisibleCount(Math.min(targetRank - 3 + 5, leaderboard.length - 3));
        setTimeout(() => {
            document.getElementById(`rank-${targetRank}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  };

  // Filter logic
  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (entry.university && entry.university.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topThree = filteredLeaderboard.slice(0, 3);
  const remainingRanks = filteredLeaderboard.slice(3, 3 + visibleCount);
  const hasMoreToLoad = filteredLeaderboard.length > 3 + visibleCount && searchQuery === "";

  // Gamification: Points needed to overtake next rank
  let pointsToNext = 0;
  if (globalRank && globalRank > 1 && leaderboard.length >= globalRank) {
      const myPoints = leaderboard[globalRank - 1].campus_points;
      const nextRankPoints = leaderboard[globalRank - 2].campus_points;
      pointsToNext = nextRankPoints - myPoints + 1;
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-sans">
      
      {/* Hero Header */}
      <div className="bg-primary/5 border-b border-border/50 pt-8 pb-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-6 hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2 flex items-center gap-3">
                        <Trophy className="h-10 w-10 text-yellow-500" />
                        Campus Leaderboard
                    </h1>
                    <p className="text-lg text-muted-foreground">Compete, trade, and climb the monthly ranks.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search students or campus..." 
                        className="pl-10 h-12 rounded-full border-primary/20 bg-background shadow-sm focus-visible:ring-primary/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
          </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 max-w-5xl">
        
        {/* --- The Podium --- */}
        {!loading && topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
            {topThree[1] && <div className="order-2 md:order-1"><TopRankCard entry={topThree[1]} rank={2} onClick={() => handleCardClick(topThree[1])} /></div>}
            {topThree[0] && <div className="order-1 md:order-2 z-10"><TopRankCard entry={topThree[0]} rank={1} onClick={() => handleCardClick(topThree[0])} /></div>}
            {topThree[2] && <div className="order-3 md:order-3"><TopRankCard entry={topThree[2]} rank={3} onClick={() => handleCardClick(topThree[2])} /></div>}
          </div>
        )}

        {/* --- The List --- */}
        {!loading && remainingRanks.length > 0 && (
          <div className="space-y-2 mb-12">
             <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Top Competitors
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
              <Button onClick={() => setVisibleCount(prev => prev + LOAD_INCREMENT)} variant="outline" className="w-full mt-6 py-6 border-dashed border-2">
                Load More Standings
              </Button>
            )}
          </div>
        )}

        {/* --- Empty State --- */}
        {!loading && filteredLeaderboard.length === 0 && (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed shadow-sm">
                <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground mb-1">No rankers found</h3>
                <p className="text-sm text-muted-foreground/70">Try adjusting your search query.</p>
            </div>
        )}

        {/* --- Gamified Info Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <Card className="bg-primary/5 border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" /> How to Earn Points
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Complete a Sale', pts: '+10', color: 'text-green-500', bg: 'bg-green-500/10' },
                        { label: 'Make a Purchase', pts: '+5', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Get ID Verified', pts: '+20', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-background border">
                            <span className="font-medium text-sm">{item.label}</span>
                            <Badge variant="secondary" className={`${item.bg} ${item.color} font-bold`}>{item.pts}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="bg-primary/5 border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" /> Monthly Rewards
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {[
                        { label: '1st Place', reward: 'Campus Ambassador Status', icon: '🥇' },
                        { label: '2nd Place', reward: 'Elite Member Badge', icon: '🥈' },
                        { label: '3rd Place', reward: 'Top Contributor Perks', icon: '🥉' },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3 items-center p-3 rounded-xl bg-background border">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                                <div className="font-bold text-sm">{item.label}</div>
                                <div className="text-xs text-muted-foreground">{item.reward}</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

      </div>

      {/* --- Gamified Sticky Footer --- */}
      {globalRank !== null && globalRank > 3 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-10 pointer-events-none">
          <div className="max-w-md mx-auto bg-foreground text-background p-4 rounded-2xl shadow-2xl flex items-center justify-between pointer-events-auto border border-white/10">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <span className="text-xl font-black text-primary">#{globalRank}</span>
                </div>
                <div>
                    <div className="text-sm font-semibold opacity-90">Your Rank</div>
                    {pointsToNext > 0 ? (
                        <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> {pointsToNext} pts to rank up!
                        </div>
                    ) : (
                        <div className="text-xs opacity-70">Keep going!</div>
                    )}
                </div>
            </div>
            
            {globalRank <= MAX_VISIBLE_RANKS && (
                 <Button size="icon" onClick={handleJumpToRank} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-10 w-10">
                    <Locate className="h-4 w-4" />
                 </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
