-- Drop the restrictive "Anyone can view items" policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view items" ON public.items;

-- Create a proper PERMISSIVE SELECT policy for all users (anon + authenticated)
CREATE POLICY "Anyone can view items"
ON public.items
FOR SELECT
TO anon, authenticated
USING (true);