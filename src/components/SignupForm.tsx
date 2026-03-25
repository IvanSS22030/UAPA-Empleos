import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';
import { actions } from 'astro:actions';

interface SignupFormProps {
  lang: keyof typeof ui;
}

export default function SignupForm({ lang }: SignupFormProps) {
  const t = useTranslations(lang);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'talent' | 'recruiter'>('talent');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Sign up user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // You could pass data here if you had a trigger, but we'll insert explicitly
        data: { full_name: fullName, role },
      }
    });

    if (authError) {
      setMessage({ type: 'error', text: authError.message });
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Insert into public.profiles via secure Astro Action
      const { data, error: profileError } = await actions.createProfile({
        id: authData.user.id,
        role: role as 'talent' | 'recruiter',
        fullName: fullName
      });

      if (profileError) {
        // Note: In production, consider cleanup or better error handling if profile creation fails
        console.error("Profile creation error:", profileError);
        setMessage({ type: 'error', text: profileError.message });
      } else {
        setMessage({ type: 'success', text: "Account created successfully! You can now log in." });
        setEmail('');
        setPassword('');
        setFullName('');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('nav.signup')}</h2>
      
      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">{t('auth.fullName')}</label>
          <input 
            type="text" 
            required 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
          />
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-1">{t('auth.email')}</label>
           <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
          />
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-1">{t('auth.password')}</label>
           <div className="relative">
             <input 
              type={showPassword ? "text" : "password"} 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition pr-12"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-4 text-gray-500 hover:text-uapa-orange transition-colors flex items-center justify-center cursor-pointer"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
           </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.role')}</label>
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input 
                type="radio" 
                name="role" 
                value="talent"
                checked={role === 'talent'}
                onChange={() => setRole('talent')}
                className="peer sr-only"
              />
              <div className="text-center px-4 py-3 rounded-lg border-2 border-gray-200 peer-checked:border-uapa-blue peer-checked:bg-blue-50 peer-checked:text-uapa-blue font-bold transition">
                {t('auth.role.talent')}
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input 
                type="radio" 
                name="role" 
                value="recruiter"
                checked={role === 'recruiter'}
                onChange={() => setRole('recruiter')}
                className="peer sr-only"
              />
              <div className="text-center px-4 py-3 rounded-lg border-2 border-gray-200 peer-checked:border-uapa-blue peer-checked:bg-blue-50 peer-checked:text-uapa-blue font-bold transition">
                {t('auth.role.recruiter')}
              </div>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-uapa-blue text-white font-bold py-4 rounded-xl hover:bg-blue-900 shadow-md transition disabled:opacity-50 mt-4"
        >
          {loading ? '...' : t('auth.signup_button')}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <a href={lang === 'es' ? '/login' : `/${lang}/login`} className="text-uapa-orange hover:underline font-bold transition">
          {t('auth.have_account')}
        </a>
      </div>
    </div>
  );
}
