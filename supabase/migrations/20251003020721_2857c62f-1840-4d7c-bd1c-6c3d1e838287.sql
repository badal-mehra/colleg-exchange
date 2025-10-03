-- Add index for better performance on unread messages queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read 
ON public.messages(conversation_id, is_read, created_at);

-- Add index for real-time subscriptions
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Function to get unread count for a conversation
CREATE OR REPLACE FUNCTION get_unread_count(conv_id uuid, uid uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM messages
  WHERE conversation_id = conv_id
    AND sender_id != uid
    AND is_read = false;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(conv_id uuid, uid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = conv_id
    AND sender_id != uid
    AND is_read = false;
$$;