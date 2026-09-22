-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES
-- ==========================================

-- Couples Table
CREATE TABLE public.couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Couple Members Table (Links Profiles and Couples)
CREATE TABLE public.couple_members (
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (couple_id, user_id)
);

-- ==========================================
-- 2. FUNCTIONS & TRIGGERS
-- ==========================================

-- Trigger Function: Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger Function: Limit couple to max 2 members
CREATE OR REPLACE FUNCTION public.check_couple_member_limit()
RETURNS trigger AS $$
DECLARE
    member_count INT;
BEGIN
    SELECT COUNT(*) INTO member_count FROM public.couple_members WHERE couple_id = NEW.couple_id;
    IF member_count >= 2 THEN
        RAISE EXCEPTION 'A couple can only have a maximum of 2 members.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_couple_limit
    BEFORE INSERT ON public.couple_members
    FOR EACH ROW EXECUTE PROCEDURE public.check_couple_member_limit();

-- Function to get current user's couple_id (used for RLS)
CREATE OR REPLACE FUNCTION public.get_user_couple_id()
RETURNS UUID AS $$
    SELECT couple_id 
    FROM public.couple_members 
    WHERE user_id = auth.uid() 
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, and the profile of their partner.
CREATE POLICY "Users can view profiles in their couple" 
ON public.profiles FOR SELECT 
USING (
    id = auth.uid() OR 
    id IN (
        SELECT user_id FROM public.couple_members WHERE couple_id = public.get_user_couple_id()
    )
);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

-- Couples: Users can only view and update their own couple's data
CREATE POLICY "Users can view own couple" 
ON public.couples FOR SELECT 
USING (id = public.get_user_couple_id());

CREATE POLICY "Users can update own couple" 
ON public.couples FOR UPDATE 
USING (id = public.get_user_couple_id());

-- Couple Members: Users can view members of their own couple
CREATE POLICY "Users can view members of own couple" 
ON public.couple_members FOR SELECT 
USING (couple_id = public.get_user_couple_id());
