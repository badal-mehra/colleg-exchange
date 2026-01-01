-- Create pg_listings table for PG/Room/Hostel rentals
CREATE TABLE public.pg_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- Basic Details
  property_type TEXT NOT NULL CHECK (property_type IN ('pg', 'room', 'hostel', 'flat')),
  for_gender TEXT NOT NULL CHECK (for_gender IN ('boys', 'girls', 'both')),
  sharing_type TEXT NOT NULL CHECK (sharing_type IN ('single', 'double', 'triple', 'any')),
  rent_per_month INTEGER NOT NULL,
  security_deposit INTEGER DEFAULT 0,
  electricity_included BOOLEAN DEFAULT false,
  food_included BOOLEAN DEFAULT false,
  
  -- Location
  area_locality TEXT NOT NULL,
  distance_from_campus TEXT,
  landmark TEXT,
  
  -- Amenities (stored as JSONB for flexibility)
  amenities JSONB DEFAULT '[]'::jsonb,
  
  -- Rules
  gate_timing TEXT,
  smoking_allowed BOOLEAN DEFAULT false,
  alcohol_allowed BOOLEAN DEFAULT false,
  visitors_allowed BOOLEAN DEFAULT true,
  
  -- Media
  images TEXT[] NOT NULL DEFAULT '{}',
  
  -- Contact
  contact_method TEXT DEFAULT 'chat' CHECK (contact_method IN ('chat', 'call', 'whatsapp')),
  
  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'paused', 'rented')),
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pg_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active pg listings"
ON public.pg_listings
FOR SELECT
USING (is_active = true AND status != 'rented');

CREATE POLICY "Users can insert their own pg listings"
ON public.pg_listings
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own pg listings"
ON public.pg_listings
FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own pg listings"
ON public.pg_listings
FOR DELETE
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all pg listings"
ON public.pg_listings
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_pg_listings_updated_at
BEFORE UPDATE ON public.pg_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_pg_listings_seller ON public.pg_listings(seller_id);
CREATE INDEX idx_pg_listings_property_type ON public.pg_listings(property_type);
CREATE INDEX idx_pg_listings_status ON public.pg_listings(status);
CREATE INDEX idx_pg_listings_rent ON public.pg_listings(rent_per_month);