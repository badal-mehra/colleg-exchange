-- Drop the QR-based columns from orders table as we're replacing the system
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS qr_code,
DROP COLUMN IF EXISTS qr_signature,
DROP COLUMN IF EXISTS qr_expires_at,
DROP COLUMN IF EXISTS qr_used;

-- Add new columns for dual confirmation system
ALTER TABLE public.orders
ADD COLUMN seller_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN buyer_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN seller_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN buyer_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN meetup_location TEXT,
ADD COLUMN meetup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN dispute_reason TEXT,
ADD COLUMN dispute_raised_by UUID REFERENCES auth.users(id);

-- Update status enum to include more states
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS dispute_status TEXT DEFAULT NULL;

-- Create ratings table for genuine feedback
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, from_user_id)
);

-- Enable RLS on ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ratings
CREATE POLICY "Users can view ratings for their transactions"
ON public.ratings FOR SELECT
USING (
  auth.uid() = from_user_id OR 
  auth.uid() = to_user_id OR
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = ratings.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

CREATE POLICY "Users can create ratings for completed orders"
ON public.ratings FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = ratings.order_id 
    AND orders.status = 'completed'
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

-- Anyone can view ratings for public profiles
CREATE POLICY "Public ratings are viewable"
ON public.ratings FOR SELECT
USING (true);

-- Add average rating to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Function to update average rating
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.ratings
      WHERE to_user_id = NEW.to_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE to_user_id = NEW.to_user_id
    )
  WHERE user_id = NEW.to_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update rating after insert
CREATE TRIGGER update_rating_after_insert
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_user_rating();

-- Replace the complete_order function with new dual confirmation logic
CREATE OR REPLACE FUNCTION public.complete_order_with_confirmation(
  order_id UUID,
  confirming_user_id UUID,
  user_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_both_confirmed BOOLEAN;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already processed');
  END IF;
  
  -- Update confirmation based on user type
  IF user_type = 'seller' AND confirming_user_id = v_order.seller_id THEN
    UPDATE public.orders 
    SET seller_confirmed = TRUE, seller_confirmed_at = NOW()
    WHERE id = order_id;
  ELSIF user_type = 'buyer' AND confirming_user_id = v_order.buyer_id THEN
    UPDATE public.orders 
    SET buyer_confirmed = TRUE, buyer_confirmed_at = NOW()
    WHERE id = order_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized confirmation');
  END IF;
  
  -- Check if both confirmed
  SELECT seller_confirmed AND buyer_confirmed INTO v_both_confirmed
  FROM public.orders WHERE id = order_id;
  
  -- If both confirmed, complete the transaction
  IF v_both_confirmed THEN
    -- Get item details
    SELECT * INTO v_item FROM public.items WHERE id = v_order.item_id;
    
    -- Update order status
    UPDATE public.orders 
    SET status = 'completed', updated_at = NOW()
    WHERE id = order_id;
    
    -- Mark item as sold
    UPDATE public.items 
    SET is_sold = TRUE, updated_at = NOW()
    WHERE id = v_order.item_id;
    
    -- Award points to seller (+10)
    UPDATE public.profiles 
    SET 
      campus_points = campus_points + 10,
      deals_completed = deals_completed + 1,
      trust_seller_badge = CASE 
        WHEN (deals_completed + 1) >= 7 THEN TRUE 
        ELSE trust_seller_badge 
      END
    WHERE user_id = v_order.seller_id;
    
    -- Award points to buyer (+3)
    UPDATE public.profiles 
    SET campus_points = campus_points + 3
    WHERE user_id = v_order.buyer_id;
    
    -- Create transaction record
    INSERT INTO public.transactions (
      item_id,
      seller_id,
      buyer_id,
      amount,
      status,
      points_awarded
    ) VALUES (
      v_order.item_id,
      v_order.seller_id,
      v_order.buyer_id,
      v_item.price,
      'completed',
      10
    );
    
    RETURN jsonb_build_object(
      'success', true, 
      'completed', true,
      'message', 'Transaction completed! Points awarded.'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true, 
      'completed', false,
      'message', 'Confirmation recorded. Waiting for other party.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;