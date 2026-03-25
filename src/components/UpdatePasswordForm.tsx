import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';

interface UpdatePasswordFormProps {
  lang: keyof typeof ui;
}

export default function UpdatePasswordForm({ lang }: UpdatePasswordFormProps) {
  const t = useTranslations(lang);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Supabase automatically parses #access_token=... in the URL, establishing a session.
  // We just need to check if there is a valid session or let them enter the new password.
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      // If we see a successful sign-in or a password recovery event, we know they can update the password.
      // Often, the easiest is to just let them fill out the form, and updateUser will work if the session is valid.
      if (event == "PASSWORD_RECOVERY") {
        console.log("Password recovery event started.");
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: lang === 'es' ? 'Contraseña actualizada correctamente.' : 'Password updated successfully.' });
      // Redirect to home or login page after successful update
      setTimeout(() => {
        window.location.href = lang === 'es' ? '/login' : `/${lang}/login`;
      }, 2000);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('auth.reset_password_title')}</h2>
      
      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-1">{t('auth.new_password')}</label>
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

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-uapa-orange text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition disabled:opacity-50 mt-4"
        >
          {loading ? '...' : t('auth.update_password_button')}
        </button>
      </form>
    </div>
  );
}
