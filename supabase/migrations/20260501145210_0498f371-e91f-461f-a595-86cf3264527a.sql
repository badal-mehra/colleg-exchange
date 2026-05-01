-- Keep only the newest push subscription per user before adding uniqueness
DELETE FROM public.push_subscriptions ps
USING public.push_subscriptions newer
WHERE ps.user_id = newer.user_id
  AND ps.created_at < newer.created_at;

-- Ensure save-push can upsert one current subscription per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'push_subscriptions_user_id_unique'
      AND conrelid = 'public.push_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Wire notification trigger functions to the tables
DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_message();

DROP TRIGGER IF EXISTS trg_notify_on_item_published ON public.items;
CREATE TRIGGER trg_notify_on_item_published
AFTER INSERT ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_item_published();

DROP TRIGGER IF EXISTS trg_notify_on_order_created ON public.orders;
CREATE TRIGGER trg_notify_on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order_created();

DROP TRIGGER IF EXISTS trg_notify_on_order_completed ON public.orders;
CREATE TRIGGER trg_notify_on_order_completed
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order_completed();