-- Migration: 00002_social_network_pivot.sql

-- 1. Add username to profiles
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Create index for faster username searches
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update RLS for profiles so users can search for others by username
DROP POLICY IF EXISTS "Users can view profiles in their couple" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Create Friendships table
CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sender_id, receiver_id)
);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert friend requests" 
ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests" 
ON public.friendships FOR UPDATE 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 3. Modify Messages table for 1-on-1 chat
-- We need to drop couple_id and add receiver_id
ALTER TABLE public.messages DROP CONSTRAINT messages_couple_id_fkey;
ALTER TABLE public.messages DROP COLUMN couple_id;
ALTER TABLE public.messages ADD COLUMN receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- We need to update RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages in their couple" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their couple" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their couple" ON public.messages;

CREATE POLICY "Users can view their messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages (e.g. read status)" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);
