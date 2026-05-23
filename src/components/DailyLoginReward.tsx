import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Check, Gift, Flame, ChevronDown, Star } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false); // Controls the Accordion
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

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
        fetchStatus();
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
      
      if (res?.success) {
        // Trigger CSS visual burst
        setShowSuccessGlow(true);
        setTimeout(() => setShowSuccessGlow(false), 1500);

        toast({
          title: `+${res.points_awarded} MCK Points! 🎉`,
          description: "Streak updated. Keep it going tomorrow!",
        });
        await fetchStatus(); 
      }
    } catch (e: any) {
      toast({
        title: "Failed to claim",
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
      <div className={cn("rounded-2xl bg-[#0c0c0e] border border-amber-500/10 h-20 flex items-center justify-center", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-amber-500/50" />
      </div>
    );
  }

  if (!status) return null;

  const claimedDaysCount = status.can_claim ? status.next_streak_day - 1 : status.next_streak_day;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-3xl transition-all duration-300", 
        className
      )}
      style={{
        background: "#0c0c0e",
        boxShadow: showSuccessGlow ? "0 0 40px rgba(245,158,11,0.2) inset" : "none",
        border: "1px solid rgba(245,158,11,0.15)",
      }}
    >
      {/* --- Ambient Background Glow --- */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Collapsible Header (Always Visible) ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full relative z-10 flex items-center gap-4 p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10"
      >
        {/* Animated Gift Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center mck-bounce">
          <Gift className={cn("h-6 w-6 text-amber-400", status.can_claim && "animate-pulse")} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            Daily Reward
            {status.can_claim && <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {status.can_claim 
              ? "Tap to claim today's MCK Points!" 
              : countdown 
                ? `Next reward in ${countdown}` 
                : "All caught up today ✨"}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {status.current_streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-full">
              <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
              <span className="text-xs font-bold text-orange-400">{status.current_streak}</span>
            </div>
          )}
          <ChevronDown 
            className={cn("h-5 w-5 text-slate-500 transition-transform duration-500", isOpen && "rotate-180")} 
          />
        </div>
      </button>

      {/* ── Accordion Body ── */}
      <div 
        className={cn(
          "grid transition-all duration-500 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-white/5 mt-2 relative z-10">
            
            {/* 7-Day Grid */}
            <div className="grid grid-cols-7 gap-2 my-5">
              {DAYS.map((day) => {
                const isClaimed = day <= claimedDaysCount;
                const isToday = status.can_claim && day === status.next_streak_day;
                const isBonus = day === 7;

                return (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <div 
                      className={cn(
                        "w-full aspect-square rounded-xl flex items-center justify-center border transition-all duration-500",
                        isClaimed 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                          : isToday
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] mck-pulse-border"
                            : "bg-white/5 border-white/5 text-slate-600"
                      )}
                    >
                      {isClaimed ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : isBonus ? (
                        <Star className={cn("h-4 w-4", isToday ? "fill-slate-950" : "")} />
                      ) : (
                        <span className="text-xs font-bold font-mono">{day}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Claim Action Row */}
            <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl p-4 border border-white/5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                  Today's Loot
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500 leading-none">
                    +{status.next_reward}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">pts</span>
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming || !status.can_claim}
                className={cn(
                  "relative overflow-hidden px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 flex items-center gap-2",
                  status.can_claim 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)]"
                    : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                )}
              >
                {/* CSS Shimmer Effect for Active Button */}
                {status.can_claim && !claiming && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                )}
                
                {claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status.can_claim ? (
                  <>Claim Now <Sparkles className="h-4 w-4" /></>
                ) : (
                  "Claimed"
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Best Streak</span>
                <span className="text-sm font-bold text-slate-300 font-mono">{status.longest_streak} Days</span>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Total Earned</span>
                <span className="text-sm font-bold text-slate-300 font-mono">{status.total_points_earned} Pts</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- Safe CSS Animations (No JS Lag) --- */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .mck-bounce {
          animation: mck-float 3s ease-in-out infinite;
        }
        @keyframes mck-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .mck-pulse-border {
          animation: mck-glow 2s infinite alternate;
        }
        @keyframes mck-glow {
          from { box-shadow: 0 0 10px rgba(245,158,11,0.3); }
          to { box-shadow: 0 0 25px rgba(245,158,11,0.6), 0 0 10px rgba(245,158,11,0.4) inset; }
        }
      `}</style>
    </div>
  );
};

export default DailyLoginReward;
