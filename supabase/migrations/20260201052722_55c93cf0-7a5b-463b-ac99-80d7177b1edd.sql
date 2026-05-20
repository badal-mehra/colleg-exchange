-- Update messages RLS policy to allow messages for pg_conversations
-- First drop the existing policy
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- Create new policies that work for both conversations and pg_conversations
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM pg_conversations
    WHERE pg_conversations.id = messages.conversation_id 
    AND (pg_conversations.buyer_id = auth.uid() OR pg_conversations.seller_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM pg_conversations
      WHERE pg_conversations.id = messages.conversation_id 
      AND (pg_conversations.buyer_id = auth.uid() OR pg_conversations.seller_id = auth.uid())
    )
  )
);

-- Add UPDATE policy for marking messages as read
CREATE POLICY "Users can update messages in their conversations" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM pg_conversations
    WHERE pg_conversations.id = messages.conversation_id 
    AND (pg_conversations.buyer_id = auth.uid() OR pg_conversations.seller_id = auth.uid())
  )
);