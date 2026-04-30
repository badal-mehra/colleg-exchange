-- Streak tracking (one row per user)
CREATE TABLE public.user_login_streaks (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_claim_at TIMESTAMPTZ,
  last_claim_date DATE,
  total_claims INTEGER NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak"
  ON public.user_login_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streaks"
  ON public.user_login_streaks FOR SELECT
  USING (is_admin(auth.uid()));

-- Audit log of every claim (for abuse review)
CREATE TABLE public.daily_login_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points_awarded INTEGER NOT NULL,
  streak_day INTEGER NOT NULL,
  bonus_applied BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_login_rewards_user ON public.daily_login_rewards(user_id, claimed_at DESC);

ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claim history"
  ON public.daily_login_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all claim history"
  ON public.daily_login_rewards FOR SELECT
  USING (is_admin(auth.uid()));

-- Server-side claim function with 24h lock + streak logic
CREATE OR REPLACE FUNCTION public.claim_daily_reward(
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_streak RECORD;
  v_now TIMESTAMPTZ := now();
  v_new_streak INTEGER;
  v_base_points INTEGER := 10;
  v_streak_bonus INTEGER;
  v_seven_day_bonus INTEGER := 0;
  v_total_points INTEGER;
  v_hours_since_last NUMERIC;
  v_bonus_applied BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Lock user streak row (create if missing)
  INSERT INTO public.user_login_streaks (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_streak
  FROM public.user_login_streaks
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- 24-hour lock
  IF v_streak.last_claim_at IS NOT NULL THEN
    v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_streak.last_claim_at)) / 3600;
    IF v_hours_since_last < 24 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Already claimed. Try again later.',
        'next_claim_at', v_streak.last_claim_at + interval '24 hours',
        'current_streak', v_streak.current_streak
      );
    END IF;
  END IF;

  -- Streak: continue if last claim was within 48h, else reset
  IF v_streak.last_claim_at IS NULL OR v_hours_since_last > 48 THEN
    v_new_streak := 1;
  ELSE
    v_new_streak := v_streak.current_streak + 1;
  END IF;

  -- Reward formula: 10 + (streak-1)*5
  v_streak_bonus := (v_new_streak - 1) * 5;
  v_total_points := v_base_points + v_streak_bonus;

  -- 7-day bonus
  IF v_new_streak = 7 THEN
    v_seven_day_bonus := 50;
    v_total_points := v_total_points + v_seven_day_bonus;
    v_bonus_applied := true;
  END IF;

  -- Update streak
  UPDATE public.user_login_streaks
  SET 
    current_streak = CASE WHEN v_new_streak >= 7 THEN 0 ELSE v_new_streak END,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_claim_at = v_now,
    last_claim_date = v_now::date,
    total_claims = total_claims + 1,
    total_points_earned = total_points_earned + v_total_points,
    updated_at = v_now
  WHERE user_id = v_user_id;

  -- Award points (updates leaderboard via lifetime_points)
  UPDATE public.profiles
  SET 
    points = COALESCE(points, 0) + v_total_points,
    lifetime_points = COALESCE(lifetime_points, 0) + v_total_points,
    campus_points = COALESCE(campus_points, 0) + v_total_points,
    updated_at = v_now
  WHERE user_id = v_user_id;

  -- Points history (used by monthly leaderboard)
  INSERT INTO public.points_history (user_id, points, reason)
  VALUES (v_user_id, v_total_points, 'Daily login reward (day ' || v_new_streak || ')');

  -- Audit log
  INSERT INTO public.daily_login_rewards (
    user_id, points_awarded, streak_day, bonus_applied, ip_address, user_agent
  ) VALUES (
    v_user_id, v_total_points, v_new_streak, v_bonus_applied, p_ip_address, p_user_agent
  );

  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_total_points,
    'base_points', v_base_points,
    'streak_bonus', v_streak_bonus,
    'seven_day_bonus', v_seven_day_bonus,
    'streak_day', v_new_streak,
    'next_claim_at', v_now + interval '24 hours',
    'message', CASE 
      WHEN v_new_streak = 7 THEN '🎉 7-day streak! Big bonus unlocked!'
      ELSE 'Reward claimed!'
    END
  );
END;
$$;

-- Helper: get current claim status without claiming
CREATE OR REPLACE FUNCTION public.get_daily_reward_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_streak RECORD;
  v_can_claim BOOLEAN;
  v_next_streak INTEGER;
  v_next_reward INTEGER;
  v_hours NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_streak FROM public.user_login_streaks WHERE user_id = v_user_id;

  IF v_streak IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'can_claim', true,
      'current_streak', 0,
      'next_streak_day', 1,
      'next_reward', 10,
      'last_claim_at', null,
      'next_claim_at', null
    );
  END IF;

  v_hours := CASE 
    WHEN v_streak.last_claim_at IS NULL THEN 999
    ELSE EXTRACT(EPOCH FROM (now() - v_streak.last_claim_at)) / 3600
  END;
  v_can_claim := v_hours >= 24;

  -- Compute next streak day preview
  IF v_streak.last_claim_at IS NULL OR v_hours > 48 THEN
    v_next_streak := 1;
  ELSE
    v_next_streak := COALESCE(v_streak.current_streak, 0) + 1;
  END IF;

  v_next_reward := 10 + (v_next_streak - 1) * 5;
  IF v_next_streak = 7 THEN
    v_next_reward := v_next_reward + 50;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'can_claim', v_can_claim,
    'current_streak', COALESCE(v_streak.current_streak, 0),
    'longest_streak', COALESCE(v_streak.longest_streak, 0),
    'total_claims', COALESCE(v_streak.total_claims, 0),
    'total_points_earned', COALESCE(v_streak.total_points_earned, 0),
    'next_streak_day', v_next_streak,
    'next_reward', v_next_reward,
    'last_claim_at', v_streak.last_claim_at,
    'next_claim_at', CASE 
      WHEN v_streak.last_claim_at IS NULL THEN NULL
      ELSE v_streak.last_claim_at + interval '24 hours'
    END
  );
END;
$$;

-- Update timestamp trigger
CREATE TRIGGER update_user_login_streaks_updated_at
  BEFORE UPDATE ON public.user_login_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();