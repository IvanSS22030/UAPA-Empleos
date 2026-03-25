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
    avatar_url: ''
  });

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
            avatar_url: data.avatar_url || ''
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

        <form onSubmit={updateProfile} className="space-y-6">
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

          <div className="pt-4 border-t border-gray-100 flex justify-end">
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
