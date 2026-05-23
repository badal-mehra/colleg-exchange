import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Check, Flame, ChevronDown, Lock, Unlock, Zap } from "lucide-react";
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

  // Countdown Loop
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
        // High-octane payoff sequence
        setFloatingPoints(res.points_awarded);
        setShowBurst(true);
        
        toast({
          title: "Loot Secured! 💎",
          description: `+${res.points_awarded} MCK Points added to your wallet.`,
        });

        setTimeout(() => {
          setShowBurst(false);
          setFloatingPoints(null);
          fetchStatus(); 
        }, 2000);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Glitch in the matrix", description: "Try again." });
    } finally {
      setClaiming(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="h-20 flex items-center justify-center rounded-3xl bg-[#0a0a0c] border border-white/5"><Loader2 className="animate-spin text-amber-500" /></div>;
  if (!status) return null;

  const claimedCount = status.can_claim ? status.next_streak_day - 1 : status.next_streak_day;
  const progressPct = (claimedCount / 7) * 100;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-[2rem] transition-all duration-500 mck-glass-panel", 
        isOpen ? "shadow-[0_0_80px_rgba(245,158,11,0.08)]" : "hover:bg-white/[0.03]",
        className
      )}
      style={{ background: "#0a0a0c", border: "1px solid rgba(255,179,0,0.15)" }}
    >
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-rose-500/10 blur-[90px] rounded-full pointer-events-none mix-blend-screen" />

      {/* ── Collapsible Ticket Header ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full relative z-20 flex items-center p-5 text-left group"
      >
        {/* Glowing Status Ring */}
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
            "w-10 h-10 rounded-full flex items-center justify-center",
            status.can_claim ? "bg-amber-500/20 mck-breathe" : "bg-green-500/10"
          )}>
            <Zap className={cn("h-5 w-5", status.can_claim ? "text-amber-400 fill-amber-400" : "text-green-400")} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            Daily Drop
            {status.can_claim && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase animate-pulse">Ready</span>}
          </h3>
          <p className="text-sm text-slate-400 font-medium">
            {status.can_claim ? (
              <span className="text-amber-200">Tap to crack open today's points</span>
            ) : countdown ? (
              <span className="font-mono text-slate-300">Next drop in {countdown}</span>
            ) : "You're all caught up!"}
          </p>
        </div>

        <ChevronDown className={cn("h-6 w-6 text-slate-500 transition-transform duration-500", isOpen && "rotate-180")} />
      </button>

      {/* ── The "Loot Box" Interior ── */}
      <div className={cn("grid transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="p-5 pt-0 relative z-10">
            
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

            {/* Streak Tracker UI */}
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-xs font-black text-orange-400">{status.current_streak} Streak</span>
              </div>
            </div>

            {/* Premium Day Track */}
            <div className="relative flex justify-between items-center gap-2 mb-8">
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/5 -translate-y-1/2 rounded-full z-0" />
              <div 
                className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-amber-500 to-orange-500 -translate-y-1/2 rounded-full z-0 transition-all duration-1000"
                style={{ width: `calc(${progressPct}% - 2rem)` }} 
              />

              {DAYS.map((day, i) => {
                const isClaimed = day <= claimedCount;
                const isToday = status.can_claim && day === status.next_streak_day;
                const isBonus = day === 7;

                return (
                  <div 
                    key={day} 
                    className="relative z-10 flex flex-col items-center group"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <div 
                      className={cn(
                        "flex items-center justify-center rounded-xl transition-all duration-300",
                        isBonus ? "w-12 h-12 rotate-45" : "w-10 h-10",
                        isClaimed 
                          ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-90"
                          : isToday
                            ? "bg-[#1a1a20] border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] mck-bounce"
                            : "bg-[#111115] border border-white/5"
                      )}
                    >
                      <div className={cn(isBonus && "-rotate-45")}>
                        {isClaimed ? (
                          <Check className="h-5 w-5 text-slate-950 font-bold" />
                        ) : isToday ? (
                          <Unlock className="h-4 w-4 text-amber-400" />
                        ) : isBonus ? (
                          <Sparkles className="h-5 w-5 text-slate-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-slate-600" />
                        )}
                      </div>
                    </div>
                    {/* Small dot indicator underneath */}
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-3 transition-colors", isClaimed ? "bg-amber-500" : isToday ? "bg-amber-500 animate-ping" : "bg-slate-800")} />
                  </div>
                );
              })}
            </div>

            {/* Huge Claim Button Area */}
            <div className="relative mt-2">
              {/* Floating Points Animation on Claim */}
              {floatingPoints && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-3xl font-black text-amber-400 mck-float-up z-50 pointer-events-none drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                  +{floatingPoints}
                </div>
              )}

              {/* Zero-Lag CSS Particles */}
              {showBurst && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-2 h-2 rounded-full bg-amber-400 mck-particle" 
                      style={{ '--angle': `${i * 45}deg` } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={handleClaim}
                disabled={claiming || !status.can_claim}
                className={cn(
                  "relative w-full h-16 rounded-2xl font-black text-lg transition-all duration-300 overflow-hidden flex items-center justify-center z-10 active:scale-[0.98]",
                  status.can_claim 
                    ? "text-slate-950 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.6)] hover:shadow-[0_10px_50px_-5px_rgba(245,158,11,0.8)] hover:-translate-y-1"
                    : "bg-white/[0.02] border border-white/5 text-slate-500 cursor-not-allowed"
                )}
              >
                {/* Neon Button Background */}
                {status.can_claim && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 mck-bg-pan" />
                )}
                
                <span className="relative z-10 flex items-center gap-2">
                  {claiming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : status.can_claim ? (
                    <>CLAIM +{status.next_reward} POINTS <Sparkles className="h-5 w-5" /></>
                  ) : (
                    "Come back tomorrow"
                  )}
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* --- High Performance CSS Magic --- */}
      <style>{`
        /* Glassmorphism base */
        .mck-glass-panel {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        
        /* Smooth continuous breathing for active elements */
        .mck-breathe {
          animation: mck-breathe 2.5s ease-in-out infinite alternate;
        }
        @keyframes mck-breathe {
          0% { transform: scale(0.95); box-shadow: 0 0 0 rgba(245,158,11,0); }
          100% { transform: scale(1.05); box-shadow: 0 0 20px rgba(245,158,11,0.4); }
        }

        /* Subtle float for today's target */
        .mck-bounce {
          animation: mck-hover-float 3s ease-in-out infinite;
        }
        @keyframes mck-hover-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        /* Moving gradient for the claim button */
        .mck-bg-pan {
          background-size: 200% auto;
          animation: mck-pan 3s linear infinite;
        }
        @keyframes mck-pan {
          to { background-position: 200% center; }
        }

        /* Payoff Floating Points */
        .mck-float-up {
          animation: floatUpFade 1.2s cubic-bezier(0.2, 1, 0.3, 1) forwards;
        }
        @keyframes floatUpFade {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -20px) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
        }

        /* Zero-Lag CSS Particles */
        .mck-particle {
          animation: explode 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards;
        }
        @keyframes explode {
          0% { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) translateY(-80px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default DailyLoginReward;
