-- Create Jobs Table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Establish full text search on Jobs table. Ensure pg_full_text_search extension is active or we just use simple tsvector. 
-- For simplicity, adding a generated tsvector column for job search fallback logic later:
ALTER TABLE jobs ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || company || ' ' || description)) STORED;
CREATE INDEX jobs_fts_idx ON jobs USING GIN (fts);


-- Create Applications Table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, reviewed, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Messages Table for Recruiter/Talent chat
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL, -- 'recruiter' or 'talent'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Storage Resumes Bucket and RLS Setup
-- Note: Make sure the storage extension is enabled. If this fails, create the bucket via Supabase Dashboard UI.
insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', false);

-- Set Bucket Policy for "resumes"
-- Restrict access so only the person who uploaded or specific employers can download.
-- Note: Since we don't have an auth system fully specified, this policy allows insert for anon
-- but you should refine this when adding proper Authentication.
CREATE POLICY "Allow public uploads to resumes" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'resumes');

-- Enable Realtime for standard tables
alter publication supabase_realtime add table applications;
alter publication supabase_realtime add table messages;
