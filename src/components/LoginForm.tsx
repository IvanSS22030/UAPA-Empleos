import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';

interface LoginFormProps {
  lang: keyof typeof ui;
}

export default function LoginForm({ lang }: LoginFormProps) {
  const t = useTranslations(lang);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: "Has iniciado sesión con éxito. / Logged in successfully." });
      // Redirect to home or dashboard after successful login
      setTimeout(() => {
        window.location.href = lang === 'es' ? '/' : `/${lang}/`;
      }, 1000);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('nav.login')}</h2>
      
      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-uapa-orange text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition disabled:opacity-50 mt-4"
        >
          {loading ? '...' : t('auth.login_button')}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <a href={lang === 'es' ? '/signup' : `/${lang}/signup`} className="text-uapa-blue hover:text-uapa-orange hover:underline font-bold transition">
          {t('auth.no_account')}
        </a>
      </div>
    </div>
  );
}
