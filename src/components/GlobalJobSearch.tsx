import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: 'static' | 'live';
  modality: 'remote' | 'hybrid' | 'onsite';
  isInternship: boolean;
}

interface GlobalJobSearchProps {
  lang: keyof typeof ui;
}

export default function GlobalJobSearch({ lang }: GlobalJobSearchProps) {
  const t = useTranslations(lang);
  
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [query, setQuery] = useState('');
  const [modality, setModality] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [isInternship, setIsInternship] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      let combined: JobData[] = [];
      const seenUrls = new Set<string>();

      const determineModality = (loc: string): 'remote' | 'hybrid' | 'onsite' => {
        const l = loc.toLowerCase();
        if (l.includes('remot')) return 'remote';
        if (l.includes('hybrid') || l.includes('híbrid') || l.includes('hibrid')) return 'hybrid';
        return 'onsite'; // Default assumption
      };

      const determineInternship = (title: string, company: string): boolean => {
        const text = (title + " " + company).toLowerCase();
        return text.includes('intern') || text.includes('pasant') || text.includes('trainee');
      };

      // 1. Fetch static jobs via Pagefind
      try {
        // @ts-ignore
        if (!window.pagefind) {
          const pagefindPath = "/pagefind/pagefind.js";
          // @ts-ignore
          window.pagefind = await import(/* @vite-ignore */ pagefindPath);
        }
        // @ts-ignore
        const search = await window.pagefind.search(null); // null query fetches all
        const data = await Promise.all(search.results.map((r: any) => r.data()));
        
        const pfResults = data.map((d: any) => {
          seenUrls.add(d.url);
          const title = d.meta.title || 'Untitled';
          const company = d.filters?.company?.[0] || 'Unknown Company';
          const location = d.filters?.location?.[0] || 'Unknown Location';
          
          return {
            id: d.url,
            title,
            company,
            location,
            url: lang === 'es' ? d.url : `/${lang}${d.url}`,
            source: 'static' as const,
            modality: determineModality(location),
            isInternship: determineInternship(title, company)
          };
        });
        combined = [...pfResults];
      } catch (e) {
        console.warn("Pagefind not yet indexed or failed to load.", e);
      }

      // 2. Fetch live jobs via Supabase
      try {
        const { data: sbData, error } = await supabase
          .from('jobs')
          .select('id, title, company, location');
          
        if (!error && sbData) {
          const sbResults = sbData
            .map(r => ({
              id: r.id,
              title: r.title,
              company: r.company,
              location: r.location || 'Unknown Location',
              url: lang === 'es' ? `/jobs/${r.id}` : `/${lang}/jobs/${r.id}`,
              source: 'live' as const,
              modality: determineModality(r.location || ''),
              isInternship: determineInternship(r.title, r.company)
            }))
            .filter(r => !seenUrls.has(r.url));
            
          combined = [...combined, ...sbResults];
        }
      } catch (e) {
        console.error("Supabase fetch failed", e);
      }

      // Sort by basically newest or keeping it simple
      setJobs(combined);
      setLoading(false);
    };

    fetchJobs();
  }, [lang]);

  // Derived filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // 1. Keyword search
      if (query && !job.title.toLowerCase().includes(query.toLowerCase()) && !job.company.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      // 2. Modality
      if (modality !== 'all' && job.modality !== modality) {
        return false;
      }
      // 3. Internship
      if (isInternship && !job.isInternship) {
        return false;
      }
      // 4. Location
      if (locationQuery && !job.location.toLowerCase().includes(locationQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [jobs, query, modality, isInternship, locationQuery]);

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-1/4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2 text-uapa-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          {t('jobs.filters.title')}
        </h3>

        <div className="space-y-6">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Búsqueda / Search</label>
            <input 
              type="text" 
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-uapa-orange outline-none transition"
            />
          </div>

          {/* Location Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('jobs.filters.location')}</label>
            <input 
              type="text" 
              placeholder="Ej. Santiago, Santo Domingo"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-uapa-orange outline-none transition"
            />
          </div>

          {/* Modality Dropdown */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Modalidad</label>
             <select 
              value={modality} 
              onChange={(e) => setModality(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-uapa-orange outline-none transition bg-white"
            >
              <option value="all">{t('jobs.filters.all')}</option>
              <option value="remote">{t('jobs.filters.remote')}</option>
              <option value="hybrid">{t('jobs.filters.hybrid')}</option>
              <option value="onsite">{t('jobs.filters.onsite')}</option>
            </select>
          </div>

          {/* Internship Checkbox */}
          <div>
             <label className="flex items-center cursor-pointer">
               <input 
                  type="checkbox" 
                  checked={isInternship}
                  onChange={(e) => setIsInternship(e.target.checked)}
                  className="w-5 h-5 rounded text-uapa-orange focus:ring-uapa-orange border-gray-300" 
                />
               <span className="ml-3 text-sm font-medium text-gray-700">{t('jobs.filters.internship')}</span>
             </label>
          </div>

          {/* Clear button */}
          <button 
            onClick={() => {
              setQuery('');
              setModality('all');
              setIsInternship(false);
              setLocationQuery('');
            }}
            className="w-full py-2 bg-gray-50 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition border border-gray-200"
          >
            {t('jobs.filters.clear')}
          </button>
        </div>
      </aside>

      {/* Main Feed */}
      <div className="w-full md:w-3/4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="text-xl font-bold text-gray-400 animate-pulse">{t('search.searching')}</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron empleos</h3>
            <p className="text-gray-500">Prueba ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredJobs.map(job => (
              <a href={job.url} key={job.id} className="block group">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-uapa-blue hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-uapa-blue transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-gray-500 font-medium mt-1">{job.company}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="flex items-center text-sm text-uapa-orange font-semibold bg-orange-50 px-3 py-1 rounded-full">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {job.location}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        job.modality === 'remote' ? 'bg-green-100 text-green-700' :
                        job.modality === 'hybrid' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {job.modality === 'remote' ? t('jobs.filters.remote') : job.modality === 'hybrid' ? t('jobs.filters.hybrid') : t('jobs.filters.onsite')}
                      </span>
                      {job.isInternship && (
                        <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800">
                          {t('jobs.filters.internship')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <span className="inline-flex items-center justify-center p-3 rounded-full bg-gray-50 text-gray-400 group-hover:bg-uapa-blue group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
