import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';

interface JobResult {
  id: string;
  title: string;
  company: string;
  url: string;
  source: 'pagefind' | 'supabase';
}

interface SearchBarProps {
  lang: keyof typeof ui;
}

export default function SearchBar({ lang }: SearchBarProps) {
  const t = useTranslations(lang);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JobResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Initialize Pagefind on the client-side
    const initPagefind = async () => {
      try {
        // Use a variable to prevent Vite static analysis from failing in dev mode
        const pagefindPath = "/pagefind/pagefind.js";
        // @ts-ignore
        window.pagefind = await import(/* @vite-ignore */ pagefindPath);
      } catch (e) {
        console.warn("Pagefind not yet indexed. Run `npm run build` to generate index.");
      }
    };
    initPagefind();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    let combinedResults: JobResult[] = [];
    const seenUrls = new Set<string>();

    try {
      // 1. Static Index Search via Pagefind (Blazing fast for built pages)
      // @ts-ignore
      if (window.pagefind) {
        // @ts-ignore
        const search = await window.pagefind.search(query);
        const data = await Promise.all(search.results.map((r: any) => r.data()));
        
        const pfResults = data.map((d: any) => {
          seenUrls.add(d.url);
          return {
            id: d.url,
            title: d.meta.title || 'Untitled',
            company: d.filters?.company?.[0] || 'Unknown Company',
            url: lang === 'es' ? d.url : `/${lang}${d.url}`,
            source: 'pagefind' as const
          };
        });
        
        combinedResults = [...pfResults];
      }

      // 2. Real-time Database Search via Supabase (For fresh jobs not yet statically indexed)
      const { data: sbData, error } = await supabase
        .from('jobs')
        .select('id, title, company')
        .textSearch('fts', query.split(' ').join(' | ')); // Simple OR search for fallback
      
      if (!error && sbData) {
        const sbResults = sbData
          .map(r => ({
            id: r.id,
            title: r.title,
            company: r.company,
            url: lang === 'es' ? `/jobs/${r.id}` : `/${lang}/jobs/${r.id}`, // the dynamic SSR route for live jobs
            source: 'supabase' as const
          }))
          .filter(r => !seenUrls.has(r.url));
          
        combinedResults = [...combinedResults, ...sbResults];
      } else if (error) {
        console.error("Supabase search error:", error);
      }

      setResults(combinedResults);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          className="flex-grow p-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-uapa-orange focus:ring-4 focus:ring-uapa-orange/20 shadow-sm text-gray-900 transition-all font-medium"
        />
        <button 
          type="submit" 
          disabled={isSearching}
          className="px-8 py-4 bg-uapa-orange text-white font-black uppercase tracking-wide rounded-xl hover:bg-orange-600 shadow-md transition disabled:opacity-50"
        >
          {isSearching ? t('search.searching') : t('search.button')}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden text-left">
          <ul className="divide-y divide-gray-100">
            {results.map(job => (
              <li key={job.id} className="hover:bg-gray-50 transition-colors">
                <a href={job.url} className="block p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-500 mt-1">{job.company}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${job.source === 'pagefind' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {job.source === 'pagefind' ? t('search.source.static') : t('search.source.live')}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {query && !isSearching && results.length === 0 && (
        <div className="mt-6 p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">{t('search.no_results', { query })}</p>
        </div>
      )}
    </div>
  );
}
