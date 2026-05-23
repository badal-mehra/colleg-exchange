import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, Check } from "lucide-react";
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

/* ─── Modern Custom SVGs ─────────────────────────────────── */
const IsometricCoin = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15L85 35V65L50 85L15 65V35L50 15Z" fill="url(#coinTop)" />
    <path d="M50 85L85 65V35L50 55V85Z" fill="url(#coinRight)" />
    <path d="M50 85V55L15 35V65L50 85Z" fill="url(#coinLeft)" />
    <path d="M50 30L70 42V58L50 70L30 58V42L50 30Z" fill="#FFF" opacity="0.15" />
    <defs>
      <linearGradient id="coinTop" x1="50" y1="15" x2="50" y2="55" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FCD34D" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="coinRight" x1="67.5" y1="35" x2="67.5" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D97706" />
        <stop offset="1" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="coinLeft" x1="32.5" y1="35" x2="32.5" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);

const CrystalBonus = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10L80 40L50 90L20 40L50 10Z" fill="url(#crystalBase)" />
    <path d="M50 10L80 40L50 50L20 40L50 10Z" fill="#FFF" opacity="0.3" />
    <path d="M50 10V50L20 40L50 10Z" fill="#FFF" opacity="0.5" />
    <path d="M50 50L80 40L50 90V50Z" fill="#000" opacity="0.15" />
    <defs>
      <linearGradient id="crystalBase" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
  </svg>
);

/* ─── Helpers ────────────────────────────────────────────── */
const fmtCountdown = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const t = Math.floor(ms / 1000);
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};

const DAYS = [1, 2, 3, 4, 5, 6, 7];
// Mocking the point trajectory for visual display
const getPointsForDay = (day: number) => day === 7 ? 50 : 10;

/* ─── Component ─────────────────────────────────────────── */
const DailyLoginReward: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState("");
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"track" | "perks">("track"); // The inner toggle
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
          title: "Wallet Boosted! 🪙",
          description: `+${res.points_awarded} Points added to your MyCampusKart account.`,
        });

        setTimeout(() => {
          setShowBurst(false);
          setFloatingPoints(null);
          fetchStatus(); 
        }, 2000);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Network Glitch", description: "Hold tight, try again." });
    } finally {
      setClaiming(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="h-20 flex items-center justify-center rounded-[1.5rem] bg-[#0c0c0e] border border-white/5"><Loader2 className="animate-spin text-amber-500" /></div>;
  if (!status) return null;

  const claimedCount = status.can_claim ? status.next_streak_day - 1 : status.next_streak_day;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] transition-all duration-300", 
        isOpen ? "bg-[#0c0c10] shadow-[0_10px_40px_-10px_rgba(245,158,11,0.1)]" : "bg-[#0a0a0c] hover:bg-[#111116]",
        className
      )}
      style={{ border: "1px solid rgba(255,179,0,0.12)" }}
    >
      {/* ── Collapsible Header ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full relative z-20 flex items-center p-4 text-left group"
      >
        <div className="relative flex-shrink-0 w-12 h-12 mr-3 flex items-center justify-center">
          <div className={cn("absolute inset-0 rounded-xl transition-opacity", status.can_claim ? "bg-amber-500/20 animate-pulse" : "bg-white/5")} />
          <IsometricCoin className={cn("w-7 h-7 drop-shadow-md", status.can_claim && "mck-float")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-black text-slate-100 tracking-tight">Daily Rewards</h3>
            {status.can_claim && <span className="px-1.5 py-0.5 rounded-[4px] bg-amber-500 text-slate-950 text-[9px] font-black uppercase">Drop Ready</span>}
          </div>
          <p className="text-xs text-slate-400 font-medium truncate">
            {status.can_claim 
              ? <span className="text-amber-300">Tap to grab today's MCK Points</span>
              : countdown 
                ? <span className="font-mono">Next reset in {countdown}</span>
                : "Streak saved today"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Wallet</p>
            <p className="text-sm font-black text-amber-400">{status.total_points_earned}</p>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-slate-500 transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </button>

      {/* ── Compact Expanded Body ── */}
      <div className={cn("grid transition-all duration-400 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0">
            
            <div className="h-[1px] w-full bg-white/5 mb-4" />

            {/* Inner Nav Toggle */}
            <div className="flex bg-[#111116] rounded-lg p-1 mb-5 border border-white/5">
              <button 
                onClick={() => setActiveTab("track")}
                className={cn("flex-1 text-xs font-bold py-1.5 rounded-md transition-all", activeTab === "track" ? "bg-white/10 text-slate-100" : "text-slate-500 hover:text-slate-300")}
              >
                Claim Progress
              </button>
              <button 
                onClick={() => setActiveTab("perks")}
                className={cn("flex-1 text-xs font-bold py-1.5 rounded-md transition-all", activeTab === "perks" ? "bg-white/10 text-slate-100" : "text-slate-500 hover:text-slate-300")}
              >
                What are points for?
              </button>
            </div>

            {/* View Container (Strict Height to prevent UI jumping) */}
            <div className="relative min-h-[140px]">
              
              {/* TAB 1: Progress Track */}
              <div className={cn("absolute inset-0 transition-all duration-300", activeTab === "track" ? "opacity-100 translate-x-0 z-10" : "opacity-0 -translate-x-4 pointer-events-none")}>
                
                {/* 7-Day Visual Track with Explicit Points */}
                <div className="flex justify-between items-end gap-1 mb-6">
                  {DAYS.map((day) => {
                    const isClaimed = day <= claimedCount;
                    const isToday = status.can_claim && day === status.next_streak_day;
                    const isBonus = day === 7;
                    const pts = getPointsForDay(day);

                    return (
                      <div key={day} className="flex flex-col items-center flex-1">
                        {/* Point Label Top */}
                        <span className={cn(
                          "text-[10px] font-black mb-1.5 transition-colors",
                          isClaimed ? "text-amber-500" : isToday ? "text-amber-300" : "text-slate-600"
                        )}>
                          +{pts}
                        </span>
                        
                        {/* Track Node */}
                        <div className={cn(
                          "w-full h-8 rounded-md flex items-center justify-center transition-all border",
                          isBonus ? "bg-gradient-to-t from-blue-600/20 to-blue-400/10 border-blue-500/30" : 
                          isClaimed ? "bg-amber-500/10 border-amber-500/20" : 
                          isToday ? "bg-amber-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : 
                          "bg-white/[0.02] border-white/5"
                        )}>
                          {isClaimed ? (
                            <Check className="h-3 w-3 text-amber-500" strokeWidth={3} />
                          ) : isBonus ? (
                            <CrystalBonus className={cn("w-4 h-4", isToday ? "brightness-200" : "opacity-40")} />
                          ) : isToday ? (
                            <span className="text-[10px] font-black text-slate-950">DAY {day}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600">{day}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Claim Action Core */}
                <div className="relative">
                  {floatingPoints && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-black text-amber-400 mck-float-up z-50 pointer-events-none">
                      +{floatingPoints}
                    </div>
                  )}

                  {showBurst && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 mck-particle" style={{ '--angle': `${i * 60}deg` } as React.CSSProperties} />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleClaim}
                    disabled={claiming || !status.can_claim}
                    className={cn(
                      "relative w-full h-12 rounded-xl font-black text-sm transition-all duration-200 flex items-center justify-center z-10 active:scale-[0.98]",
                      status.can_claim 
                        ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_5px_20px_-5px_rgba(245,158,11,0.5)]"
                        : "bg-[#111116] border border-white/5 text-slate-500 cursor-not-allowed"
                    )}
                  >
                    {claiming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : status.can_claim ? (
                      `CLAIM +${status.next_reward} POINTS`
                    ) : (
                      "Available Tomorrow"
                    )}
                  </button>
                </div>
              </div>

              {/* TAB 2: Perks Information */}
              <div className={cn("absolute inset-0 transition-all duration-300", activeTab === "perks" ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-4 pointer-events-none")}>
                <div className="h-full flex flex-col justify-center space-y-3">
                  
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                       <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-200">Boost Listings <span className="text-[9px] text-amber-500 ml-1">500 pts</span></p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Push your textbook or item to the top of the campus feed.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-200">Verified Seller Badge <span className="text-[9px] text-amber-500 ml-1">1000 pts</span></p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Build trust with other LPU students on the marketplace.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- High Performance CSS Magic --- */}
      <style>{`
        .mck-float { animation: mck-hover-float 3s ease-in-out infinite; }
        @keyframes mck-hover-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .mck-float-up { animation: floatUpFade 1s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        @keyframes floatUpFade {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -15px) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -40px) scale(1); opacity: 0; }
        }
        .mck-particle { animation: explode 0.6s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        @keyframes explode {
          0% { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) translateY(-60px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default DailyLoginReward;
