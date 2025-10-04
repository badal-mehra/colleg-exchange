-- Add MCK-ID and avatar URL to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mck_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Function to generate unique MCK-ID
CREATE OR REPLACE FUNCTION public.generate_mck_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 7-digit number
    new_id := 'MCK-' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE mck_id = new_id) INTO id_exists;
    
    -- Exit loop if ID is unique
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Trigger to auto-generate MCK-ID for existing and new users
CREATE OR REPLACE FUNCTION public.set_mck_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mck_id IS NULL THEN
    NEW.mck_id := generate_mck_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS trigger_set_mck_id ON public.profiles;
CREATE TRIGGER trigger_set_mck_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mck_id();

-- Update existing profiles with MCK-IDs
UPDATE public.profiles SET mck_id = generate_mck_id() WHERE mck_id IS NULL;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update RLS policies to allow public viewing of profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Keep existing policies for update (users can only update their own)
-- This is already handled by existing "Users can update their own profile" policy