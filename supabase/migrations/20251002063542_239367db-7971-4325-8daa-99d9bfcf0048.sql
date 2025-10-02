-- Fix condition check constraint to match frontend values
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_condition_check;

ALTER TABLE public.items ADD CONSTRAINT items_condition_check 
CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor'));