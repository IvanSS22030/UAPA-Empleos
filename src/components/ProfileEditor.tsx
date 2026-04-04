import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';

interface ProfileEditorProps {
  lang: keyof typeof ui;
}

export default function ProfileEditor({ lang }: ProfileEditorProps) {
  const t = useTranslations(lang);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    phone: '',
    location: '',
    avatar_url: '',
    skills: [] as string[],
    languages: [] as string[]
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setFormData({
            full_name: data.full_name || '',
            headline: data.headline || '',
            bio: data.bio || '',
            phone: data.phone || '',
            location: data.location || '',
            avatar_url: data.avatar_url || '',
            skills: data.skills || [],
            languages: data.languages || []
          });
        }
      } else {
        window.location.href = lang === 'es' ? '/login' : `/${lang}/login`;
      }
      setLoading(false);
    };

    fetchProfile();
  }, [lang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  const addLanguage = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData({ ...formData, languages: [...formData.languages, newLanguage.trim()] });
      setNewLanguage('');
    }
  };

  const removeLanguage = (langToRemove: string) => {
    setFormData({ ...formData, languages: formData.languages.filter(l => l !== langToRemove) });
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      
      if (!userId) throw new Error('Not authenticated');

      const filePath = `${userId}/avatar-${Math.random()}.${fileExt}`;

      let { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
      setMessage({ type: 'success', text: 'Avatar uploaded successfully. Remember to save changes!' });

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          headline: formData.headline,
          bio: formData.bio,
          phone: formData.phone,
          location: formData.location,
          avatar_url: formData.avatar_url,
          skills: formData.skills,
          languages: formData.languages,
          updated_at: new Date()
        })
        .eq('id', session.user.id);

      if (error) {
        setMessage({ type: 'error', text: error.message || t('profile.error') });
      } else {
        setMessage({ type: 'success', text: t('profile.success') });
      }
    }
    
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-uapa-blue font-bold">Cargando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header Banner */}
      <div className="h-32 bg-uapa-blue relative"></div>
      
      <div className="px-8 pb-8 relative">
        {/* Avatar Upload Sector */}
        <div className="flex justify-between items-end -mt-16 mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-md flex items-center justify-center relative">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
              
              {/* Hover overlay for upload */}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-bold">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {uploading ? t('profile.uploading') : 'Cambiar Foto'}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={updateProfile} className="space-y-8">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('profile.full_name')}</label>
              <input 
                type="text" 
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('profile.headline')}</label>
              <input 
                type="text" 
                name="headline"
                placeholder="Ej. Desarrollador Junior React"
                value={formData.headline}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('profile.phone')}</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('profile.location')}</label>
              <input 
                type="text" 
                name="location"
                placeholder="Ej. Santiago, DO"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('profile.bio')}</label>
            <textarea 
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition resize-none"
              placeholder="Cuéntanos un poco sobre ti, tu experiencia y tus objetivos..."
            ></textarea>
          </div>

          {/* Skills and Languages (Upwork Style Cards) */}
          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                 Skills
                 <span className="ml-2 text-xs bg-uapa-orange/10 text-uapa-orange px-2 py-1 rounded-full">{formData.skills.length}</span>
               </h3>
               
               <div className="flex flex-wrap gap-2 mb-4">
                 {formData.skills.map(skill => (
                   <span key={skill} className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200">
                     {skill}
                     <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                     </button>
                   </span>
                 ))}
               </div>

               <div className="flex items-center gap-2">
                 <input 
                   type="text" 
                   placeholder="Ej. React, Python"
                   value={newSkill}
                   onChange={e => setNewSkill(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addSkill(e)}
                   className="flex-grow px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
                 />
                 <button type="button" onClick={addSkill} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition border border-green-200 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                 </button>
               </div>
            </div>

            <div className="w-full md:w-1/2">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                 Languages
                 <span className="ml-2 text-xs bg-uapa-orange/10 text-uapa-orange px-2 py-1 rounded-full">{formData.languages.length}</span>
               </h3>
               
               <div className="flex flex-wrap gap-2 mb-4">
                 {formData.languages.map(langStr => (
                   <span key={langStr} className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200">
                     {langStr}
                     <button type="button" onClick={() => removeLanguage(langStr)} className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                     </button>
                   </span>
                 ))}
               </div>

               <div className="flex items-center gap-2">
                 <input 
                   type="text" 
                   placeholder="Ej. Español (Nativo)"
                   value={newLanguage}
                   onChange={e => setNewLanguage(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addLanguage(e)}
                   className="flex-grow px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-uapa-orange outline-none transition"
                 />
                 <button type="button" onClick={addLanguage} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition border border-green-200 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                 </button>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
             <button 
                type="submit" 
                disabled={saving || uploading}
                className="bg-uapa-orange text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
              >
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}

