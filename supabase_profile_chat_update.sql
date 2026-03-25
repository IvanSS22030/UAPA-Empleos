-- 1. Expand the public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- 2. Create conversations table for LinkedIn-style direct messaging
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT participants_must_be_different CHECK (participant1_id != participant2_id)
);

-- Turn on RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they are part of
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Users can insert conversations they are part of
CREATE POLICY "Users can insert their own conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);


-- 3. Restructure messages table to use conversations
-- Since we might have old messages, we either drop or alter. Let's create a new 'chat_messages' table to be safe and clean.
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
-- To do this cleanly without a join in the policy, we can use a subquery or a helper function. 
-- Using a subquery for simplicity:
CREATE POLICY "Users can view messages of their conversations" 
ON public.chat_messages FOR SELECT 
USING (
    conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
);

-- Users can insert messages in their conversations AND must be the sender
CREATE POLICY "Users can send messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
);

-- Enable Realtime for the new tables
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.chat_messages;


-- 4. Setup Storage Bucket for Avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for Avatars bucket
-- Anyone can read public avatars
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
