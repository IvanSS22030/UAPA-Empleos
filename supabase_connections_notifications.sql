-- ==============================================================================
-- 1. CONNECTIONS TABLE
-- Tracks relationships between users (pending, accepted, rejected).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sender_id, receiver_id) -- Ensure only one relationship tracked between the pair
);

-- Turn on RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at via trigger
CREATE OR REPLACE FUNCTION update_connections_mod_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_connections_updated_at ON public.connections;
CREATE TRIGGER handle_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connections_mod_time();

-- Policies for connections
-- 1. Users can view connections where they are either sender or receiver
CREATE POLICY "Users can view their own connections"
    ON public.connections FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. Authenticated users can send a connection request (insert)
CREATE POLICY "Users can send connection requests"
    ON public.connections FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 3. Receivers can update status (e.g. pending -> accepted/rejected)
--    Senders can update to withdraw (if they want, though usually delete is used)
CREATE POLICY "Users can update connection status"
    ON public.connections FOR UPDATE
    USING (auth.uid() = receiver_id OR auth.uid() = sender_id);


-- ==============================================================================
-- 2. NOTIFICATIONS TABLE
-- Notifies users of events (connection requests, accepted requests, messages).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- the core recipient
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- the person who triggered it
    type TEXT NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'message')),
    message TEXT, 
    link TEXT, -- Optional URL to redirect to when clicked
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
-- 1. Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Anyone can insert notifications (e.g. system triggers or client inserts)
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true); -- Usually restricted by RPC, but keeping open for direct client trigger

-- 3. Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Users can delete their notifications
CREATE POLICY "Users can delete their notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);
