-- Add advertising options to items table
ALTER TABLE public.items 
ADD COLUMN ad_type TEXT DEFAULT 'basic' CHECK (ad_type IN ('basic', 'featured', 'premium', 'urgent')),
ADD COLUMN is_promoted BOOLEAN DEFAULT false,
ADD COLUMN promotion_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ad_duration_days INTEGER DEFAULT 30,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
ADD COLUMN is_negotiable BOOLEAN DEFAULT true,
ADD COLUMN auto_repost BOOLEAN DEFAULT false,
ADD COLUMN featured_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN boost_count INTEGER DEFAULT 0,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create function to handle ad expiry
CREATE OR REPLACE FUNCTION public.handle_ad_expiry()
RETURNS void
LANGUAGE plpgsql
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

-- Create ad packages table for pricing
CREATE TABLE public.ad_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ad_type TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ad_packages
ALTER TABLE public.ad_packages ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing ad packages
CREATE POLICY "Anyone can view active ad packages" 
ON public.ad_packages 
FOR SELECT 
USING (is_active = true);

-- Create policy for admins to manage ad packages
CREATE POLICY "Admins can manage ad packages" 
ON public.ad_packages 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default ad packages
INSERT INTO public.ad_packages (name, ad_type, duration_days, price, features) VALUES
('Basic Ad', 'basic', 30, 0, '{"description": "Standard listing for 30 days", "priority": 1}'),
('Featured Ad', 'featured', 30, 50, '{"description": "Highlighted listing with better visibility", "priority": 2, "highlighted": true}'),
('Premium Ad', 'premium', 45, 100, '{"description": "Top placement with extended duration", "priority": 3, "top_placement": true, "extended_duration": true}'),
('Urgent Sale', 'urgent', 15, 25, '{"description": "Urgent sale badge with quick visibility", "priority": 2, "urgent_badge": true}');

-- Update existing items to have expiry dates
UPDATE public.items 
SET expires_at = created_at + interval '30 days'
WHERE expires_at IS NULL;