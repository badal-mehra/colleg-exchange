-- Fix existing ad_priority values to match correct priority order
-- urgent = 100, featured = 60, premium = 30, basic = 0

UPDATE public.items SET ad_priority = 100 WHERE ad_type = 'urgent';
UPDATE public.items SET ad_priority = 60 WHERE ad_type = 'featured';
UPDATE public.items SET ad_priority = 30 WHERE ad_type = 'premium';
UPDATE public.items SET ad_priority = 0 WHERE ad_type = 'basic' OR ad_type IS NULL;

-- Create function to auto-set ad_priority based on ad_type
CREATE OR REPLACE FUNCTION public.set_ad_priority()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ad_priority := CASE NEW.ad_type
    WHEN 'urgent' THEN 100
    WHEN 'featured' THEN 60
    WHEN 'premium' THEN 30
    ELSE 0
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-set priority on insert/update
DROP TRIGGER IF EXISTS set_item_ad_priority ON public.items;
CREATE TRIGGER set_item_ad_priority
BEFORE INSERT OR UPDATE OF ad_type ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.set_ad_priority();