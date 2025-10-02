-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for conversations table
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- Add conversations to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;