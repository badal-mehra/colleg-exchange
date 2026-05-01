DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

DROP TRIGGER IF EXISTS trg_notify_on_item_published ON public.items;
CREATE TRIGGER trg_notify_on_item_published
AFTER INSERT ON public.items
FOR EACH ROW EXECUTE FUNCTION public.notify_on_item_published();

DROP TRIGGER IF EXISTS trg_notify_on_order_created ON public.orders;
CREATE TRIGGER trg_notify_on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_created();

DROP TRIGGER IF EXISTS trg_notify_on_order_completed ON public.orders;
CREATE TRIGGER trg_notify_on_order_completed
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_completed();