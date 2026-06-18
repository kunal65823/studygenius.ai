import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Trash2, ExternalLink, Zap, Layers, Brain, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookmarksAPI } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_META = {
  summary      : { icon: Zap,      color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',  label: 'Summary'  },
  flashcard_set: { icon: Layers,   color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400', label: 'Flashcards' },
  mcq_set      : { icon: Brain,    color: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',          label: 'MCQ Set'  },
  quiz_result  : { icon: BarChart2,color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',  label: 'Quiz'     },
};

function getNavPath(bm) {
  if (bm.item_type === 'flashcard_set') return `/flashcards/${bm.item_id}/review`;
  if (bm.item_type === 'mcq_set')       return `/quiz/${bm.item_id}`;
  return null;
}

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn : () => bookmarksAPI.list().then(r => r.data),
  });

  const removeMutation = useMutation({
    mutationFn: bookmarksAPI.remove,
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark removed');
    },
  });

  const bookmarks = data?.bookmarks || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-header">Bookmarks</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {bookmarks.length} saved item{bookmarks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : !bookmarks.length ? (
        <div className="text-center py-20">
          <Bookmark size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No bookmarks yet — save summaries, flashcards, and quiz results here
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {bookmarks.map((bm, i) => {
              const meta = TYPE_META[bm.item_type] || TYPE_META.summary;
              const Icon = meta.icon;
              const path = getNavPath(bm);

              return (
                <motion.div key={bm.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-4 flex items-center gap-3 group hover:shadow-sm transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`badge ${meta.color} mb-1`}>{meta.label}</span>
                    <p className="text-xs text-gray-400">
                      Saved {new Date(bm.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {path && (
                      <button onClick={() => navigate(path)}
                        className="btn-ghost p-1.5" title="Open">
                        <ExternalLink size={14} />
                      </button>
                    )}
                    <button onClick={() => removeMutation.mutate(bm.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
