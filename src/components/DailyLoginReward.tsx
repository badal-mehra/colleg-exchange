import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Check, Gift, Flame, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────── */
interface RewardStatus {
  can_claim: boolean;
  current_streak: number;
  longest_streak: number;
  total_claims: number;
  total_points_earned: number;
  next_streak_day: number;
  next_reward: number;
  last_claim_at: string | null;
  next_claim_at: string | null;
}

interface Props {
  className?: string;
}

/* ─── Helpers ────────────────────────────────────────────── */
const fmtCountdown = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const DAYS = [1, 2, 3, 4, 5, 6, 7];

/* ─── Component ─────────────────────────────────────────── */
const DailyLoginReward: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_daily_reward_status");
    if (!error && data && (data as any).success) {
      setStatus(data as unknown as RewardStatus);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Manage Countdown Timer
  useEffect(() => {
    if (!status?.next_claim_at || status.can_claim) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const rem = new Date(status.next_claim_at!).getTime() - Date.now();
      if (rem <= 0) {
        setCountdown("");
        fetchStatus(); // Automatically refresh when timer hits zero
      } else {
        setCountdown(fmtCountdown(rem));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  const handleClaim = async () => {
    if (!user || claiming || !status?.can_claim) return;
    setClaiming(true);
    
    try {
      const { data, error } = await supabase.rpc("claim_daily_reward", {
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
      });
      
      if (error) throw error;
      const res = data as any;
      
      if (!res?.success) {
        toast({
          title: "Not quite time yet!",
          description: res?.error || "Check back soon.",
          variant: "destructive",
        });
      } else {
        toast({
          title: `Awesome! +${res.points_awarded} MCK Points 🎉`,
          description: "Streak updated. Come back tomorrow for more!",
        });
        await fetchStatus(); // Refresh the board with new server data
      }
    } catch (e: any) {
      toast({
        title: "Whoops, something went wrong.",
        description: e?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className={cn("rounded-2xl bg-slate-900 border border-slate-800 h-32 flex items-center justify-center", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!status) return null;

  // Calculate progress bar width based on claimed days
  const claimedDaysCount = status.can_claim ? status.next_streak_day - 1 : status.next_streak_day;
  const progressPercentage = (Math.max(0, Math.min(claimedDaysCount, 7)) / 7) * 100;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/60 p-6 shadow-xl", className)}>
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Daily Rewards
            <Gift className="h-5 w-5 text-amber-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Build your streak to unlock the 7-day bonus!
          </p>
        </div>

        {status.current_streak > 0 && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
              <span className="text-sm font-bold text-orange-400">
                {status.current_streak} Day Streak
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Streak Progress Track ── */}
      <div className="relative mb-10 mt-4 px-2">
        {/* Background Track */}
        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-800 -translate-y-1/2 rounded-full z-0" />
        
        {/* Active Progress Track */}
        <div 
          className="absolute top-1/2 left-4 h-1.5 bg-amber-500 -translate-y-1/2 rounded-full z-0 transition-all duration-700 ease-out"
          style={{ width: `calc(${progressPercentage}% - 2rem)` }} 
        />

        <div className="relative z-10 flex justify-between">
          {DAYS.map((day) => {
            // Strict logic to separate past, present, and future states
            const isClaimed = day <= claimedDaysCount;
            const isToday = status.can_claim && day === status.next_streak_day;
            const isFuture = !isClaimed && !isToday;
            const isBonusDay = day === 7;

            return (
              <div key={day} className="flex flex-col items-center gap-2">
                <div 
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-300",
                    isBonusDay ? "h-12 w-12" : "h-10 w-10",
                    isClaimed && "bg-amber-500 text-slate-900 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
                    isToday && "bg-slate-900 text-amber-400 border-2 border-amber-400 animate-pulse",
                    isFuture && "bg-slate-900 text-slate-500 border-2 border-slate-800"
                  )}
                >
                  {isClaimed ? (
                    <Check className={cn("font-bold", isBonusDay ? "h-6 w-6" : "h-5 w-5")} />
                  ) : isToday ? (
                    isBonusDay ? <Gift className="h-6 w-6" /> : <Star className="h-5 w-5" />
                  ) : (
                    isBonusDay ? <Gift className="h-6 w-6 opacity-50" /> : <Lock className="h-4 w-4" />
                  )}
                </div>
                
                <span className={cn(
                  "text-xs font-semibold",
                  isClaimed || isToday ? "text-slate-300" : "text-slate-600",
                  isBonusDay && "text-amber-400"
                )}>
                  Day {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Action Section ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
              +{status.next_reward}
            </span>
            <span className="text-xs text-slate-400 block -mt-1 uppercase tracking-wider font-bold">Points</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              {status.can_claim ? "Ready to Claim!" : "All caught up."}
            </h3>
            <p className="text-xs text-slate-400">
              {status.can_claim 
                ? "Grab your points and boost your streak." 
                : "Great job today. New rewards unlock tomorrow."}
            </p>
          </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={claiming || !status.can_claim}
          className={cn(
            "relative w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 min-w-[160px]",
            status.can_claim 
              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 active:translate-y-0"
              : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
          )}
        >
          {claiming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status.can_claim ? (
            <>Claim Reward <Sparkles className="h-4 w-4" /></>
          ) : (
            `Next in ${countdown}`
          )}
        </button>
      </div>

    </div>
  );
};

export default DailyLoginReward;
