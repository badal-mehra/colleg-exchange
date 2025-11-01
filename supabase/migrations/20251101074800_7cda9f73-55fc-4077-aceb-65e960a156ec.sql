-- Fix storage RLS policies for slider images
-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can upload slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update slider images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete slider images" ON storage.objects;

-- Allow admins to upload slider images
CREATE POLICY "Admins can upload slider images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'slider'
  AND is_admin(auth.uid())
);

-- Allow admins to update slider images
CREATE POLICY "Admins can update slider images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'slider'
  AND is_admin(auth.uid())
);

-- Allow admins to delete slider images
CREATE POLICY "Admins can delete slider images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'slider'
  AND is_admin(auth.uid())
);

-- Create terms and conditions table
CREATE TABLE IF NOT EXISTS public.terms_and_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  version text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active terms
CREATE POLICY "Anyone can view active terms"
ON public.terms_and_conditions
FOR SELECT
USING (is_active = true);

-- Allow admins to manage terms
CREATE POLICY "Admins can manage terms"
ON public.terms_and_conditions
FOR ALL
USING (is_admin(auth.uid()));

-- Create user acceptance tracking table
CREATE TABLE IF NOT EXISTS public.user_terms_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_id uuid NOT NULL REFERENCES public.terms_and_conditions(id),
  accepted_at timestamp with time zone DEFAULT now(),
  ip_address text,
  UNIQUE(user_id, terms_id)
);

-- Enable RLS
ALTER TABLE public.user_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Users can view their own acceptances
CREATE POLICY "Users can view own acceptances"
ON public.user_terms_acceptance
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own acceptances
CREATE POLICY "Users can accept terms"
ON public.user_terms_acceptance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances"
ON public.user_terms_acceptance
FOR SELECT
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_terms_updated_at
BEFORE UPDATE ON public.terms_and_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();