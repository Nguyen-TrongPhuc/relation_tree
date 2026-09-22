-- Migration: 00001_chat_messages.sql

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view messages belonging to their couple
CREATE POLICY "Users can view messages in their couple" 
ON public.messages FOR SELECT 
USING (
    couple_id = (
        SELECT couple_id 
        FROM public.couple_members 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
);

-- Policy: Users can insert messages to their couple
CREATE POLICY "Users can insert messages in their couple" 
ON public.messages FOR INSERT 
WITH CHECK (
    sender_id = auth.uid() AND
    couple_id = (
        SELECT couple_id 
        FROM public.couple_members 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
);

-- Policy: Users can update messages in their couple (e.g. for marking as read)
CREATE POLICY "Users can update messages in their couple"
ON public.messages FOR UPDATE
USING (
    couple_id = (
        SELECT couple_id 
        FROM public.couple_members 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
);
