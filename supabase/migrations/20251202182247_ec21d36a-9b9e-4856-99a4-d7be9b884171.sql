-- First, clean up orphaned target_ids that don't exist in profiles
UPDATE public.reports 
SET target_id = NULL 
WHERE target_id IS NOT NULL 
AND target_id NOT IN (SELECT user_id FROM public.profiles);

-- Now add the foreign key constraint
ALTER TABLE public.reports 
ADD CONSTRAINT reports_target_id_fkey 
FOREIGN KEY (target_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;