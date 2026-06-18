// FlashcardsPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, Play, Trash2, Plus, ArrowRight } from 'lucide-react';
import { flashcardsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function FlashcardsPage() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['flashcard-sets'],
    queryFn : () => flashcardsAPI.listSets().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: flashcardsAPI.deleteSet,
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      toast.success('Deleted');
    },
  });

  const sets = data?.sets || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Flashcards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sets.length} set{sets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/notes')} className="btn-primary">
          <Plus size={15} />Create from Note
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : !sets.length ? (
        <div className="text-center py-20">
          <Layers size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-3">No flashcard sets yet</p>
          <button onClick={() => navigate('/notes')} className="btn-primary">
            <Plus size={14} />Generate from a Note
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set, i) => (
            <motion.div key={set.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 flex flex-col gap-3 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
                  <Layers size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <button onClick={() => { if (window.confirm('Delete this set?')) deleteMutation.mutate(set.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{set.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {set.flashcards?.[0]?.count ?? '—'} cards · {new Date(set.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => navigate(`/flashcards/${set.id}/review`)}
                className="btn-primary w-full justify-center text-xs py-2">
                <Play size={12} />Review Cards
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
