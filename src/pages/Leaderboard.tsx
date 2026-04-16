// Leaderboard.tsx — Mobile-First Performance Rewrite
// Changes:
//   1. Compact mobile podium (was 840px tall → now ~220px on 375px screen)
//   2. IntersectionObserver sentinel replaces window scroll listener (no main-thread jank)
//   3. Fixed sticky "My Rank" bar — cleared above PWA bottom nav (was hidden behind it)
//   4. Fixed jump button position to not clash with bottom nav
//   5. Cloudinary-optimized avatar URLs (80×80 thumbnails)
//   6. fetchLeaderboard wrapped in useCallback (stable reference)
//   7. Removed redundant showJumpButton condition
//   8. Replaced document.getElementById jump with scrollIntoView on a Map of refs
//   9. All touch targets ≥ 44px
//  10. Heading scales from text-2xl on 320px up to text-5xl on desktop

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  university: string;
  campus_points: number;
  trust_seller_badge: boolean;
  avatar_url?: string | null;
  mck_id?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const LOAD_INCREMENT   = 10;
const MAX_VISIBLE_RANKS = 99;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Optimise a Cloudinary avatar URL to a small square thumbnail.
 * Falls back to the original URL for non-Cloudinary sources.
 */
function optimiseAvatar(url: string | null | undefined, sizePx = 80): string | undefined {
  if (!url) return undefined;
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${sizePx},h_${sizePx},c_fill,g_face/`);
  }
  return url;
}

// ─── Rank Badge (top 3 medal) ──────────────────────────────────────────────────
const RankBadge: React.FC<{ rank: number }> = React.memo(({ rank }) => {
  const map: Record<number, { bg: string; Icon: typeof Crown }> = {
    1: { bg: 'bg-gradient-to-br from-yellow-600 to-yellow-300', Icon: Crown },
    2: { bg: 'bg-gradient-to-br from-gray-500  to-gray-200',   Icon: ShieldCheck },
    3: { bg: 'bg-gradient-to-br from-amber-700 to-amber-400',  Icon: Award },
  };
  const s = map[rank];
  if (!s) return null;
  const { bg, Icon } = s;
  return (
    <div
      className={`absolute -top-4 left-1/2 -translate-x-1/2 z-10
        w-9 h-9 rounded-full flex items-center justify-center
        shadow-lg ${bg} border-2 border-white/50 ring-2 ring-background`}
    >
      <Icon className="h-4 w-4 text-white" strokeWidth={3} />
    </div>
  );
});
RankBadge.displayName = 'RankBadge';

// ─── Desktop / Tablet Podium Card ─────────────────────────────────────────────
// Only shown on sm+ screens (hidden on mobile — see MobilePodium below)
const TopRankCard: React.FC<{
  entry: LeaderboardEntry;
  rank: number;
  onClick: () => void;
}> = React.memo(({ entry, rank, onClick }) => {
  const styles: Record<number, { border: string; bg: string; scale: string }> = {
    1: {
      border: 'border-yellow-500/50',
      bg:     'bg-gradient-to-br from-yellow-500/10 to-yellow-400/5',
      scale:  'scale-[1.04] shadow-2xl ring-4 ring-yellow-500/30',
    },
    2: {
      border: 'border-gray-400/30',
      bg:     'bg-gradient-to-br from-gray-400/10 to-gray-300/5',
      scale:  'shadow-lg',
    },
    3: {
      border: 'border-amber-600/30',
      bg:     'bg-gradient-to-br from-amber-600/10 to-amber-500/5',
      scale:  'shadow-lg',
    },
  };
  const s = styles[rank];

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer p-4 flex flex-col items-center text-center
        transition-all duration-300 hover:shadow-2xl
        ${s.scale} border-2 ${s.border} ${s.bg}
        w-full relative min-h-[260px]`}
    >
      <RankBadge rank={rank} />

      <div className={`mt-6 mb-3 ${rank === 1 ? 'w-20 h-20' : 'w-16 h-16'} flex-shrink-0`}>
        <Avatar className={`h-full w-full border-4 ${s.border}`}>
          <AvatarImage
            src={optimiseAvatar(entry.avatar_url, rank === 1 ? 96 : 80)}
            alt={entry.full_name}
            className="object-cover"
            loading="lazy"
          />
          <AvatarFallback className="bg-primary/80 text-white text-xl">
            {entry.full_name?.charAt(0) ?? <UserIcon className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 mb-2 px-2 w-full">
        <h3 className={`font-bold truncate ${rank === 1 ? 'text-lg' : 'text-base'}`}>
          {entry.full_name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {entry.university || entry.mck_id}
        </p>
      </div>

      <Separator className="w-1/2 mb-2 bg-border/50" />

      <div className="flex flex-col items-center">
        <div
          className={`font-extrabold bg-clip-text text-transparent
            bg-gradient-to-r from-primary to-blue-500
            ${rank === 1 ? 'text-4xl' : 'text-3xl'}`}
        >
          {entry.campus_points}
        </div>
        <div className="text-xs font-medium text-muted-foreground">Campus Points</div>
      </div>

      {entry.trust_seller_badge && (
        <Badge className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold">
          <Zap className="h-3 w-3 mr-1 fill-white" /> Trusted
        </Badge>
      )}
    </Card>
  );
});
TopRankCard.displayName = 'TopRankCard';

// ─── Mobile Podium (compact, horizontal strip) ────────────────────────────────
// Replaces the 840px-tall stacked cards with a slim 200px strip on mobile.
const MobilePodium: React.FC<{
  topThree: LeaderboardEntry[];
  onCardClick: (e: LeaderboardEntry) => void;
}> = React.memo(({ topThree, onCardClick }) => {
  // Display order: 2nd | 1st | 3rd (classic podium visual)
  const order = [
    { entry: topThree[1], rank: 2, height: 'h-[140px]' },
    { entry: topThree[0], rank: 1, height: 'h-[180px]' },
    { entry: topThree[2], rank: 3, height: 'h-[120px]' },
  ];

  const borderMap: Record<number, string> = {
    1: 'border-yellow-500/60 ring-2 ring-yellow-400/40',
    2: 'border-gray-400/40',
    3: 'border-amber-600/40',
  };

  return (
    <div className="flex items-end justify-center gap-2 px-2 mb-2">
      {order.map(({ entry, rank, height }) => {
        if (!entry) return <div key={rank} className="flex-1" />;
        return (
          <button
            key={entry.user_id}
            onClick={() => onCardClick(entry)}
            className={`flex-1 flex flex-col items-center justify-end pb-3 pt-6
              rounded-2xl border-2 bg-card/90 active:scale-95 transition-transform
              touch-manipulation relative ${height} ${borderMap[rank]}`}
          >
            <RankBadge rank={rank} />

            {/* Avatar */}
            <Avatar
              className={`mb-1.5 border-2 ${borderMap[rank]}
                ${rank === 1 ? 'h-14 w-14' : 'h-11 w-11'}`}
            >
              <AvatarImage
                src={optimiseAvatar(entry.avatar_url, rank === 1 ? 56 : 44)}
                alt={entry.full_name}
                className="object-cover"
                loading="lazy"
              />
              <AvatarFallback className="bg-primary/70 text-white text-sm">
                {entry.full_name?.charAt(0) ?? '?'}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <p className={`font-semibold truncate w-full text-center px-1
              ${rank === 1 ? 'text-sm' : 'text-xs'}`}>
              {entry.full_name.split(' ')[0]}
            </p>

            {/* Points */}
            <p className={`font-extrabold bg-clip-text text-transparent
              bg-gradient-to-r from-primary to-blue-500
              ${rank === 1 ? 'text-xl' : 'text-base'}`}>
              {entry.campus_points}
            </p>

            {entry.trust_seller_badge && (
              <Zap className="h-3 w-3 text-yellow-500 fill-yellow-400 mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
});
MobilePodium.displayName = 'MobilePodium';

// ─── List Row (rank 4+) ────────────────────────────────────────────────────────
const ListItemCard: React.FC<{
  entry: LeaderboardEntry;
  rank: number; // 1-based absolute rank
  onClick: () => void;
  innerRef?: React.Ref<HTMLDivElement>;
}> = React.memo(({ entry, rank, onClick, innerRef }) => (
  <div ref={innerRef}>
    <Card
      onClick={onClick}
      className="cursor-pointer px-3 py-3 border-border
        hover:border-primary/30 active:scale-[0.99]
        transition-all duration-150 hover:shadow-md bg-card/90
        touch-manipulation"
      // min-height 56px ensures 44px+ touch target easily
      style={{ minHeight: 56 }}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Rank + Avatar + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 flex-shrink-0 text-center text-base font-extrabold text-muted-foreground">
            #{rank}
          </span>

          <Avatar className="h-10 w-10 flex-shrink-0 border border-primary/20">
            <AvatarImage
              src={optimiseAvatar(entry.avatar_url, 40)}
              alt={entry.full_name}
              className="object-cover"
              loading="lazy"
            />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {entry.full_name?.charAt(0) ?? <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold truncate leading-tight">
                {entry.full_name}
              </h3>
              {entry.trust_seller_badge && (
                <Zap className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {entry.university || entry.mck_id}
            </p>
          </div>
        </div>

        {/* Points */}
        <div className="flex flex-col items-end flex-shrink-0 pl-2">
          <span className="text-lg font-bold text-primary leading-tight">
            {entry.campus_points}
          </span>
          <span className="text-[10px] text-muted-foreground">pts</span>
        </div>
      </div>
    </Card>
  </div>
));
ListItemCard.displayName = 'ListItemCard';

// ─── Skeletons ─────────────────────────────────────────────────────────────────
const MobilePodiumSkeleton: React.FC = () => (
  <div className="flex items-end justify-center gap-2 px-2">
    <Skeleton className="flex-1 h-[140px] rounded-2xl" />
    <Skeleton className="flex-1 h-[180px] rounded-2xl" />
    <Skeleton className="flex-1 h-[120px] rounded-2xl" />
  </div>
);

const DesktopPodiumSkeleton: React.FC = () => (
  <div className="grid grid-cols-3 gap-4">
    {[260, 260, 260].map((h, i) => (
      <Skeleton key={i} className="rounded-2xl" style={{ height: h }} />
    ))}
  </div>
);

const ListSkeleton: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-14 rounded-xl" />
    ))}
  </div>
);

const LeaderboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background px-4 pt-4 pb-28 max-w-3xl mx-auto space-y-6">
    <Skeleton className="h-8 w-40 rounded-lg" />
    <Skeleton className="h-7 w-64 mx-auto rounded-lg" />

    {/* mobile skeleton */}
    <div className="sm:hidden">
      <MobilePodiumSkeleton />
    </div>
    {/* desktop skeleton */}
    <div className="hidden sm:block">
      <DesktopPodiumSkeleton />
    </div>

    <ListSkeleton />
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const Leaderboard: React.FC = () => {
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [globalRank,  setGlobalRank]  = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT);

  // Map of rank → DOM ref for scroll-jump
  const rankRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Sentinel div at the bottom of the list — watched by IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Navigate to profile ──────────────────────────────────────────────────────
  const handleCardClick = useCallback(
    (entry: LeaderboardEntry) => {
      if (!entry.mck_id) {
        toast({
          title: 'Profile Unavailable',
          description: 'This user does not have a public profile ID yet.',
          variant: 'destructive',
        });
        return;
      }
      navigate(`/profile/${entry.mck_id}`);
    },
    [navigate, toast],
  );

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    const [{ data: boardData, error: boardError }, { data: userData }] =
      await Promise.all([
        supabase.rpc('get_monthly_leaderboard'),
        supabase.auth.getUser(),
      ]);

    if (boardError) {
      toast({ title: 'Error', description: 'Failed to load leaderboard', variant: 'destructive' });
      setLeaderboard([]);
    } else {
      const fullList: LeaderboardEntry[] = boardData ?? [];
      const uid = userData?.user?.id;
      if (uid) {
        const idx = fullList.findIndex(u => u.user_id === uid);
        setGlobalRank(idx !== -1 ? idx + 1 : null);
      }
      setLeaderboard(fullList.slice(0, MAX_VISIBLE_RANKS));
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // ── IntersectionObserver — load more when sentinel enters viewport ───────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev =>
            Math.min(prev + LOAD_INCREMENT, leaderboard.length - 3),
          );
        }
      },
      { rootMargin: '200px' }, // start loading 200px before the sentinel is visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, leaderboard.length, visibleCount]);

  // ── Jump to my rank ──────────────────────────────────────────────────────────
  const handleJumpToRank = useCallback(() => {
    if (!globalRank || globalRank <= 3 || globalRank > MAX_VISIBLE_RANKS) return;

    const newVisible = Math.min(globalRank - 3 + 5, leaderboard.length - 3);

    // Expand the list first, then scroll after next paint
    setVisibleCount(newVisible);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = rankRefs.current.get(globalRank);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }, [globalRank, leaderboard.length]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const topThree              = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const remainingToDisplay    = useMemo(
    () => leaderboard.slice(3, 3 + visibleCount),
    [leaderboard, visibleCount],
  );
  const hasMore               = leaderboard.length > 3 + visibleCount;

  // Show jump button only when rank is below currently visible list
  const showJumpButton =
    globalRank !== null &&
    globalRank > 3 &&
    globalRank <= MAX_VISIBLE_RANKS &&
    globalRank > 3 + visibleCount;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) return <LeaderboardSkeleton />;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    // pb-36 = room for sticky "My Rank" bar (64px) + PWA bottom nav (64px) + 16px gap
    <div className="min-h-screen bg-background pb-36">
      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="h-11 px-3 -ml-1 text-muted-foreground hover:bg-primary/10 flex-shrink-0"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold
              bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500
              leading-tight tracking-tight">
              Campus Elite
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
              Monthly Top Performers · Ranked by Campus Points
            </p>
          </div>
        </div>

        {/* ── Podium ─────────────────────────────────────────────────────── */}
        {topThree.length > 0 && (
          <>
            {/* Mobile — compact horizontal podium (< sm) */}
            <div className="sm:hidden">
              <MobilePodium topThree={topThree} onCardClick={handleCardClick} />
            </div>

            {/* Desktop — 3-column grid (sm+) */}
            {/* Column order: 2nd | 1st | 3rd */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4 items-stretch">
              {topThree[1] && (
                <div className="order-1">
                  <TopRankCard
                    entry={topThree[1]}
                    rank={2}
                    onClick={() => handleCardClick(topThree[1])}
                  />
                </div>
              )}
              {topThree[0] && (
                <div className="order-2">
                  <TopRankCard
                    entry={topThree[0]}
                    rank={1}
                    onClick={() => handleCardClick(topThree[0])}
                  />
                </div>
              )}
              {topThree[2] && (
                <div className="order-3">
                  <TopRankCard
                    entry={topThree[2]}
                    rank={3}
                    onClick={() => handleCardClick(topThree[2])}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {leaderboard.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border/50 rounded-2xl">
            <Trophy className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-1">
              Leaderboard is empty
            </h3>
            <p className="text-sm text-muted-foreground">
              Be the first to earn points and claim the #1 spot!
            </p>
          </div>
        )}

        {/* ── Ranks 4+ list ───────────────────────────────────────────────── */}
        {remainingToDisplay.length > 0 && (
          <Card className="shadow-xl border-t-4 border-primary/40 bg-card/95 overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border/50">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" />
                Ranks 4 – {3 + remainingToDisplay.length}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3 space-y-1.5">
              {remainingToDisplay.map((entry, i) => {
                const absoluteRank = i + 4; // ranks start at 4
                return (
                  <ListItemCard
                    key={entry.user_id}
                    entry={entry}
                    rank={absoluteRank}
                    onClick={() => handleCardClick(entry)}
                    // Attach ref so handleJumpToRank can scroll to it
                    innerRef={(el) => {
                      if (el) rankRefs.current.set(absoluteRank, el);
                      else rankRefs.current.delete(absoluteRank);
                    }}
                  />
                );
              })}

              {/* IntersectionObserver sentinel — triggers load-more automatically */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  <div className="flex gap-1 items-center text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Manual load-more fallback (for browsers without IntersectionObserver) */}
              {hasMore && (
                <noscript>
                  <Button
                    onClick={() =>
                      setVisibleCount(prev => Math.min(prev + LOAD_INCREMENT, leaderboard.length - 3))
                    }
                    variant="outline"
                    className="w-full h-11 mt-2 border-primary/40 text-primary"
                  >
                    Load More
                  </Button>
                </noscript>
              )}

              {!hasMore && remainingToDisplay.length > 0 && (
                <p className="text-center py-3 text-xs text-muted-foreground">
                  You've seen the Top {MAX_VISIBLE_RANKS} 🎉
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Rewards & Points info ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly Rewards */}
          <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-primary text-base">
                <Star className="h-4 w-4 text-yellow-500" />
                Monthly Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {[
                { medal: '🥇', place: '1st Place', reward: 'Campus Ambassador', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
                { medal: '🥈', place: '2nd Place', reward: 'Elite Intern Certificate', color: 'bg-gray-400/10 border-gray-400/20 text-gray-600 dark:text-gray-400' },
                { medal: '🥉', place: '3rd Place', reward: 'Top Contributor Certificate', color: 'bg-amber-600/10 border-amber-600/20 text-amber-600 dark:text-amber-400' },
              ].map(({ medal, place, reward, color }) => (
                <div
                  key={place}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${color}`}
                >
                  <span className="font-bold text-sm">{medal} {place}</span>
                  <span className="text-xs text-foreground text-right ml-2">{reward}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Points Breakdown */}
          <Card className="bg-gradient-to-br from-muted/30 to-background border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                Points Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-xs mb-2 flex items-center gap-1 text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Earning
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between gap-2">Complete sale <span className="font-medium text-green-500">+10</span></li>
                    <li className="flex justify-between gap-2">Make purchase <span className="font-medium text-blue-500">+5</span></li>
                    <li className="flex justify-between gap-2">Get verified <span className="font-medium text-yellow-500">+20</span></li>
                    <li className="flex justify-between gap-2">First listing <span className="font-medium text-indigo-500">+15</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-xs mb-2 flex items-center gap-1 text-primary">
                    <Trophy className="h-3.5 w-3.5" /> Unlocks
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between gap-2">7+ deals <span className="font-medium text-yellow-500">Trusted</span></li>
                    <li className="flex justify-between gap-2">Top 3 <span className="font-medium text-green-500">Award</span></li>
                    <li className="flex justify-between gap-2">100+ pts <span className="font-medium text-blue-500">Premium</span></li>
                    <li className="flex justify-between gap-2">500+ pts <span className="font-medium text-yellow-600">VIP</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>{/* /max-w-3xl */}

      {/* ── Sticky "My Rank" bar ─────────────────────────────────────────────
          Position: above PWA bottom nav (h-16 = 64px) on mobile.
          On md+, render as a floating card 4px from the bottom.
          Previous code used bottom-0 which was HIDDEN behind the bottom nav.
      ─────────────────────────────────────────────────────────────────────── */}
      {globalRank !== null && globalRank > 3 && (
        <div
          className="
            fixed bottom-16 md:bottom-4
            left-0 md:left-1/2 md:-translate-x-1/2
            w-full md:w-auto md:min-w-[300px] md:rounded-xl
            bg-primary text-primary-foreground
            px-4 py-3 md:px-6
            shadow-2xl z-40
          "
        >
          <div className="flex justify-between items-center max-w-lg mx-auto">
            <span className="flex items-center gap-2 text-base font-medium">
              <Crown className="h-5 w-5 fill-primary-foreground flex-shrink-0" />
              Your Rank
            </span>
            <span className="font-extrabold text-2xl">#{globalRank}</span>
          </div>
        </div>
      )}

      {/* ── "Jump to My Rank" FAB ─────────────────────────────────────────────
          bottom-32 on mobile = 128px = clears both bottom nav (64px)
          + "My Rank" bar (~52px) + 12px gap.
      ─────────────────────────────────────────────────────────────────────── */}
      {showJumpButton && (
        <Button
          onClick={handleJumpToRank}
          aria-label="Jump to my rank"
          className="
            fixed bottom-32 md:bottom-24 right-4
            h-12 w-12 p-0 rounded-full shadow-xl z-40
            bg-blue-500 hover:bg-blue-600 text-white
          "
        >
          <Locate className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default Leaderboard;
