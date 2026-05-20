-- Drop the foreign key constraint that only allows messages for regular conversations
-- The RLS policies already validate access for both conversations and pg_conversations
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;