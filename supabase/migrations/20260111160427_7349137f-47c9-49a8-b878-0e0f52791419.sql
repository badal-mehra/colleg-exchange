-- =====================================================
-- SECURITY FIX: Remove permissive INSERT policy on points_history
-- This prevents users from inserting arbitrary point records
-- =====================================================

-- Drop the dangerous INSERT policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "allow authenticated inserts" ON public.points_history;

-- Ensure SELECT is restricted to authenticated users only (not public)
DROP POLICY IF EXISTS "Allow public read for leaderboard" ON public.points_history;
CREATE POLICY "Authenticated users can view points history" ON public.points_history
FOR SELECT TO authenticated USING (true);

-- Add database constraints for data integrity
DO $$
BEGIN
  -- Add constraint for reasonable point values if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'points_reasonable'
  ) THEN
    ALTER TABLE public.points_history 
    ADD CONSTRAINT points_reasonable CHECK (points BETWEEN -1000 AND 1000);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- SECURITY FIX: Add auth checks to messaging functions
-- Prevents users from accessing other users' unread counts or marking their messages
-- =====================================================

-- Fix get_unread_count to validate caller is the user
CREATE OR REPLACE FUNCTION public.get_unread_count(conv_id uuid, uid uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is the user in question
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != uid THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check unread count for other users';
  END IF;
  
  RETURN (
    SELECT COUNT(*)
    FROM messages
    WHERE conversation_id = conv_id
      AND sender_id != uid
      AND is_read = false
  );
END;
$$;

-- Fix mark_messages_read to validate caller is the user
CREATE OR REPLACE FUNCTION public.mark_messages_read(conv_id uuid, uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is the user in question
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != uid THEN
    RAISE EXCEPTION 'Unauthorized: Cannot mark messages read for other users';
  END IF;
  
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = conv_id
    AND sender_id != uid
    AND is_read = false;
END;
$$;

-- =====================================================
-- SECURITY FIX: Add search_path to functions missing it
-- =====================================================

-- Fix notify_on_message function to have proper search_path
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
declare
  receiver uuid;
begin
  -- buyer/seller based receiver detection
  select
    case
      when c.buyer_id = NEW.sender_id then c.seller_id
      else c.buyer_id
    end
  into receiver
  from conversations c
  where c.id = NEW.conversation_id;

  -- Safety: if receiver not found
  if receiver is null then
    return NEW;
  end if;

  -- Sender should not receive notification for own message
  if receiver = NEW.sender_id then
    return NEW;
  end if;

  -- Send push notification
  perform
    net.http_post(
      url := 'https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-key', current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', receiver,
        'title', '💬 New message',
        'body', NEW.content,
        'url', '/chat/' || NEW.conversation_id
      )
    );

  return NEW;
end;
$$;

-- Fix add_points_on_completion function to have proper search_path
CREATE OR REPLACE FUNCTION public.add_points_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
  
    -- Seller gets +10 points history
    INSERT INTO points_history (user_id, points, reason, order_id)
    VALUES (NEW.seller_id, 10, 'Order completed - seller', NEW.id);

    -- Buyer gets +5 points history
    INSERT INTO points_history (user_id, points, reason, order_id)
    VALUES (NEW.buyer_id, 5, 'Order completed - buyer', NEW.id);

  END IF;

  RETURN NEW;
END;
$$;

-- Fix confirm_transaction function to have proper search_path
CREATE OR REPLACE FUNCTION public.confirm_transaction(txn_id uuid, role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  o record;
  seller_c boolean;
  buyer_c boolean;
begin
  
  -- fetch order row
  select * into o
  from public.orders
  where id = txn_id;

  if not found then
    return json_build_object('message','Order not found', 'both_confirmed', false);
  end if;

  -- update confirmation based on role
  if role = 'buyer' then
    update public.orders 
    set buyer_confirmed = true,
        buyer_confirmed_at = now()
    where id = txn_id;

  elsif role = 'seller' then
    update public.orders 
    set seller_confirmed = true,
        seller_confirmed_at = now()
    where id = txn_id;
  end if;

  -- re-fetch confirmation status
  select seller_confirmed, buyer_confirmed 
  into seller_c, buyer_c
  from public.orders 
  where id = txn_id;

  -- if both confirmed
  if seller_c = true and buyer_c = true then
    update public.orders 
    set status = 'completed',
        updated_at = now()
    where id = txn_id;

    return json_build_object(
      'message','Both parties confirmed. Order completed.',
      'both_confirmed', true
    );
  end if;

  return json_build_object(
    'message','Confirmation recorded.',
    'both_confirmed', false
  );

end;
$$;

-- Fix cancel_order function to have proper search_path
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, seller_id uuid)
RETURNS json
LANGUAGE plpgsql
SET search_path = public
AS $$
declare
    order_record record;
begin
    -- Fetch the order
    select * into order_record
    from orders
    where id = order_id;

    -- Authorization check
    if order_record.seller_id != seller_id then
        return json_build_object('success', false, 'error', 'Not authorized to cancel this order.');
    end if;

    -- Status check
    if order_record.status != 'pending' then
        return json_build_object('success', false, 'error', 'Order is already ' || order_record.status || ' and cannot be cancelled.');
    end if;

    -- Cancel the order
    update orders
    set status = 'cancelled'
    where id = order_id;

    -- Make item available again
    update items
    set status = 'available'
    where id = order_record.item_id;

    return json_build_object('success', true, 'message', 'Order cancelled successfully. Item is now back on sale.');
end;
$$;

-- Fix complete_transaction_and_mark_sold to have proper search_path
CREATE OR REPLACE FUNCTION public.complete_transaction_and_mark_sold(txn_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  t record;
begin
  -- Fetch the transaction row
  select * into t
  from public.transactions
  where id = txn_id
  limit 1;

  if not found then
    return query select false, 'Transaction not found';
  end if;

  -- Update the item as sold
  update public.items
  set 
    is_sold = true,
    status = 'sold'
  where id = t.item_id;

  -- Update the transaction status
  update public.transactions
  set status = 'completed'
  where id = txn_id;

  return query select true, 'Item marked sold successfully';
end;
$$;

-- Fix get_monthly_leaderboard to have proper search_path
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard()
RETURNS TABLE(user_id uuid, full_name text, university text, campus_points integer, trust_seller_badge boolean, avatar_url text, mck_id text)
LANGUAGE sql
SET search_path = public
AS $$
  select
    p.user_id,
    p.full_name,
    p.university,
    COALESCE(SUM(ph.points), 0)::int as campus_points,
    p.trust_seller_badge,
    p.avatar_url,
    p.mck_id
  from profiles p
  left join points_history ph
    on ph.user_id = p.user_id
    and ph.created_at >= date_trunc('month', now())
  group by
    p.user_id,
    p.full_name,
    p.university,
    p.trust_seller_badge,
    p.avatar_url,
    p.mck_id
  order by campus_points desc;
$$;