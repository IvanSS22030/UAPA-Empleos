-- ==============================================================================
-- 1. JOBS TABLE
-- Allows recruiters to post dynamic job listings directly into the platform.
-- ==============================================================================

DROP TABLE IF EXISTS public.jobs CASCADE;

CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'full-time' CHECK (type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
    category TEXT DEFAULT 'Technology',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Protect references in existing tables:
-- Applications were previously tied to a static string 'jobId'.
-- Since applications refers to 'job_id' as TEXT, we do not need to drop/recreate foreign keys right now, 
-- but we should be mindful that applications.job_id will now contain this UUID instead of a static string slug.

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at via trigger
DROP TRIGGER IF EXISTS handle_jobs_updated_at ON public.jobs;
CREATE TRIGGER handle_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_connections_mod_time(); -- reusing existing trigger func if available, else make a generic one.

-- Fallback if update_connections_mod_time is specific, let's create a generic mod time func
CREATE OR REPLACE FUNCTION update_mod_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_jobs_updated_at ON public.jobs;
CREATE TRIGGER handle_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_time();

-- ==============================================================================
-- RLS POLICIES FOR JOBS
-- ==============================================================================

-- 1. Anyone can view public jobs
CREATE POLICY "Jobs are public and viewable by everyone"
    ON public.jobs FOR SELECT
    USING (true);

-- 2. Only authenticated recruiters can insert
CREATE POLICY "Only recruiters can create jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (
        auth.uid() = recruiter_id 
        AND exists (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'recruiter'
        )
    );

-- 3. Recruiters can update their own jobs
CREATE POLICY "Recruiters can update own jobs"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = recruiter_id);

-- 4. Recruiters can delete their own jobs
CREATE POLICY "Recruiters can delete own jobs"
    ON public.jobs FOR DELETE
    USING (auth.uid() = recruiter_id);
