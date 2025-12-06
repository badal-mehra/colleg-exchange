-- Fix the complete_order_with_confirmation function to properly update campus_points
CREATE OR REPLACE FUNCTION public.complete_order_with_confirmation(order_id uuid, confirming_user_id uuid, user_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    order_record record;
    confirmation_column text;
    message_out text;
    v_seller_deals integer;
BEGIN
    -- 1. Fetch order and lock row
    SELECT * INTO order_record FROM orders WHERE id = order_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found.');
    END IF;

    -- 2. Status checks
    IF order_record.status = 'cancelled' THEN
        RETURN json_build_object('success', false, 'error', 'Order has been cancelled and cannot be confirmed.');
    END IF;
    IF order_record.status = 'completed' THEN
        RETURN json_build_object('success', false, 'error', 'Order is already completed.');
    END IF;

    -- 3. Determine which column to update and check permissions
    IF user_type = 'seller' AND order_record.seller_id = confirming_user_id THEN
        confirmation_column := 'seller_confirmed';
    ELSIF user_type = 'buyer' AND order_record.buyer_id = confirming_user_id THEN
        confirmation_column := 'buyer_confirmed';
    ELSE
        RETURN json_build_object('success', false, 'error', 'User not authorized for this role on this order.');
    END IF;

    -- Prevent confirming twice
    IF (confirmation_column = 'seller_confirmed' AND order_record.seller_confirmed) OR
       (confirmation_column = 'buyer_confirmed' AND order_record.buyer_confirmed) THEN
        RETURN json_build_object('success', false, 'error', 'You have already confirmed this order.');
    END IF;

    -- 4. Perform the confirmation update
    EXECUTE format('UPDATE orders SET %I = true, %I = now() WHERE id = %L',
        confirmation_column,
        CASE WHEN confirmation_column = 'seller_confirmed' THEN 'seller_confirmed_at' ELSE 'buyer_confirmed_at' END,
        order_id);

    -- Refetch the row to get fresh confirmation flags
    SELECT * INTO order_record FROM orders WHERE id = order_id;

    -- 5. If BOTH confirmed, complete the transaction
    IF order_record.seller_confirmed AND order_record.buyer_confirmed THEN
        -- Update order status to completed
        UPDATE orders
        SET status = 'completed', updated_at = now()
        WHERE id = order_id;

        -- Mark item as SOLD
        UPDATE items
        SET is_sold = true, status = 'sold', updated_at = now()
        WHERE id = order_record.item_id;

        -- Update seller: increment deals, add campus_points, check trust badge
        UPDATE profiles
        SET 
            deals_completed = deals_completed + 1,
            campus_points = campus_points + 10,
            trust_seller_badge = CASE 
                WHEN (deals_completed + 1) >= 7 THEN true 
                ELSE trust_seller_badge 
            END,
            updated_at = now()
        WHERE user_id = order_record.seller_id
        RETURNING deals_completed INTO v_seller_deals;

        -- Update buyer: increment deals, add campus_points
        UPDATE profiles
        SET 
            deals_completed = deals_completed + 1,
            campus_points = campus_points + 5,
            updated_at = now()
        WHERE user_id = order_record.buyer_id;

        message_out := 'Transaction completed! Item marked as sold.';
        
        RETURN json_build_object(
            'success', true, 
            'message', message_out, 
            'both_confirmed', true,
            'seller_deals', v_seller_deals
        );
    ELSE
        message_out := 'Your confirmation recorded. Waiting for the other party.';
        RETURN json_build_object('success', true, 'message', message_out, 'both_confirmed', false);
    END IF;
END;
$function$;

-- Also fix the add_points_on_completion trigger to update campus_points
CREATE OR REPLACE FUNCTION public.add_points_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;