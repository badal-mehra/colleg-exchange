-- Remove the foreign key constraint since target_id can reference either profiles OR items depending on report_type
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_id_fkey;