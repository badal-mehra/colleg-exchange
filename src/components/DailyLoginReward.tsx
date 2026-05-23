import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Check, Flame, ChevronDown, Lock, Unlock, Zap, ArrowRight, TrendingUp, ShieldCheck } from "lucide-react";
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
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};

const DAYS = [1, 2, 3, 4, 5, 6, 7];

/* ─── Component ─────────────────────────────────────────── */
const DailyLoginReward: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_daily_reward_status");
    if (!error && data && (data as any).success) {
      setStatus(data as unknown as RewardStatus);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (!status?.next_claim_at || status.can_claim) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const rem = new Date(status.next_claim_at!).getTime() - Date.now();
      rem <= 0 ? (setCountdown(""), fetchStatus()) : setCountdown(fmtCountdown(rem));
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
        setFloatingPoints(res.points_awarded);
        setShowBurst(true);
        
        toast({
          title: "Points Secured! 💎",
          description: `+${res.points_awarded} MCK Points added. You're closer to your next reward!`,
        });

        setTimeout(() => {
          setShowBurst(false);
          setFloatingPoints(null);
          fetchStatus(); 
        }, 2000);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Network Error", description: "Could not claim right now. Try again." });
    } finally {
      setClaiming(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="h-20 flex items-center justify-center rounded-[2rem] bg-[#0a0a0c] border border-white/5"><Loader2 className="animate-spin text-amber-500" /></div>;
  if (!status) return null;

  const claimedCount = status.can_claim ? status.next_streak_day - 1 : status.next_streak_day;
  const progressPct = (claimedCount / 7) * 100;

  // Next milestone calculation (Psychological hook)
  const nextMilestone = status.total_points_earned < 500 ? 500 : status.total_points_earned < 1000 ? 1000 : 2500;
  const pointsNeeded = nextMilestone - status.total_points_earned;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-[2rem] transition-all duration-500 mck-glass-panel", 
        isOpen ? "shadow-[0_0_80px_rgba(245,158,11,0.06)] bg-[#0c0c10]" : "bg-[#0a0a0c] hover:bg-[#0f0f13]",
        className
      )}
      style={{ border: "1px solid rgba(255,179,0,0.12)" }}
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-orange-600/5 blur-[90px] rounded-full pointer-events-none mix-blend-screen" />

      {/* ── 1. The Teaser Header ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full relative z-20 flex items-center p-5 text-left group"
      >
        <div className="relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center mr-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle 
              cx="28" cy="28" r="26" fill="none" 
              stroke={status.can_claim ? "#f59e0b" : "#4ade80"} 
              strokeWidth="3" strokeDasharray="163" 
              strokeDashoffset={163 - (163 * progressPct) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            status.can_claim ? "bg-amber-500/20 mck-breathe shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-green-500/10"
          )}>
            <Zap className={cn("h-5 w-5", status.can_claim ? "text-amber-400 fill-amber-400" : "text-green-400")} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-black text-white tracking-tight">Daily Loot</h3>
            {status.can_claim && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase animate-pulse">Available</span>}
          </div>
          {/* The Hook: Telling them exactly what they are working towards */}
          <p className="text-xs text-slate-400 font-medium truncate">
            {status.can_claim 
              ? `Only ${pointsNeeded} pts away from your next unlock!` 
              : countdown 
                ? `Next drop in ${countdown}` 
                : "Streak saved for today ✨"}
          </p>
        </div>

        <ChevronDown className={cn("h-6 w-6 text-slate-500 transition-transform duration-500", isOpen && "rotate-180")} />
      </button>

      {/* ── 2. The Expanded Dashboard ── */}
      <div className={cn("grid transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="p-5 pt-0 relative z-10">
            
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

            {/* Streak & Wallet Banner */}
            <div className="flex justify-between items-center mb-6 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Current Streak</p>
                  <p className="text-sm font-black text-slate-200">{status.current_streak} Days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Total Wallet</p>
                <p className="text-sm font-black text-amber-400">{status.total_points_earned} Pts</p>
              </div>
            </div>

            {/* 7-Day Visual Track */}
            <div className="relative flex justify-between items-center gap-2 mb-8">
              <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-800/50 -translate-y-1/2 rounded-full z-0" />
              <div 
                className="absolute top-1/2 left-4 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 -translate-y-1/2 rounded-full z-0 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `calc(${progressPct}% - 2rem)` }} 
              />

              {DAYS.map((day, i) => {
                const isClaimed = day <= claimedCount;
                const isToday = status.can_claim && day === status.next_streak_day;
                const isBonus = day === 7;

                return (
                  <div key={day} className="relative z-10 flex flex-col items-center group" style={{ transitionDelay: `${i * 50}ms` }}>
                    <div 
                      className={cn(
                        "flex items-center justify-center rounded-xl transition-all duration-300",
                        isBonus ? "w-11 h-11 rotate-45" : "w-9 h-9",
                        isClaimed 
                          ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-90"
                          : isToday
                            ? "bg-[#1a1a20] border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] mck-bounce"
                            : "bg-slate-900/80 border border-white/5 backdrop-blur-sm"
                      )}
                    >
                      <div className={cn(isBonus && "-rotate-45")}>
                        {isClaimed ? (
                          <Check className="h-4 w-4 text-slate-950 font-bold" />
                        ) : isToday ? (
                          <Unlock className="h-4 w-4 text-amber-400" />
                        ) : isBonus ? (
                          <Sparkles className="h-5 w-5 text-slate-500" />
                        ) : (
                          <Lock className="h-3 w-3 text-slate-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Claim Action Core */}
            <div className="relative mb-6">
              {floatingPoints && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl font-black text-amber-400 mck-float-up z-50 pointer-events-none drop-shadow-[0_0_20px_rgba(245,158,11,1)]">
                  +{floatingPoints}
                </div>
              )}

              {showBurst && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute w-2 h-2 rounded-full bg-amber-400 mck-particle" style={{ '--angle': `${i * 45}deg` } as React.CSSProperties} />
                  ))}
                </div>
              )}

              <button
                onClick={handleClaim}
                disabled={claiming || !status.can_claim}
                className={cn(
                  "relative w-full h-16 rounded-2xl font-black text-lg transition-all duration-300 overflow-hidden flex items-center justify-center z-10 active:scale-[0.97]",
                  status.can_claim 
                    ? "text-slate-950 shadow-[0_10px_35px_-10px_rgba(245,158,11,0.6)] hover:shadow-[0_15px_45px_-10px_rgba(245,158,11,0.8)] hover:-translate-y-1"
                    : "bg-white/[0.03] border border-white/5 text-slate-500 cursor-not-allowed"
                )}
              >
                {status.can_claim && <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 mck-bg-pan" />}
                
                <span className="relative z-10 flex items-center gap-2">
                  {claiming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : status.can_claim ? (
                    <>CLAIM +{status.next_reward} POINTS <Sparkles className="h-5 w-5" /></>
                  ) : (
                    "Available Tomorrow"
                  )}
                </span>
              </button>
            </div>

            {/* ── 3. The Hook: Why do points matter? ── */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 border border-white/5">
              <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                What can you do with MCK Points?
              </p>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Boost your marketplace listings
                  </div>
                  <span className="text-xs font-mono text-amber-500/80">500 pts</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Unlock 'Trusted Seller' Badge
                  </div>
                  <span className="text-xs font-mono text-amber-500/80">1000 pts</span>
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <ShieldCheck className="h-3 w-3 text-slate-400" />
                    Campus partner discounts
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Coming Soon</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .mck-glass-panel { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .mck-breathe { animation: mck-breathe 2.5s ease-in-out infinite alternate; }
        @keyframes mck-breathe {
          0% { transform: scale(0.95); box-shadow: 0 0 0 rgba(245,158,11,0); }
          100% { transform: scale(1.05); box-shadow: 0 0 20px rgba(245,158,11,0.4); }
        }
        .mck-bounce { animation: mck-hover-float 3s ease-in-out infinite; }
        @keyframes mck-hover-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .mck-bg-pan {
          background-size: 200% auto;
          animation: mck-pan 3s linear infinite;
        }
        @keyframes mck-pan { to { background-position: 200% center; } }
        .mck-float-up { animation: floatUpFade 1.2s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        @keyframes floatUpFade {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -20px) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
        }
        .mck-particle { animation: explode 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        @keyframes explode {
          0% { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) translateY(-80px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default DailyLoginReward;
