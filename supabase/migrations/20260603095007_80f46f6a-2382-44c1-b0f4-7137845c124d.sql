
-- Drop legacy duplicate triggers (the trg_notify_on_* versions remain active)
DROP TRIGGER IF EXISTS trigger_item_published ON public.items;
DROP TRIGGER IF EXISTS trigger_order_created ON public.orders;
DROP TRIGGER IF EXISTS trigger_order_completed ON public.orders;

-- Cleanup function: delete notifications older than 9 days
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.notifications WHERE created_at < (now() - interval '9 days');
$$;

-- Enable pg_cron and schedule daily cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-notifications') THEN
    PERFORM cron.unschedule('cleanup-old-notifications');
  END IF;
  PERFORM cron.schedule(
    'cleanup-old-notifications',
    '0 3 * * *',
    $cron$ SELECT public.cleanup_old_notifications(); $cron$
  );
END $$;

-- Immediate purge of pre-existing old notifications
SELECT public.cleanup_old_notifications();
