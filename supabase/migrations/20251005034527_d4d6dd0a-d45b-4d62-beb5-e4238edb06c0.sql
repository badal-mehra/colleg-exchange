-- Create orders table for QR-based transaction confirmation
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  qr_code TEXT,
  qr_signature TEXT,
  qr_expires_at TIMESTAMP WITH TIME ZONE,
  qr_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (is_admin(auth.uid()));

-- Create index for performance
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_item_id ON public.orders(item_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Trigger to update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to complete order and award points
CREATE OR REPLACE FUNCTION public.complete_order(order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  result JSONB;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already processed');
  END IF;
  
  -- Get item details
  SELECT * INTO v_item FROM public.items WHERE id = v_order.item_id;
  
  -- Update order status
  UPDATE public.orders 
  SET status = 'completed', qr_used = TRUE, updated_at = now()
  WHERE id = order_id;
  
  -- Mark item as sold
  UPDATE public.items 
  SET is_sold = TRUE, updated_at = now()
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
  
  RETURN jsonb_build_object('success', true, 'message', 'Order completed successfully');
END;
$$;