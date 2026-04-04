-- 1. Expand the public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- 2. Expand the applications table to better link it
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS applicant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ALTER COLUMN resume_url DROP NOT NULL; -- Allow applying without PDF if they have a real profile
