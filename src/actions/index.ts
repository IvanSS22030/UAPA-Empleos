import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createClient } from '@supabase/supabase-js';

// Setup admin client for secure server-side operations (needs Service Role Key ideally, but we'll use ANON for now if that's all we have)
// In a real prod environment, use SUPPLEMENTARY_SERVICE_PORTOL_KEY for bypassing RLS if needed, or stick to anon if RLS allows it.
// The user provided PUBLIC_SUPABASE_ANON_KEY.
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);
// Service role client bypasses RLS
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRole!);

export const server = {
  createProfile: defineAction({
    input: z.object({
      id: z.string().uuid(),
      role: z.enum(['talent', 'recruiter']),
      fullName: z.string()
    }),
    handler: async (input) => {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: input.id,
            role: input.role,
            full_name: input.fullName
          }
        ]);
        
      if (profileError) {
        throw new Error(profileError.message);
      }
      return { success: true };
    }
  }),
  applyToJob: defineAction({
    accept: 'form',
    input: z.object({
      jobId: z.string().uuid(),
      applicantName: z.string().min(2),
      applicantEmail: z.string().email(),
      resume: z.instanceof(File),
    }),
    handler: async (input) => {
      try {
        // 1. Upload Resume to Supabase Storage
        const fileExt = input.resume.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${input.jobId}/${fileName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('resumes')
          .upload(filePath, input.resume, {
            contentType: input.resume.type,
            upsert: false
          });

        if (storageError) {
          throw new Error(`Resume upload failed: ${storageError.message}`);
        }

        const resumeUrl = supabase.storage.from('resumes').getPublicUrl(filePath).data.publicUrl;

        // 2. Create Application Record in Database
        const { data: appData, error: dbError } = await supabase
          .from('applications')
          .insert([
            {
              job_id: input.jobId,
              applicant_name: input.applicantName,
              applicant_email: input.applicantEmail,
              resume_url: resumeUrl,
              status: 'pending'
            }
          ])
          .select()
          .single();

        if (dbError) {
          throw new Error(`Failed to save application: ${dbError.message}`);
        }

        return { success: true, application: appData };
      } catch (error: any) {
        console.error("Action error:", error);
        return { success: false, error: error.message };
      }
    }
  })
};
