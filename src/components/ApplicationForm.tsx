import { useState, useRef } from 'react';
import { actions } from 'astro:actions';

interface ApplicationFormProps {
  jobId: string;
}

export default function ApplicationForm({ jobId }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message?: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    const formData = new FormData(e.currentTarget);
    formData.append('jobId', jobId);

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

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl mx-auto text-left flex flex-col gap-5">
      {submitResult && !submitResult.success && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg font-medium border border-red-200">
          ❌ {submitResult.message}
        </div>
      )}

      <div>
        <label htmlFor="applicantName" className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
        <input 
          id="applicantName"
          name="applicantName"
          type="text" 
          required 
          minLength={2}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label htmlFor="applicantEmail" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
        <input 
          id="applicantEmail"
          name="applicantEmail"
          type="email" 
          required 
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <label htmlFor="resume" className="block text-sm font-semibold text-gray-700 mb-1">Resume (PDF)</label>
        <input 
          id="resume"
          name="resume"
          type="file" 
          accept="application/pdf"
          required 
          className="w-full px-4 py-2 bg-white rounded-lg border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer outline-none transition"
        />
        <p className="text-xs text-gray-500 mt-2">Only PDF files are allowed. Must be smaller than 5MB.</p>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-4 bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
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
