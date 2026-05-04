DROP POLICY IF EXISTS "Users can update their own items" ON public.items;

CREATE POLICY "Users can update their own items"
ON public.items
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);