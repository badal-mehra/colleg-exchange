import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ─── Types ───────────────────────────────────────────────── */
interface RewardStatus {
  can_claim: boolean;
  current_streak: number;
  longest_streak: number;
  total_claims: number;
  total_points_earned: number;
  next_streak_day: number; // 1-7, the day just claimed (if claimed) or about to be claimed
  next_reward: number;
  last_claim_at: string | null;
  next_claim_at: string | null;
}

interface Props {
  className?: string;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const fmt = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const t = Math.floor(ms / 1000);
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};

// Reward per day (day 1 → index 0 … day 7 → index 6)
const DAY_REWARDS = [10, 15, 20, 25, 30, 40, 50];

// CSS-only confetti colours — no React state, no RAF loops
const CONFETTI_COLORS = [
  "#ffb300", "#ff6b00", "#ffffff", "#ffd700",
  "#ff8800", "#ffaa00", "#ffe066", "#ff9500",
  "#ffd000", "#ffbc00", "#ff7700", "#ffdf00",
];

/* ─── Component ───────────────────────────────────────────── */
const DailyLoginReward: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  /* ── Data fetching ── */
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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* ── Countdown timer ── */
  useEffect(() => {
    if (!status?.next_claim_at || status.can_claim) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const rem = new Date(status.next_claim_at!).getTime() - Date.now();
      rem <= 0 ? (setCountdown(""), fetchStatus()) : setCountdown(fmt(rem));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  /* ── Claim handler ── */
  const handleClaim = async () => {
    if (!user || claiming || claimed) return;
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
          title: "Cannot claim yet",
          description: res?.error || "Try again later",
          variant: "destructive",
        });
      } else {
        // CSS-only celebration — just flip a boolean for 2 s, zero DOM churn
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2000);
        toast({
          title: `+${res.points_awarded} MCK Points! 🎉`,
          description: res.message,
        });
        await fetchStatus(); // server is source of truth
      }
    } catch (e: any) {
      toast({
        title: "Failed to claim",
        description: e?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  /* ── Guard: no user ── */
  if (!user) return null;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div
        className={cn("rounded-2xl overflow-hidden", className)}
        style={{
          background: "linear-gradient(145deg, #1c1203 0%, #0e0e0e 60%, #140e00 100%)",
          border: "1px solid rgba(255,179,0,0.1)",
          height: 200,
        }}
      >
        <div className="animate-pulse h-full" style={{ background: "rgba(255,179,0,0.03)" }} />
      </div>
    );
  }

  if (!status) return null;

  /* ── Derived values ── */
  const {
    current_streak,
    next_streak_day,
    next_reward,
    total_claims,
    total_points_earned,
    longest_streak,
    can_claim,
  } = status;

  // "Tomorrow" reward: after claiming day N (1-7), tomorrow = day N+1 (wraps to 1 at 8)
  // next_streak_day % 7 gives 0-based index → next day index
  const tomorrowReward = DAY_REWARDS[next_streak_day % 7] ?? DAY_REWARDS[0];

  const streakMessage =
    current_streak === 0
      ? "Start your winning streak today!"
      : current_streak >= 7
      ? "🏆 Max streak! You're legendary!"
      : current_streak >= 5
      ? `🔥 ${current_streak} days strong — incredible!`
      : current_streak >= 3
      ? `⚡ ${current_streak}-day streak! Keep it up!`
      : `Day ${current_streak} — don't stop now!`;

  const claimedMessage =
    current_streak >= 7
      ? "Perfect week! Come back tomorrow 🎯"
      : `${current_streak} day streak! Don't break it 🔥`;

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{
        background: "linear-gradient(145deg, #1c1203 0%, #0e0e0e 55%, #140e00 100%)",
        border: "1px solid rgba(255,179,0,0.15)",
        fontFamily: "'DM Sans','Inter',sans-serif",
      }}
    >
      {/* ── CSS-only confetti (no JS particle state) ── */}
      {celebrate && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ zIndex: 30 }}
        >
          {CONFETTI_COLORS.map((color, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                width: 5 + (i % 5),
                height: 5 + (i % 5),
                borderRadius: i % 3 === 0 ? "50%" : 2,
                background: color,
                left: `${15 + (i % 12) * 6}%`,
                top: "50%",
                // rotate between 4 CSS keyframes to vary trajectories
                animation: `dlrCf${i % 4} ${0.7 + (i % 4) * 0.2}s ${i * 0.045}s cubic-bezier(.2,1,.3,1) both`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 85% 10%, rgba(255,179,0,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative" style={{ padding: "20px 18px 22px" }}>

        {/* ═══════════════════════════════════════
            HEADER
        ════════════════════════════════════════ */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 20 }}>🎁</span>
              <span
                style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.015em" }}
              >
                Daily Reward
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: claimed ? "#ffb300" : "rgba(255,255,255,0.38)",
                transition: "color 0.4s",
                lineHeight: 1.4,
              }}
            >
              {claimed ? claimedMessage : streakMessage}
            </p>
          </div>

          {/* Streak badge — only show if streak is active */}
          {current_streak > 0 && (
            <div
              className="flex flex-col items-center justify-center rounded-xl flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,100,0,0.18), rgba(255,179,0,0.09))",
                border: "1px solid rgba(255,130,0,0.28)",
                padding: "8px 13px",
                minWidth: 52,
              }}
            >
              <span style={{ fontSize: 17, lineHeight: 1, marginBottom: 2 }}>🔥</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#ff8c00",
                  lineHeight: 1,
                }}
              >
                {current_streak}
              </span>
              <span
                style={{
                  fontSize: 8,
                  color: "rgba(255,140,0,0.55)",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  marginTop: 3,
                }}
              >
                streak
              </span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════
            7-DAY GRID
        ════════════════════════════════════════ */}
        <div
          className="grid mb-5"
          style={{ gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}
        >
          {DAY_REWARDS.map((pts, idx) => {
            const dayNum = idx + 1;
            const isPast  = claimed ? dayNum <= next_streak_day : dayNum < next_streak_day;
            const isToday = !claimed && can_claim && dayNum === next_streak_day;
            const isBonus = dayNum === 7;

            return (
              <div
                key={dayNum}
                className="flex flex-col items-center gap-1"
                style={{
                  padding: "8px 3px",
                  borderRadius: 10,
                  background: isToday
                    ? "linear-gradient(135deg, #ffb300, #ff6b00)"
                    : isPast
                    ? isBonus
                      ? "rgba(255,100,0,0.16)"
                      : "rgba(255,179,0,0.11)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    isToday
                      ? "rgba(255,220,0,0.55)"
                      : isPast
                      ? isBonus
                        ? "rgba(255,100,0,0.28)"
                        : "rgba(255,179,0,0.22)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                  boxShadow: isToday
                    ? "0 0 14px rgba(255,160,0,0.42), 0 0 28px rgba(255,100,0,0.14)"
                    : undefined,
                }}
              >
                <span style={{ fontSize: 10, lineHeight: 1, userSelect: "none" }}>
                  {isPast ? "✓" : isToday ? "🎁" : isBonus ? "⭐" : dayNum}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8,
                    fontWeight: 700,
                    color: isToday
                      ? "#0c0c0e"
                      : isPast
                      ? isBonus
                        ? "#ff8800"
                        : "#ffb300"
                      : "rgba(255,255,255,0.22)",
                    lineHeight: 1,
                  }}
                >
                  +{pts}
                </span>
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════
            BOTTOM SECTION  (claimed vs claimable)
        ════════════════════════════════════════ */}
        {claimed ? (
          /* ── CLAIMED: show what was earned + "come back tomorrow" teaser ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Earned today */}
            <div
              className="flex items-center justify-between rounded-xl"
              style={{
                background: "rgba(255,179,0,0.06)",
                border: "1px solid rgba(255,179,0,0.13)",
                padding: "13px 15px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.33)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Claimed today
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 26,
                      fontWeight: 800,
                      color: "#ffb300",
                      lineHeight: 1,
                      animation: "dlrPop .5s cubic-bezier(.34,1.56,.64,1) both",
                    }}
                  >
                    +{next_reward}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    MCK Points
                  </span>
                </div>
              </div>
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(255,179,0,0.12)",
                  border: "1px solid rgba(255,179,0,0.22)",
                  fontSize: 18,
                }}
              >
                ✅
              </div>
            </div>

            {/* Tomorrow teaser — this is the "hook" to come back */}
            <div
              className="flex items-center gap-3 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,100,0,0.09), rgba(255,179,0,0.05))",
                border: "1px solid rgba(255,100,0,0.17)",
                padding: "12px 15px",
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>🌅</span>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#ff9d00",
                    marginBottom: 3,
                    lineHeight: 1.3,
                  }}
                >
                  Come back tomorrow for&nbsp;
                  <span style={{ color: "#ffcc00" }}>+{tomorrowReward} MCK!</span>
                </p>
                {countdown ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        display: "inline-block",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#ff6b00",
                        animation: "dlrDot 1.5s ease-in-out infinite",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.32)",
                      }}
                    >
                      {countdown}
                    </span>
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    Almost time — stay ready!
                  </p>
                )}
              </div>
              {/* Next day badge */}
              {next_streak_day < 7 && (
                <div
                  className="flex flex-col items-center rounded-lg flex-shrink-0"
                  style={{
                    padding: "6px 10px",
                    background: "rgba(255,100,0,0.12)",
                    border: "1px solid rgba(255,100,0,0.22)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      color: "rgba(255,140,0,0.65)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Day
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#ff8800",
                      lineHeight: 1.1,
                    }}
                  >
                    {next_streak_day + 1}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── CLAIMABLE: reward display + big claim button ── */
          <div>
            <div className="flex items-end justify-between gap-4 mb-4">

              {/* Reward amount */}
              <div>
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.27)",
                    marginBottom: 5,
                  }}
                >
                  Today's Reward
                </p>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 48,
                    fontWeight: 800,
                    lineHeight: 1,
                    background: "linear-gradient(135deg, #ffb300 25%, #ff6b00 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  +{next_reward}
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>
                  MCK Points
                </p>
                {next_streak_day === 7 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#ff8800",
                      background: "rgba(255,100,0,0.1)",
                      border: "1px solid rgba(255,100,0,0.22)",
                      borderRadius: 20,
                      padding: "3px 10px",
                      marginTop: 8,
                      animation: "dlrBadgePulse 2.5s ease-in-out infinite",
                    }}
                  >
                    ⭐ 7-day bonus!
                  </span>
                )}
              </div>

              {/* ── Claim button ── */}
              <button
                onClick={handleClaim}
                disabled={claiming}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "15px 26px",
                  minWidth: 110,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #ffb300, #ff6b00)",
                  border: "none",
                  color: "#0c0c0e",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "'DM Sans','Inter',sans-serif",
                  cursor: claiming ? "not-allowed" : "pointer",
                  opacity: claiming ? 0.75 : 1,
                  boxShadow: "0 4px 22px rgba(255,160,0,0.42)",
                  transition: "transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, opacity 0.2s",
                  animation: !claiming ? "dlrBtnPulse 2.6s ease-in-out infinite" : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!claiming) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 30px rgba(255,160,0,0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 22px rgba(255,160,0,0.42)";
                }}
                onMouseDown={(e) => {
                  if (!claiming) e.currentTarget.style.transform = "scale(0.96)";
                }}
                onMouseUp={(e) => {
                  if (!claiming) e.currentTarget.style.transform = "scale(1.04)";
                }}
              >
                {/* Shimmer sweep */}
                {!claiming && (
                  <span
                    style={{
                      pointerEvents: "none",
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%)",
                      backgroundSize: "250% 100%",
                      animation: "dlrShimmer 2.8s ease-in-out infinite",
                    }}
                  />
                )}
                {claiming ? (
                  <span style={{ animation: "dlrSpin 0.9s linear infinite", fontSize: 16 }}>
                    ◌
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: 15 }}>🎁</span> Claim
                  </>
                )}
              </button>
            </div>

            {/* Tomorrow teaser (even before claiming — motivates action) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "9px 13px",
                fontSize: 11,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              <span>💡</span>
              <span>
                Claim daily to keep your streak · Tomorrow:&nbsp;
                <strong style={{ color: "rgba(255,179,0,0.65)" }}>+{tomorrowReward} MCK</strong>
              </span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            STATS ROW
        ════════════════════════════════════════ */}
        {total_claims > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.05)",
                margin: "16px 0 14px",
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: longest_streak, label: "Best Streak", icon: "🏆" },
                { val: total_claims, label: "Total Claims", icon: "✅" },
                { val: total_points_earned, label: "MCK Points", icon: "⭐" },
              ].map(({ val, label, icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-xl"
                  style={{
                    padding: "10px 4px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.055)",
                  }}
                >
                  <span style={{ fontSize: 13, marginBottom: 3 }}>{icon}</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#f0f0f0",
                      lineHeight: 1,
                    }}
                  >
                    {val}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.24)",
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Keyframes — kept minimal, CSS-only ── */}
      <style>{`
        @keyframes dlrBtnPulse {
          0%, 100% { box-shadow: 0 4px 22px rgba(255,160,0,0.38); }
          50%       { box-shadow: 0 4px 34px rgba(255,160,0,0.65); }
        }
        @keyframes dlrShimmer {
          0%   { background-position: 250% center; }
          100% { background-position: -250% center; }
        }
        @keyframes dlrBadgePulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: .75; transform: scale(1.03); }
        }
        @keyframes dlrDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .28; transform: scale(0.6); }
        }
        @keyframes dlrPop {
          0%   { transform: scale(0.75); }
          60%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes dlrSpin {
          to { transform: rotate(360deg); }
        }
        /* 4 confetti trajectories — randomised by particle index */
        @keyframes dlrCf0 {
          0%   { opacity:1; transform:translate(0,0) scale(1) rotate(0deg); }
          100% { opacity:0; transform:translate(-70px,-110px) scale(0.15) rotate(200deg); }
        }
        @keyframes dlrCf1 {
          0%   { opacity:1; transform:translate(0,0) scale(1) rotate(0deg); }
          100% { opacity:0; transform:translate(70px,-120px) scale(0.15) rotate(-160deg); }
        }
        @keyframes dlrCf2 {
          0%   { opacity:1; transform:translate(0,0) scale(1) rotate(0deg); }
          100% { opacity:0; transform:translate(-30px,-140px) scale(0.15) rotate(110deg); }
        }
        @keyframes dlrCf3 {
          0%   { opacity:1; transform:translate(0,0) scale(1) rotate(0deg); }
          100% { opacity:0; transform:translate(40px,-100px) scale(0.15) rotate(-240deg); }
        }
      `}</style>
    </div>
  );
};

export default DailyLoginReward;
