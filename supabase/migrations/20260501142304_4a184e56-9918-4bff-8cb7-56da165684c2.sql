
-- Ensure pg_net & vault available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Store service role key in Vault (will be set by user via UI/secret).
-- We use a settings table fallback for the project URL.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_url') THEN
    PERFORM vault.create_secret('https://mtaeqtmcixlrudjsxcew.supabase.co', 'project_url');
  END IF;
END $$;

-- Helper to read a vault secret safely
CREATE OR REPLACE FUNCTION public.get_vault_secret(p_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = p_name LIMIT 1;
$$;

-- Rewrite notify_on_message to read service_role_key from Vault
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  receiver uuid;
  v_url text;
  v_key text;
  v_sender_name text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF v_url IS NULL OR v_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Detect receiver (works for both conversations and pg_conversations)
  SELECT CASE WHEN c.buyer_id = NEW.sender_id THEN c.seller_id ELSE c.buyer_id END
    INTO receiver
  FROM conversations c WHERE c.id = NEW.conversation_id;

  IF receiver IS NULL THEN
    SELECT CASE WHEN pc.buyer_id = NEW.sender_id THEN pc.seller_id ELSE pc.buyer_id END
      INTO receiver
    FROM pg_conversations pc WHERE pc.id = NEW.conversation_id;
  END IF;

  IF receiver IS NULL OR receiver = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name
  FROM profiles WHERE user_id = NEW.sender_id;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-key', v_key
    ),
    body := jsonb_build_object(
      'user_id', receiver,
      'title', '💬 ' || v_sender_name,
      'body', LEFT(NEW.content, 120),
      'url', '/chat/' || NEW.conversation_id
    )
  );

  RETURN NEW;
END;
$$;

-- Notify seller when their item is "published" (created)
CREATE OR REPLACE FUNCTION public.notify_on_item_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  IF v_url IS NULL OR v_key IS NULL THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json','x-internal-key', v_key),
    body := jsonb_build_object(
      'user_id', NEW.seller_id,
      'title', '✅ Listing published',
      'body', 'Your item "' || LEFT(NEW.title, 80) || '" is now live!',
      'url', '/item/' || NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_item_published ON public.items;
CREATE TRIGGER trigger_item_published
AFTER INSERT ON public.items
FOR EACH ROW EXECUTE FUNCTION public.notify_on_item_published();

-- Notify seller when someone places an order (item bought / reserved)
CREATE OR REPLACE FUNCTION public.notify_on_order_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_key text;
  v_title text;
  v_buyer_name text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  IF v_url IS NULL OR v_key IS NULL THEN RETURN NEW; END IF;

  SELECT title INTO v_title FROM items WHERE id = NEW.item_id;
  SELECT COALESCE(full_name, 'A buyer') INTO v_buyer_name FROM profiles WHERE user_id = NEW.buyer_id;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json','x-internal-key', v_key),
    body := jsonb_build_object(
      'user_id', NEW.seller_id,
      'title', '🛒 New order!',
      'body', v_buyer_name || ' wants to buy "' || COALESCE(LEFT(v_title,60),'your item') || '"',
      'url', '/my-orders'
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_order_created ON public.orders;
CREATE TRIGGER trigger_order_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_created();

-- Notify both parties when order completes
CREATE OR REPLACE FUNCTION public.notify_on_order_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  IF v_url IS NULL OR v_key IS NULL THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json','x-internal-key', v_key),
    body := jsonb_build_object(
      'user_id', NEW.seller_id,
      'title', '🎉 Sale completed!',
      'body', 'Your transaction is complete. +10 MCK points awarded!',
      'url', '/my-orders'
    )
  );

  PERFORM net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json','x-internal-key', v_key),
    body := jsonb_build_object(
      'user_id', NEW.buyer_id,
      'title', '🎉 Purchase complete!',
      'body', 'Order confirmed. +5 MCK points awarded!',
      'url', '/my-orders'
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_order_completed ON public.orders;
CREATE TRIGGER trigger_order_completed
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_completed();
