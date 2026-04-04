import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';

interface UserProfile {
  id: string;
  role: 'talent' | 'recruiter';
  full_name: string;
  headline: string;
  location: string;
  avatar_url: string;
  skills: string[];
}

interface PeopleSearchProps {
  lang: keyof typeof ui;
}

export default function PeopleSearch({ lang }: PeopleSearchProps) {
  const t = useTranslations(lang);
  
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'talent' | 'recruiter'>('all');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, full_name, headline, location, avatar_url, skills');
          
        if (!error && data) {
          setPeople(data);
        }
      } catch (e) {
        console.error("Supabase fetch failed", e);
      }
      setLoading(false);
    };

    fetchPeople();
  }, [lang]);

  // Derived filtered people
  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      // 1. Keyword search (name or headline or skills)
      const keyword = query.toLowerCase();
      if (
        keyword && 
        !(p.full_name || '').toLowerCase().includes(keyword) && 
        !(p.headline || '').toLowerCase().includes(keyword) &&
        !(p.skills || []).some(s => s.toLowerCase().includes(keyword))
      ) {
        return false;
      }
      // 2. Role filter
      if (roleFilter !== 'all' && p.role !== roleFilter) {
        return false;
      }
      // 3. Location filter
      if (locationQuery && !(p.location || '').toLowerCase().includes(locationQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [people, query, roleFilter, locationQuery]);

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-1/4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2 text-uapa-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          Filtros de Red
        </h3>

        <div className="space-y-6">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Búsqueda / Search</label>
            <input 
              type="text" 
              placeholder="Nombre, título o habilidad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-uapa-orange outline-none transition"
            />
          </div>

          {/* Location Search */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">{t('jobs.filters.location')} / Ubicación</label>
            <input 
              type="text" 
              placeholder="Ej. Santiago, DO"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-uapa-orange outline-none transition"
            />
          </div>

          {/* Role Dropdown */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Rol / Role</label>
             <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-uapa-orange outline-none transition bg-white"
            >
              <option value="all">Todos / All</option>
              <option value="talent">Talento / Talent</option>
              <option value="recruiter">Reclutador / Recruiter</option>
            </select>
          </div>

          {/* Clear button */}
          <button 
            onClick={() => {
              setQuery('');
              setRoleFilter('all');
              setLocationQuery('');
            }}
            className="w-full py-2 bg-gray-50 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition border border-gray-200"
          >
            Limpiar / Clear
          </button>
        </div>
      </aside>

      {/* Main Feed */}
      <div className="w-full md:w-3/4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="text-xl font-bold text-gray-400 animate-pulse">Cargando perfiles...</div>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron perfiles</h3>
            <p className="text-gray-500">Prueba ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredPeople.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-uapa-blue hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden">
                {/* Banner background to give LinkedIn feel */}
                <div className="absolute top-0 left-0 w-full h-16 bg-uapa-blue/10"></div>
                
                <div className="relative flex items-center mb-4 mt-2">
                   <div className="w-16 h-16 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center">
                     {p.avatar_url ? (
                        <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                        <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                     )}
                   </div>
                   <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-uapa-blue transition-colors">
                        {p.full_name || 'Usuario Anónimo'}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {p.role === 'recruiter' ? 'Reclutador / Recruiter' : 'Talento / Talent'}
                      </p>
                   </div>
                </div>
                
                <p className="text-gray-700 font-medium mb-3 line-clamp-2 min-h-[48px]">
                   {p.headline || 'Buscando nuevas oportunidades...'}
                </p>

                {p.location && (
                   <span className="flex items-center text-sm text-gray-500 mb-4">
                     <svg className="w-4 h-4 mr-1 text-uapa-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                     {p.location}
                   </span>
                )}
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                       {p.skills && p.skills.length > 0 ? (
                           p.skills.slice(0, 3).map(skill => (
                               <span key={skill} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                                   {skill}
                               </span>
                           ))
                       ) : (
                           <span className="text-xs text-gray-400 italic">No hay habilidades listadas</span>
                       )}
                       {p.skills && p.skills.length > 3 && (
                           <span className="text-xs bg-gray-50 text-gray-400 px-2 py-1 rounded-md border border-gray-200">
                               +{p.skills.length - 3}
                           </span>
                       )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
