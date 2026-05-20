
CREATE OR REPLACE FUNCTION public.delete_old_messages()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RAISE NOTICE 'Starting message deletion job for 14 days policy...';
  
  -- Delete messages older than 14 days
  DELETE FROM public.messages 
  WHERE created_at < now() - interval '14 days';
  
  RAISE NOTICE 'Deleted % rows from messages table.', ROW_COUNT();

  -- Clean up empty conversations older than 14 days
  DELETE FROM public.conversations c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.conversation_id = c.id
  )
  AND c.created_at < now() - interval '14 days';

  -- Clean up empty PG conversations older than 14 days
  DELETE FROM public.pg_conversations c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.conversation_id = c.id
  )
  AND c.created_at < now() - interval '14 days';

  RAISE NOTICE '14 days message and conversation deletion job completed.';
END;
$function$;
