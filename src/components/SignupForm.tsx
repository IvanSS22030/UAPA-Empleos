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
           <input 
            type="password" 
            required 
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
          />
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
