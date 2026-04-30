import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Gift, Sparkles, Loader2, Check, ChevronDown, Star,
} from "lucide-react";
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

interface Particle {
  id: number;
  x: number; y: number;
  tx: number; ty: number;
  size: number; color: string;
}

interface Props { className?: string }

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const t = Math.floor(ms / 1000);
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60]
    .map((v) => String(v).padStart(2, "0")).join(":");
};

const COLORS = ["#ffb300", "#ff8800", "#ffffff", "#ffe066", "#ff6b00"];
const DAYS = [1, 2, 3, 4, 5, 6, 7];

/* ─── Inline SVG icons ──────────────────────────────────── */
const IconFlame = ({ size = 10, color = "#ff8c00" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32C8.07 6.35 6.29 9.16 6.13 12.1a6.4 6.4 0 0 0 .08 2c.09.58.25 1.14.49 1.67C7.5 16.63 8.41 17.5 9.5 18c-.15-.4-.2-.82-.14-1.24.15-.8.7-1.46 1.32-1.87.6-.41 1.25-.63 1.94-.79.7-.17 1.4-.5 1.94-1.03.29-.27.52-.6.64-.97.12-.36.15-.76.06-1.14-.09-.37-.28-.72-.5-1.03.38.2.74.48 1.04.8.3.31.54.67.67 1.07.22.68.16 1.43-.07 2.1-.23.67-.62 1.27-1.1 1.77a6.05 6.05 0 0 1-1.83 1.2c-.73.32-1.54.48-2.35.46a4.12 4.12 0 0 1-2.13-.72 4.06 4.06 0 0 1-1.36-1.76 4.76 4.76 0 0 1-.24-2.1c.08-.76.31-1.5.67-2.17.36-.66.83-1.25 1.37-1.76.27-.25.54-.49.83-.71" />
  </svg>
);

const IconGift = ({ size = 18, color = "#ffb300", strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

/* ─── Component ─────────────────────────────────────────── */
const DailyLoginReward: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [open, setOpen] = useState(false);
  const [daysVisible, setDaysVisible] = useState<boolean[]>(Array(7).fill(false));
  const [particles, setParticles] = useState<Particle[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pidRef = useRef(0);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_daily_reward_status");
    if (!error && data && (data as any).success) {
      const s = data as unknown as RewardStatus;
      setStatus(s);
      setClaimed(!s.can_claim);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (!status?.next_claim_at || status.can_claim) { setCountdown(""); return; }
    const tick = () => {
      const rem = new Date(status.next_claim_at!).getTime() - Date.now();
      rem <= 0 ? (setCountdown(""), fetchStatus()) : setCountdown(fmt(rem));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  /* Stagger streak tiles on open */
  useEffect(() => {
    if (!open) { setDaysVisible(Array(7).fill(false)); return; }
    DAYS.forEach((_, i) =>
      setTimeout(() =>
        setDaysVisible((p) => { const n = [...p]; n[i] = true; return n; }),
        80 + i * 60));
  }, [open]);

  const spawnParticles = useCallback(() => {
    if (!btnRef.current || !cardRef.current) return;
    const br = btnRef.current.getBoundingClientRect();
    const cr = cardRef.current.getBoundingClientRect();
    const cx = br.left + br.width / 2 - cr.left;
    const cy = br.top + br.height / 2 - cr.top;
    const list: Particle[] = Array.from({ length: 24 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 24 + Math.random() * 0.4;
      const d = 55 + Math.random() * 75;
      return { id: ++pidRef.current, x: cx, y: cy, tx: Math.cos(a) * d, ty: Math.sin(a) * d, size: 4 + Math.random() * 6, color: COLORS[i % COLORS.length] };
    });
    setParticles((p) => [...p, ...list]);
    setTimeout(() => setParticles((p) => p.filter((x) => !list.some((l) => l.id === x.id))), 900);
  }, []);

  const handleClaim = async () => {
    if (!user || claiming || claimed) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_daily_reward", { p_ip_address: null, p_user_agent: navigator.userAgent });
      if (error) throw error;
      const res = data as any;
      if (!res?.success) {
        toast({ title: "Cannot claim yet", description: res?.error || "Try again later", variant: "destructive" });
      } else {
        spawnParticles();
        toast({ title: `+${res.points_awarded} MCK Points! 🎉`, description: res.message });
        setClaimed(true);
        await fetchStatus();
      }
    } catch (e: any) {
      toast({ title: "Failed to claim", description: e?.message || "Please try again", variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className={cn("rounded-3xl flex items-center justify-center h-16", className)}
        style={{ background: "#0c0c0e", border: "1px solid rgba(255,179,0,0.13)" }}>
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgba(255,179,0,0.5)" }} />
      </div>
    );
  }

  if (!status) return null;

  const isBonus7 = status.can_claim && status.next_streak_day === 7;

  /* Day tile styles */
  const dayStyle = (day: number, idx: number): React.CSSProperties => {
    const isPast = claimed ? day <= status.next_streak_day : day < status.next_streak_day;
    const isActive = !claimed && status.can_claim && day === status.next_streak_day;
    const isBonus = day === 7;
    const vis = daysVisible[idx];

    const base: React.CSSProperties = {
      aspectRatio: "1", borderRadius: 11, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: vis ? 1 : 0,
      transform: vis ? `scale(${isActive ? 1.09 : 1})` : "translateY(10px) scale(.85)",
      transition: "opacity .3s, transform .35s cubic-bezier(.34,1.56,.64,1)",
    };

    if (isActive)  return { ...base, background: "#ffb300", border: "1px solid #ffb300", color: "#0c0c0e", boxShadow: "0 0 18px rgba(255,179,0,.55)" };
    if (isPast)    return { ...base, background: isBonus ? "rgba(255,100,0,.1)" : "rgba(255,179,0,.1)", border: `1px solid ${isBonus ? "rgba(255,100,0,.25)" : "rgba(255,179,0,.22)"}`, color: isBonus ? "#ff8800" : "#ffb300" };
    if (isBonus)   return { ...base, background: "rgba(255,100,0,.06)", border: "1px solid rgba(255,100,0,.14)", color: "rgba(255,140,0,.4)" };
    return { ...base, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.22)" };
  };

  const dayContent = (day: number) => {
    const isPast = claimed ? day <= status.next_streak_day : day < status.next_streak_day;
    const isActive = !claimed && status.can_claim && day === status.next_streak_day;
    const isBonus = day === 7;
    if (isActive) return <IconGift size={14} color="#0c0c0e" />;
    if (isPast && isBonus) return <><Star className="h-[11px] w-[11px]" /><span style={{ fontSize: 8, fontWeight: 700, marginTop: 1 }}>+50</span></>;
    if (isPast) return <Check className="h-3 w-3" />;
    if (isBonus) return <><Star className="h-[10px] w-[10px]" style={{ opacity: .5 }} /><span style={{ fontSize: 8, fontWeight: 700, marginTop: 1, opacity: .4 }}>+50</span></>;
    return <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700 }}>{day}</span>;
  };

  return (
    <div ref={cardRef} className={cn("relative overflow-hidden rounded-3xl", className)}
      style={{ background: "#0c0c0e", border: "1px solid rgba(255,179,0,0.13)", fontFamily: "'Syne','Inter',sans-serif" }}>

      {/* Glows */}
      <div className="pointer-events-none absolute" style={{ top: -80, right: -80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,179,0,.13) 0%,transparent 70%)", opacity: open ? 1 : 0.5, transition: "opacity .4s" }} />
      <div className="pointer-events-none absolute" style={{ bottom: -80, left: -60, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(130,80,255,.1) 0%,transparent 70%)" }} />

      {/* Particles */}
      {particles.map((p) => (
        <div key={p.id} className="pointer-events-none absolute rounded-full"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size, background: p.color, animation: "dlrFly .8s forwards", ["--tx" as any]: `${p.tx}px`, ["--ty" as any]: `${p.ty}px` }} />
      ))}

      {/* ── Collapsed pill ── */}
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="relative z-10 w-full flex items-center gap-3 text-left transition-colors hover:bg-white/[.025]"
        style={{ padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer" }}>

        <div className="flex-shrink-0 flex items-center justify-center rounded-2xl"
          style={{ width: 42, height: 42, background: "rgba(255,179,0,.1)", border: "1px solid rgba(255,179,0,.18)" }}>
          <IconGift />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-extrabold leading-tight" style={{ fontSize: 15, color: "#f0f0f0" }}>Daily Reward</p>
          <p style={{ fontSize: 11, marginTop: 2, color: claimed ? "#ffb300" : "rgba(255,255,255,.35)", transition: "color .3s" }}>
            {claimed ? "Claimed! See you tomorrow" : status.can_claim ? "Tap to claim today's reward" : countdown ? `Next in ${countdown}` : "Come back tomorrow"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status.current_streak > 0 && (
            <div className="flex items-center gap-1 rounded-full" style={{ background: "rgba(255,100,0,.1)", border: "1px solid rgba(255,100,0,.2)", padding: "4px 9px" }}>
              <IconFlame size={10} color="#ff8c00" />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: "#ff8c00" }}>{status.current_streak}</span>
            </div>
          )}
          {!claimed && (
            <div className="rounded-full font-bold" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, padding: "4px 10px", background: "rgba(255,179,0,.12)", border: "1px solid rgba(255,179,0,.22)", color: "#ffb300" }}>
              +{status.next_reward}
            </div>
          )}
          <ChevronDown className="h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300"
            style={{ color: "rgba(255,255,255,.32)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </div>
      </button>

      {/* ── Expanded body ── */}
      <div className="overflow-hidden" style={{ maxHeight: open ? 560 : 0, transition: "max-height .5s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding: "0 18px 20px", opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(-8px)", transition: "opacity .3s .1s, transform .3s .1s" }}>

          <div style={{ height: 1, background: "rgba(255,255,255,.06)", marginBottom: 18 }} />

          {/* Streak days */}
          <div className="grid mb-5" style={{ gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {DAYS.map((day, idx) => (
              <div key={day} className="flex flex-col items-center justify-center" style={dayStyle(day, idx)}>
                {dayContent(day)}
              </div>
            ))}
          </div>

          {/* Points + CTA */}
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 4 }}>Today's Reward</p>
              <div className="font-extrabold leading-none" style={{ fontSize: 50, background: "linear-gradient(135deg,#ffb300 30%,#ff6b00 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                +{status.next_reward}
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginTop: 3 }}>MCK Points</p>

              {isBonus7 && (
                <div className="inline-flex items-center gap-1 rounded-full mt-2" style={{ fontSize: 11, fontWeight: 700, color: "#ff8800", background: "rgba(255,100,0,.1)", border: "1px solid rgba(255,100,0,.2)", padding: "3px 10px" }}>
                  <Sparkles className="h-3 w-3" /> 7-day bonus!
                </div>
              )}

              {claimed && countdown && (
                <div className="flex items-center gap-2 mt-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(255,255,255,.32)" }}>
                  <span className="rounded-full animate-pulse flex-shrink-0" style={{ width: 5, height: 5, background: "#ff8800" }} />
                  Next in {countdown}
                </div>
              )}
            </div>

            <button ref={btnRef} onClick={handleClaim} disabled={claiming || claimed}
              className="relative overflow-hidden flex items-center gap-2 rounded-2xl font-extrabold transition-all active:scale-95"
              style={{
                fontFamily: "'Syne','Inter',sans-serif", fontSize: 14, padding: "15px 26px", minWidth: 120, border: "none",
                cursor: claimed ? "not-allowed" : "pointer",
                ...(claimed
                  ? { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.28)" }
                  : { background: "linear-gradient(135deg,#ffb300,#ff6b00)", color: "#0c0c0e", boxShadow: "0 4px 24px rgba(255,179,0,.4)", animation: "dlrBtnPulse 2.5s ease-in-out infinite" }),
              }}>
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" />
                : claimed ? <><Check className="h-4 w-4" /> Claimed</>
                : <><IconGift size={15} color="#0c0c0e" strokeWidth={2.5} /> Claim</>}
            </button>
          </div>

          {/* Stats */}
          {status.total_claims > 0 && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,.06)", marginBottom: 14 }} />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: status.longest_streak, label: "Best Streak", icon: <IconFlame size={11} color="#ff8c00" /> },
                  { val: status.total_claims, label: "Total Claims", icon: <Check className="h-[11px] w-[11px]" style={{ color: "#ffb300" }} /> },
                  { val: status.total_points_earned, label: "MCK Points", icon: <Star className="h-[11px] w-[11px]" style={{ color: "#ffb300" }} /> },
                ].map(({ val, label, icon }) => (
                  <div key={label} className="flex flex-col items-center rounded-2xl py-3"
                    style={{ background: "rgba(255,255,255,.028)", border: "1px solid rgba(255,255,255,.06)" }}>
                    <div className="flex items-center gap-1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 17, fontWeight: 800, color: "#f0f0f0" }}>
                      {icon}{val}
                    </div>
                    <p style={{ fontSize: 9, letterSpacing: ".09em", textTransform: "uppercase", color: "rgba(255,255,255,.26)", marginTop: 3 }}>{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes dlrFly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)} }
        @keyframes dlrBtnPulse { 0%,100%{box-shadow:0 4px 20px rgba(255,179,0,.35)} 50%{box-shadow:0 4px 32px rgba(255,179,0,.65)} }
      `}</style>
    </div>
  );
};

export default DailyLoginReward;
