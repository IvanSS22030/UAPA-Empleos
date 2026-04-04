import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function JobCreateForm({ lang = 'es' }: { lang?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRecruiter, setIsRecruiter] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    type: 'full-time',
    category: 'Technology'
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        // Verify they are a recruiter
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data && data.role === 'recruiter') {
           setIsRecruiter(true);
        } else {
           window.location.href = lang === 'es' ? '/' : '/en';
        }
      } else {
         window.location.href = lang === 'es' ? '/login' : '/en/login';
      }
    });
  }, [lang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !isRecruiter) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('jobs')
        .insert({
          recruiter_id: userId,
          title: formData.title,
          company: formData.company,
          location: formData.location,
          description: formData.description,
          type: formData.type,
          category: formData.category
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Redirect to the newly created job
      window.location.href = lang === 'es' ? `/jobs/${data.id}` : `/en/jobs/${data.id}`;
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error creating job');
      setLoading(false);
    }
  };

  if (!isRecruiter) return <div className="p-8 text-center text-gray-500">Checking credentials...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {lang === 'es' ? 'Publicar Nueva Vacante' : 'Post a New Job'}
      </h2>
      
      {error && <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              {lang === 'es' ? 'Título del Puesto' : 'Job Title'}
            </label>
            <input 
              type="text" 
              name="title" 
              required
              value={formData.title} 
              onChange={handleChange}
              placeholder={lang === 'es' ? 'Ej. Frontend Developer' : 'e.g. Frontend Developer'}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-uapa-orange focus:border-uapa-orange block w-full p-2.5 outline-none transition" 
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              {lang === 'es' ? 'Empresa' : 'Company'}
            </label>
            <input 
              type="text" 
              name="company" 
              required
              value={formData.company} 
              onChange={handleChange}
              placeholder={lang === 'es' ? 'Nombre de tu empresa' : 'Your company name'}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-uapa-orange focus:border-uapa-orange block w-full p-2.5 outline-none transition" 
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              {lang === 'es' ? 'Ubicación' : 'Location'}
            </label>
            <input 
              type="text" 
              name="location" 
              required
              value={formData.location} 
              onChange={handleChange}
              placeholder={lang === 'es' ? 'Ej. Remoto, Santiago...' : 'e.g. Remote, NY...'}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-uapa-orange focus:border-uapa-orange block w-full p-2.5 outline-none transition" 
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              {lang === 'es' ? 'Tipo de Contrato' : 'Contract Type'}
            </label>
            <select 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-uapa-orange focus:border-uapa-orange block w-full p-2.5 outline-none transition" 
            >
              <option value="full-time">{lang === 'es' ? 'Tiempo Completo' : 'Full-time'}</option>
              <option value="part-time">{lang === 'es' ? 'Medio Tiempo' : 'Part-time'}</option>
              <option value="contract">{lang === 'es' ? 'Por Contrato' : 'Contract'}</option>
              <option value="freelance">{lang === 'es' ? 'Freelance / Independiente' : 'Freelance'}</option>
              <option value="internship">{lang === 'es' ? 'Pasantía' : 'Internship'}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900">
            {lang === 'es' ? 'Categoría' : 'Category'}
          </label>
          <select 
              name="category" 
              value={formData.category} 
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-uapa-orange focus:border-uapa-orange block w-full p-2.5 outline-none transition" 
            >
              <option value="Technology">Technology / IT</option>
              <option value="Business">Business & Management</option>
              <option value="Design">Design & Media</option>
              <option value="Education">Education</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Other">Other</option>
          </select>
        </div>

        <div>
           <label className="block mb-2 text-sm font-medium text-gray-900">
             {lang === 'es' ? 'Descripción del Puesto' : 'Job Description'}
           </label>
           <textarea
             name="description"
             required
             rows={8}
             value={formData.description}
             onChange={handleChange}
             placeholder={lang === 'es' ? 'Escribe los detalles, requisitos y responsabilidades de la vacante...' : 'Write the details, requirements and responsibilities...'}
             className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-uapa-orange focus:border-uapa-orange block w-full p-3 outline-none transition resize-y"
           ></textarea>
        </div>

        <button 
           type="submit" 
           disabled={loading}
           className="w-full text-white bg-uapa-orange hover:bg-orange-600 focus:ring-4 focus:outline-none focus:ring-orange-300 font-bold rounded-lg text-lg px-5 py-3 text-center transition-colors shadow-md disabled:opacity-50"
        >
          {loading ? (lang === 'es' ? 'Guardando...' : 'Saving...') : (lang === 'es' ? 'Publicar Vacante' : 'Post Job')}
        </button>
      </form>
    </div>
  );
}
