-- Chat media, replies, pins, and safe message-management support.
ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS background_url TEXT;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_moment BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_reply_to_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_reply_to_id_fkey
      FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created
  ON public.messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender_created
  ON public.messages (receiver_id, sender_id, created_at DESC);

DROP POLICY IF EXISTS "Users can delete their sent messages" ON public.messages;
CREATE POLICY "Users can delete their sent messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- Preserve recipient-side call/read-state updates. Server Actions enforce
-- sender-only content edits/recalls and participant-scoped pinning.
DROP POLICY IF EXISTS "Users can update received messages (e.g. read status)" ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can update messages" ON public.messages;
CREATE POLICY "Conversation participants can update messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);