import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Gift, Flame, Sparkles, Loader2, Check, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface DailyLoginRewardProps {
  variant?: "default" | "compact";
  className?: string;
}

const formatCountdown = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const STREAK_DAYS = Array.from({ length: 7 }, (_, i) => i + 1);

const DailyLoginReward: React.FC<DailyLoginRewardProps> = ({
  variant = "default",
  className,
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_daily_reward_status");
    if (!error && data && (data as any).success) {
      setStatus(data as unknown as RewardStatus);
      setClaimed(!(data as any).can_claim);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!status?.next_claim_at || status.can_claim) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const remaining = new Date(status.next_claim_at!).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown("");
        fetchStatus();
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  const handleClaim = async () => {
    if (!user || claiming || claimed) return;
    setClaiming(true);
    try {
      const userAgent = navigator.userAgent;
      const { data, error } = await supabase.rpc("claim_daily_reward", {
        p_ip_address: null,
        p_user_agent: userAgent,
      });

      if (error) throw error;
      const result = data as any;

      if (!result?.success) {
        toast({
          title: "Cannot claim yet",
          description: result?.error || "Try again later",
          variant: "destructive",
        });
      } else {
        toast({
          title: `+${result.points_awarded} MCK Points! 🎉`,
          description: result.message,
        });
        setClaimed(true);
        await fetchStatus();
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

  if (!user) return null;

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-3xl border flex items-center justify-center h-48",
          className
        )}
        style={{
          background: "#0d0d0f",
          borderColor: "rgba(255,179,0,0.12)",
        }}
      >
        <Loader2
          className="h-5 w-5 animate-spin"
          style={{ color: "rgba(255,179,0,0.5)" }}
        />
      </div>
    );
  }

  if (!status) return null;

  const isBonus7 = status.can_claim && status.next_streak_day === 7;

  return (
    <div
      className={cn("relative overflow-hidden rounded-3xl", className)}
      style={{
        background: "#0d0d0f",
        border: "1px solid rgba(255,179,0,0.13)",
        fontFamily: "'Syne', 'Inter', sans-serif",
      }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: -90,
          right: -90,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,179,0,0.13) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: -90,
          left: -70,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(120,80,255,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative p-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 46,
                height: 46,
                background: "rgba(255,179,0,0.10)",
                border: "1px solid rgba(255,179,0,0.18)",
              }}
            >
              <Gift className="h-5 w-5" style={{ color: "#ffb300" }} />
            </div>
            <div>
              <h3
                className="font-extrabold leading-tight"
                style={{ fontSize: 17, color: "#f5f5f5" }}
              >
                Daily Reward
              </h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
                {status.can_claim ? "Your reward is ready!" : "Come back tomorrow"}
              </p>
            </div>
          </div>

          {status.current_streak > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full"
              style={{
                background: "rgba(255,179,0,0.08)",
                border: "1px solid rgba(255,179,0,0.18)",
                padding: "5px 12px",
              }}
            >
              <Flame className="h-3.5 w-3.5" style={{ color: "#ffb300" }} />
              <span
                className="font-bold"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "#ffb300",
                }}
              >
                {status.current_streak}
              </span>
            </div>
          )}
        </div>

        {/* ── Streak Grid (7 days) ── */}
        {variant === "default" && (
          <div
            className="grid mb-6"
            style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}
          >
            {STREAK_DAYS.map((day) => {
              const isPast = day < status.next_streak_day;
              const isActive = status.can_claim && day === status.next_streak_day;
              const isFuture = !isPast && !isActive;
              const isBonus = day === 7;

              let bg = "rgba(255,255,255,0.04)";
              let border = "1px solid rgba(255,255,255,0.07)";
              let color = "rgba(255,255,255,0.2)";
              let boxShadow = "none";
              let scale = "scale(1)";

              if (isPast) {
                bg = isBonus
                  ? "rgba(255,100,0,0.10)"
                  : "rgba(255,179,0,0.10)";
                border = isBonus
                  ? "1px solid rgba(255,100,0,0.25)"
                  : "1px solid rgba(255,179,0,0.22)";
                color = isBonus ? "#ff8800" : "#ffb300";
              } else if (isActive) {
                bg = isBonus
                  ? "linear-gradient(135deg,#ffb300,#ff6b00)"
                  : "#ffb300";
                border = isBonus
                  ? "1px solid #ff8800"
                  : "1px solid #ffb300";
                color = "#0d0d0f";
                boxShadow = isBonus
                  ? "0 0 22px rgba(255,100,0,0.55)"
                  : "0 0 18px rgba(255,179,0,0.55)";
                scale = "scale(1.09)";
              }

              return (
                <div
                  key={day}
                  className="flex flex-col items-center justify-center"
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    background: bg,
                    border,
                    color,
                    boxShadow,
                    transform: scale,
                    transition: "transform 0.15s",
                    position: "relative",
                  }}
                >
                  {isBonus ? (
                    <>
                      <Sparkles
                        className="h-3 w-3"
                        style={{ color: isActive || isPast ? color : "rgba(255,255,255,0.2)" }}
                      />
                      <span style={{ fontSize: 8, fontWeight: 700, marginTop: 2, lineHeight: 1 }}>
                        +50
                      </span>
                    </>
                  ) : isPast ? (
                    <Check className="h-3 w-3" />
                  ) : isActive ? (
                    <Gift className="h-3 w-3" />
                  ) : (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Points + CTA ── */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.32)",
                marginBottom: 2,
              }}
            >
              Today's Reward
            </p>
            <div
              className="font-extrabold leading-none"
              style={{
                fontSize: 52,
                background: "linear-gradient(135deg, #ffb300 30%, #ff8800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              +{status.next_reward}
            </div>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.28)",
                marginTop: 2,
              }}
            >
              MCK Points
            </p>

            {isBonus7 && (
              <div
                className="inline-flex items-center gap-1 rounded-full mt-2"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#ff8800",
                  background: "rgba(255,100,0,0.10)",
                  border: "1px solid rgba(255,100,0,0.20)",
                  padding: "3px 10px",
                }}
              >
                <Sparkles className="h-3 w-3" />
                7-day bonus included!
              </div>
            )}

            {!status.can_claim && countdown && (
              <p
                className="mt-1"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                Next in {countdown}
              </p>
            )}
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={!status.can_claim || claiming || claimed}
            className="flex items-center gap-2 rounded-2xl font-extrabold transition-all"
            style={{
              fontFamily: "'Syne', 'Inter', sans-serif",
              fontSize: 14,
              padding: "14px 24px",
              minWidth: 115,
              justifyContent: "center",
              border: "none",
              cursor: status.can_claim && !claimed ? "pointer" : "not-allowed",
              ...(status.can_claim && !claimed
                ? {
                    background: "linear-gradient(135deg, #ffb300, #ff6b00)",
                    color: "#0d0d0f",
                    boxShadow: "0 4px 24px rgba(255,179,0,0.45)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.28)",
                  }),
            }}
          >
            {claiming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : claimed || !status.can_claim ? (
              <>
                <Check className="h-4 w-4" />
                Claimed
              </>
            ) : (
              <>
                <Gift className="h-4 w-4" />
                Claim
              </>
            )}
          </button>
        </div>

        {/* ── Stats Footer ── */}
        {variant === "default" && status.total_claims > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.06)",
                marginBottom: 16,
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  val: status.longest_streak,
                  label: "Best Streak",
                  icon: <Flame className="h-3 w-3" style={{ color: "#ffb300" }} />,
                },
                {
                  val: status.total_claims,
                  label: "Claims",
                  icon: <Check className="h-3 w-3" style={{ color: "#ffb300" }} />,
                },
                {
                  val: status.total_points_earned,
                  label: "MCK Points",
                  icon: <Trophy className="h-3 w-3" style={{ color: "#ffb300" }} />,
                },
              ].map(({ val, label, icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-xl py-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="flex items-center gap-1 font-bold"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 17,
                      color: "#f5f5f5",
                    }}
                  >
                    {icon}
                    {val}
                  </div>
                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                      marginTop: 3,
                    }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyLoginReward;
