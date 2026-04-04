import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { actions } from 'astro:actions';

interface ApplicationFormProps {
  jobId: string;
  lang?: string;
}

export default function ApplicationForm({ jobId, lang = 'es' }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [useProfileData, setUseProfileData] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUserRole(profile.role);
          setUserProfile(profile);
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    const formData = new FormData(e.currentTarget);
    formData.append('jobId', jobId);
    
    if (userProfile && useProfileData) {
      formData.append('profileId', userProfile.id);
    }

    // Since resume is optional when using profile data, we should clean it from formData if it's empty
    // so the action doesn't try to parse an empty file object as a required file
    const resumeFile = formData.get('resume') as File;
    if (!resumeFile || resumeFile.size === 0) {
      formData.delete('resume');
    }

    try {
      const { data, error } = await actions.applyToJob(formData);

      if (error) {
        setSubmitResult({ success: false, message: error.message || 'Something went wrong.' });
      } else if (data?.success) {
        setSubmitResult({ success: true, message: 'Application submitted successfully! Your resume was uploaded.' });
        formRef.current?.reset();
      } else {
        setSubmitResult({ success: false, message: data?.error || 'Failed to submit application.' });
      }
    } catch (err: any) {
      setSubmitResult({ success: false, message: err?.message || 'Unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitResult?.success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-8 text-center max-w-xl mx-auto">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold mb-2">You're Awesome!</h3>
        <p>{submitResult.message}</p>
        <p className="mt-4 text-sm text-green-600">The recruiter will review your profile shortly.</p>
      </div>
    );
  }

  if (isCheckingAuth) {
    return <div className="text-center p-6 text-gray-500">Checking authorization...</div>;
  }

  if (!user || userRole !== 'talent') {
    return (
      <div className="bg-yellow-50 text-yellow-800 p-6 rounded-xl border border-yellow-200 text-center max-w-xl mx-auto">
        <h3 className="text-xl font-bold mb-2">Authentication Required</h3>
        <p>You must be logged in as a <strong>Job Hunter (Talent)</strong> to apply for this job.</p>
        <div className="mt-4 flex gap-4 justify-center">
          <a href="/login" className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded hover:bg-yellow-700 transition">Log In</a>
          <a href="/signup" className="px-4 py-2 bg-yellow-100 text-yellow-800 font-semibold rounded border border-yellow-300 hover:bg-yellow-200 transition">Sign Up</a>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl mx-auto text-left flex flex-col gap-5">
      {submitResult && !submitResult.success && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg font-medium border border-red-200">
          ❌ {submitResult.message}
        </div>
      )}

      <div>
        <label htmlFor="applicantName" className="block text-sm font-semibold text-gray-700 mb-1">Full Name / Nombre Completo</label>
        <input 
          id="applicantName"
          name="applicantName"
          type="text" 
          required 
          minLength={2}
          defaultValue={userProfile?.full_name || ''}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange focus:border-transparent outline-none transition"
          placeholder="Ej. Juan Pérez"
        />
      </div>

      <div>
        <label htmlFor="applicantEmail" className="block text-sm font-semibold text-gray-700 mb-1">Email / Correo Electrónico</label>
        <input 
          id="applicantEmail"
          name="applicantEmail"
          type="email" 
          required 
          defaultValue={user?.email || ''}
          readOnly
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange focus:border-transparent outline-none transition bg-gray-50 text-gray-500 cursor-not-allowed"
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-2">
         <label className="flex items-start cursor-pointer">
           <div className="flex items-center h-5">
             <input 
               type="checkbox" 
               checked={useProfileData}
               onChange={(e) => setUseProfileData(e.target.checked)}
               className="w-5 h-5 rounded text-uapa-blue focus:ring-uapa-blue border-gray-300"
             />
           </div>
           <div className="ml-3 text-sm">
             <span className="font-bold text-uapa-blue block">Aplicar usando mi Perfil / Apply with Profile</span>
             <p className="text-gray-600 mt-1">Los reclutadores podrán ver tus habilidades (Skills), idiomas y biografía directamente desde tu perfil de Uapa Empleos.</p>
           </div>
         </label>
      </div>

      <div>
        <label htmlFor="resume" className="block text-sm font-semibold text-gray-700 mb-1">
          {useProfileData ? 'Curriculum Adicional (Opcional) / Additional Resume' : 'Curriculum PDF (Required) / Resume'}
        </label>
        <input 
          id="resume"
          name="resume"
          type="file" 
          accept="application/pdf"
          required={!useProfileData}
          className="w-full px-4 py-2 bg-white rounded-lg border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-uapa-blue hover:file:bg-blue-100 cursor-pointer outline-none transition"
        />
        <p className="text-xs text-gray-500 mt-2">Solamente archivos PDF. Máximo 5MB.</p>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-4 bg-uapa-blue text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-900 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </>
        ) : 'Submit Application'}
      </button>
    </form>
  );
}
