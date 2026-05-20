
-- Add is_read column to notifications for unread tracking
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read, created_at DESC);

-- Allow users to mark their own notifications as read
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to insert notifications (broadcast)
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Admin broadcast RPC: sends in-app notification + triggers push
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  p_title text,
  p_body text,
  p_url text DEFAULT '/dashboard',
  p_target_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid;
  v_count integer := 0;
  v_url text;
  v_key text;
  r record;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL OR NOT public.is_admin(v_caller) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF p_target_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, url, type)
    VALUES (p_target_user_id, p_title, p_body, COALESCE(p_url,'/dashboard'), 'admin');
    v_count := 1;

    IF v_url IS NOT NULL AND v_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_url || '/functions/v1/send-push',
        headers := jsonb_build_object('Content-Type','application/json','x-internal-key', v_key),
        body := jsonb_build_object(
          'user_id', p_target_user_id,
          'title', p_title,
          'body', p_body,
          'url', COALESCE(p_url,'/dashboard'),
          'skip_insert', true
        )
      );
    END IF;
  ELSE
    -- Broadcast to all users with a profile
    FOR r IN SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL LOOP
      INSERT INTO public.notifications (user_id, title, body, url, type)
      VALUES (r.user_id, p_title, p_body, COALESCE(p_url,'/dashboard'), 'admin');
      v_count := v_count + 1;
    END LOOP;

    -- Fire push for users who have a subscription
    IF v_url IS NOT NULL AND v_key IS NOT NULL THEN
      FOR r IN SELECT user_id FROM public.push_subscriptions LOOP
        PERFORM net.http_post(
          url := v_url || '/functions/v1/send-push',
          headers := jsonb_build_object('Content-Type','application/json','x-internal-key', v_key),
          body := jsonb_build_object(
            'user_id', r.user_id,
            'title', p_title,
            'body', p_body,
            'url', COALESCE(p_url,'/dashboard'),
            'skip_insert', true
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'recipients', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text, text, uuid) TO authenticated;
