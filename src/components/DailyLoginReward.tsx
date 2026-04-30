import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Gift, Flame, Sparkles, Loader2, Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const DailyLoginReward: React.FC<DailyLoginRewardProps> = ({ variant = "default", className }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

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

  // Countdown timer
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
    if (!user || claiming) return;
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
      <div className={cn("rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-center h-32", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!status) return null;

  const streakDays = Array.from({ length: 7 }, (_, i) => i + 1);
  const displayStreak = status.can_claim ? status.next_streak_day : status.current_streak;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 shadow-sm",
        "bg-gradient-to-br from-primary/10 via-card to-amber-500/5",
        className,
      )}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="relative p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-foreground leading-tight">
                Daily Login Reward
              </h3>
              <p className="text-xs text-muted-foreground">
                {status.can_claim ? "Your reward is ready!" : "Come back tomorrow"}
              </p>
            </div>
          </div>
          {status.current_streak > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
              <Flame className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{status.current_streak}</span>
            </div>
          )}
        </div>

        {/* Streak progress (7 days) */}
        {variant === "default" && (
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {streakDays.map((day) => {
              const isCompleted = day <= status.current_streak;
              const isNext = status.can_claim && day === status.next_streak_day;
              const isBonus = day === 7;
              return (
                <div
                  key={day}
                  className={cn(
                    "relative aspect-square rounded-lg border flex flex-col items-center justify-center transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isNext && !isCompleted && "border-primary border-2 bg-primary/10 text-primary scale-105",
                    !isCompleted && !isNext && "border-border/50 bg-muted/30 text-muted-foreground",
                  )}
                >
                  {isBonus ? (
                    <Sparkles className={cn("h-3 w-3", isCompleted ? "" : "text-amber-500")} />
                  ) : isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="text-[10px] font-bold">{day}</span>
                  )}
                  {isBonus && (
                    <span className="text-[8px] font-bold leading-none mt-0.5">+50</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reward amount + CTA */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                +{status.next_reward}
              </span>
              <span className="text-sm font-medium text-muted-foreground">MCK Points</span>
            </div>
            {status.next_streak_day === 7 && status.can_claim && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> 7-day bonus included!
              </p>
            )}
            {!status.can_claim && countdown && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Next claim in {countdown}
              </p>
            )}
          </div>

          <Button
            onClick={handleClaim}
            disabled={!status.can_claim || claiming}
            size="lg"
            className={cn(
              "rounded-xl font-semibold shadow-md",
              status.can_claim && "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90",
            )}
          >
            {claiming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status.can_claim ? (
              <>
                <Gift className="h-4 w-4" />
                Claim
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Claimed
              </>
            )}
          </Button>
        </div>

        {/* Stats footer */}
        {variant === "default" && status.total_claims > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-base font-bold text-foreground">{status.longest_streak}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Best streak</p>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">{status.total_claims}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Claims</p>
            </div>
            <div>
              <p className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                <Trophy className="h-3 w-3 text-amber-500" />
                {status.total_points_earned}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Earned</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyLoginReward;
