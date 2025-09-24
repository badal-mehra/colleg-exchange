-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.handle_ad_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Mark expired ads as sold to hide them from listings
  UPDATE public.items 
  SET is_sold = true 
  WHERE expires_at < now() 
  AND is_sold = false
  AND auto_repost = false;
  
  -- Auto-repost expired ads if auto_repost is enabled
  UPDATE public.items 
  SET expires_at = now() + interval '30 days',
      created_at = now()
  WHERE expires_at < now() 
  AND is_sold = false
  AND auto_repost = true;
END;
$$;