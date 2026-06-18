import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Zap, Layers, Brain, Loader2 } from 'lucide-react';
import { searchAPI } from '../services/api';

const CATEGORY_META = {
  notes         : { icon: FileText, label: 'Note',        color: 'text-blue-500',   path: (id) => `/notes/${id}` },
  summaries     : { icon: Zap,      label: 'Summary',     color: 'text-amber-500',  path: () => null             },
  flashcardSets : { icon: Layers,   label: 'Flashcards',  color: 'text-purple-500', path: (id) => `/flashcards/${id}/review` },
  mcqSets       : { icon: Brain,    label: 'MCQ Set',     color: 'text-red-500',    path: (id) => `/quiz/${id}`  },
};

function ResultRow({ item, category }) {
  const meta     = CATEGORY_META[category];
  const Icon     = meta.icon;
  const navigate = useNavigate();
  const path     = meta.path(item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors
        ${path ? 'hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer' : 'opacity-70'}`}
      onClick={() => path && navigate(path)}
    >
      <div className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 ${meta.color}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {item.title || item.summary_type || 'Untitled'}
        </p>
        <p className="text-xs text-gray-400">
          {meta.label} · {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}

export default function SearchPage() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults(null); return; }
    clearTimeout(window.__sg_search);
    window.__sg_search = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchAPI.search(q);
        setResults(res.data.results);
      } catch (_) {}
      setLoading(false);
    }, 350);
  };

  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="page-header">Search</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Search across all your notes, summaries, and quizzes
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        {loading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-500 animate-spin" />
        )}
        <input
          autoFocus
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search notes, summaries, flashcards, quizzes…"
          className="input pl-11 pr-10 py-3 text-base"
        />
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {!query && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 text-gray-400">
            <Search size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">Start typing to search your study materials</p>
          </motion.div>
        )}

        {query && results && totalResults === 0 && (
          <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 text-gray-400">
            <p className="text-sm">No results found for "<span className="text-gray-600 dark:text-gray-300">{query}</span>"</p>
          </motion.div>
        )}

        {query && results && totalResults > 0 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-gray-400">{totalResults} result{totalResults !== 1 ? 's' : ''}</p>

            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const items = results[key] || [];
              if (!items.length) return null;
              return (
                <div key={key} className="card p-3">
                  <p className="section-label px-2 mb-2">{meta.label}s</p>
                  {items.map(item => (
                    <ResultRow key={item.id} item={item} category={key} />
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
