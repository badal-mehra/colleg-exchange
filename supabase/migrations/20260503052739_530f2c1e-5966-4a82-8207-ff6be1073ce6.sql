
-- 1) Fix privilege-escalation trigger to allow trusted SECURITY DEFINER RPCs
-- We use a per-transaction GUC flag that only our RPCs can set.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bypass text;
BEGIN
  -- Allow service role / no-auth contexts
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Allow trusted internal functions that set this flag
  BEGIN
    v_bypass := current_setting('app.bypass_profile_guard', true);
  EXCEPTION WHEN OTHERS THEN
    v_bypass := NULL;
  END;
  IF v_bypass = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.campus_points IS DISTINCT FROM OLD.campus_points
     OR NEW.points IS DISTINCT FROM OLD.points
     OR NEW.lifetime_points IS DISTINCT FROM OLD.lifetime_points
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.verification_document_url IS DISTINCT FROM OLD.verification_document_url
     OR NEW.trust_seller_badge IS DISTINCT FROM OLD.trust_seller_badge
     OR NEW.deals_completed IS DISTINCT FROM OLD.deals_completed
     OR NEW.badge IS DISTINCT FROM OLD.badge
     OR NEW.rank IS DISTINCT FROM OLD.rank
     OR NEW.mck_id IS DISTINCT FROM OLD.mck_id
  THEN
    RAISE EXCEPTION 'Not authorized to modify protected profile fields';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Patch claim_daily_reward to set bypass flag before touching profiles
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
RETURNS jsonb
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

  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  INSERT INTO public.user_login_streaks (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_streak
  FROM public.user_login_streaks
  WHERE user_id = v_user_id
  FOR UPDATE;

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

  IF v_streak.last_claim_at IS NULL OR v_hours_since_last > 48 THEN
    v_new_streak := 1;
  ELSE
    v_new_streak := v_streak.current_streak + 1;
  END IF;

  v_streak_bonus := (v_new_streak - 1) * 5;
  v_total_points := v_base_points + v_streak_bonus;

  IF v_new_streak = 7 THEN
    v_seven_day_bonus := 50;
    v_total_points := v_total_points + v_seven_day_bonus;
    v_bonus_applied := true;
  END IF;

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

  UPDATE public.profiles
  SET 
    points = COALESCE(points, 0) + v_total_points,
    lifetime_points = COALESCE(lifetime_points, 0) + v_total_points,
    campus_points = COALESCE(campus_points, 0) + v_total_points,
    updated_at = v_now
  WHERE user_id = v_user_id;

  INSERT INTO public.points_history (user_id, points, reason)
  VALUES (v_user_id, v_total_points, 'Daily login reward (day ' || v_new_streak || ')');

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

-- 3) Patch other point-awarding functions to bypass guard
CREATE OR REPLACE FUNCTION public.award_points(p_user_id uuid, p_action text, p_points integer, p_item_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_points integer;
  v_new_lifetime integer;
BEGIN
  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles
  SET 
    points = points + p_points,
    lifetime_points = lifetime_points + p_points
  WHERE user_id = p_user_id
  RETURNING points, lifetime_points INTO v_new_points, v_new_lifetime;

  INSERT INTO public.transactions (
    item_id, seller_id, buyer_id, amount, status, points_awarded, transaction_type
  ) VALUES (
    p_item_id, p_user_id, p_user_id, 0, 'completed', p_points, p_action
  );

  RETURN jsonb_build_object('success', true, 'points', v_new_points, 'lifetime_points', v_new_lifetime);
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_points_for_upgrade(p_user_id uuid, p_item_id uuid, p_ad_type text, p_points_cost integer, p_duration_days integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points integer;
  v_transaction_id uuid;
BEGIN
  SELECT points INTO v_current_points FROM public.profiles WHERE user_id = p_user_id;
  IF v_current_points < p_points_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET points = points - p_points_cost WHERE user_id = p_user_id;

  INSERT INTO public.transactions (
    item_id, seller_id, buyer_id, amount, status, points_awarded, transaction_type
  ) VALUES (
    p_item_id, p_user_id, p_user_id, p_points_cost, 'completed', -p_points_cost, 'ad_upgrade'
  ) RETURNING id INTO v_transaction_id;

  UPDATE public.items
  SET ad_type = p_ad_type,
      promotion_expires_at = now() + (p_duration_days || ' days')::interval,
      is_promoted = true,
      ad_price_paid = p_points_cost,
      upgrade_transaction_id = v_transaction_id
  WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true, 'message', 'Upgrade successful', 'remaining_points', v_current_points - p_points_cost);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_order_with_confirmation(order_id uuid, confirming_user_id uuid, user_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    order_record record;
    confirmation_column text;
    message_out text;
    v_seller_deals integer;
BEGIN
    SELECT * INTO order_record FROM orders WHERE id = order_id FOR UPDATE;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Order not found.'); END IF;
    IF order_record.status = 'cancelled' THEN RETURN json_build_object('success', false, 'error', 'Order has been cancelled and cannot be confirmed.'); END IF;
    IF order_record.status = 'completed' THEN RETURN json_build_object('success', false, 'error', 'Order is already completed.'); END IF;

    IF user_type = 'seller' AND order_record.seller_id = confirming_user_id THEN
        confirmation_column := 'seller_confirmed';
    ELSIF user_type = 'buyer' AND order_record.buyer_id = confirming_user_id THEN
        confirmation_column := 'buyer_confirmed';
    ELSE
        RETURN json_build_object('success', false, 'error', 'User not authorized for this role on this order.');
    END IF;

    IF (confirmation_column = 'seller_confirmed' AND order_record.seller_confirmed) OR
       (confirmation_column = 'buyer_confirmed' AND order_record.buyer_confirmed) THEN
        RETURN json_build_object('success', false, 'error', 'You have already confirmed this order.');
    END IF;

    EXECUTE format('UPDATE orders SET %I = true, %I = now() WHERE id = %L',
        confirmation_column,
        CASE WHEN confirmation_column = 'seller_confirmed' THEN 'seller_confirmed_at' ELSE 'buyer_confirmed_at' END,
        order_id);

    SELECT * INTO order_record FROM orders WHERE id = order_id;

    IF order_record.seller_confirmed AND order_record.buyer_confirmed THEN
        UPDATE orders SET status = 'completed', updated_at = now() WHERE id = order_id;
        UPDATE items SET is_sold = true, status = 'sold', updated_at = now() WHERE id = order_record.item_id;

        PERFORM set_config('app.bypass_profile_guard', 'on', true);

        UPDATE profiles
        SET deals_completed = deals_completed + 1,
            campus_points = campus_points + 10,
            points = COALESCE(points,0) + 10,
            lifetime_points = COALESCE(lifetime_points,0) + 10,
            trust_seller_badge = CASE WHEN (deals_completed + 1) >= 7 THEN true ELSE trust_seller_badge END,
            updated_at = now()
        WHERE user_id = order_record.seller_id
        RETURNING deals_completed INTO v_seller_deals;

        UPDATE profiles
        SET deals_completed = deals_completed + 1,
            campus_points = campus_points + 5,
            points = COALESCE(points,0) + 5,
            lifetime_points = COALESCE(lifetime_points,0) + 5,
            updated_at = now()
        WHERE user_id = order_record.buyer_id;

        message_out := 'Transaction completed! Item marked as sold.';
        RETURN json_build_object('success', true, 'message', message_out, 'both_confirmed', true, 'seller_deals', v_seller_deals);
    ELSE
        message_out := 'Your confirmation recorded. Waiting for the other party.';
        RETURN json_build_object('success', true, 'message', message_out, 'both_confirmed', false);
    END IF;
END;
$$;

-- 4) Patch complete_order similarly
CREATE OR REPLACE FUNCTION public.complete_order(order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.status != 'pending' THEN RETURN jsonb_build_object('success', false, 'error', 'Order already processed'); END IF;

  SELECT * INTO v_item FROM public.items WHERE id = v_order.item_id;

  UPDATE public.orders SET status = 'completed', qr_used = TRUE, updated_at = now() WHERE id = order_id;
  UPDATE public.items SET is_sold = TRUE, updated_at = now() WHERE id = v_order.item_id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  UPDATE public.profiles 
  SET campus_points = campus_points + 10,
      points = COALESCE(points,0) + 10,
      lifetime_points = COALESCE(lifetime_points,0) + 10,
      deals_completed = deals_completed + 1,
      trust_seller_badge = CASE WHEN (deals_completed + 1) >= 7 THEN TRUE ELSE trust_seller_badge END
  WHERE user_id = v_order.seller_id;

  UPDATE public.profiles 
  SET campus_points = campus_points + 3,
      points = COALESCE(points,0) + 3,
      lifetime_points = COALESCE(lifetime_points,0) + 3
  WHERE user_id = v_order.buyer_id;

  INSERT INTO public.transactions (item_id, seller_id, buyer_id, amount, status, points_awarded)
  VALUES (v_order.item_id, v_order.seller_id, v_order.buyer_id, v_item.price, 'completed', 10);

  RETURN jsonb_build_object('success', true, 'message', 'Order completed successfully');
END;
$$;

-- 5) Award MCK points on KYC approval + auto trust badge at 7 deals
CREATE OR REPLACE FUNCTION public.on_profile_changes_award()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_award integer := 25; -- MCK points awarded on verification approval
BEGIN
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  -- Award points the first time verification flips to approved
  IF NEW.verification_status = 'approved'
     AND COALESCE(OLD.verification_status, '') <> 'approved' THEN
    NEW.is_verified := true;
    NEW.points := COALESCE(NEW.points, 0) + v_award;
    NEW.lifetime_points := COALESCE(NEW.lifetime_points, 0) + v_award;
    NEW.campus_points := COALESCE(NEW.campus_points, 0) + v_award;

    INSERT INTO public.points_history (user_id, points, reason)
    VALUES (NEW.user_id, v_award, 'KYC verified bonus');
  END IF;

  -- Auto trust seller badge at >= 7 deals
  IF COALESCE(NEW.deals_completed, 0) >= 7 THEN
    NEW.trust_seller_badge := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_changes_award_trigger ON public.profiles;
CREATE TRIGGER profile_changes_award_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.on_profile_changes_award();
