-- Create a table for public profiles linked to Supabase Auth
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('talent', 'recruiter')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are readable by everyone
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Optional: Create a trigger that automatically creates a profile entry when a new user signs up via Supabase Auth
-- Note: It is often better to handle role assignment in the client during signup, 
-- but we can set up a function if we were passing metadata. 
-- For our Astro app, we will insert explicitly into the `profiles` table immediately after auth.signUp.
