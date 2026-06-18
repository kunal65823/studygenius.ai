import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Play, Trash2, Plus, Clock, BarChart2 } from 'lucide-react';
import { mcqAPI } from '../services/api';
import toast from 'react-hot-toast';

const DIFF_COLORS = {
  easy  : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  hard  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

export default function MCQPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['mcq-sets'],
    queryFn : () => mcqAPI.listSets().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: mcqAPI.deleteSet,
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['mcq-sets'] });
      toast.success('MCQ set deleted');
    },
  });

  const sets = data?.sets || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">MCQs & Quizzes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sets.length} set{sets.length !== 1 ? 's' : ''} available</p>
        </div>
        <button onClick={() => navigate('/notes')} className="btn-primary">
          <Plus size={15} />Generate MCQs
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : !sets.length ? (
        <div className="text-center py-20">
          <Brain size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-3">No MCQ sets yet. Generate from a note!</p>
          <button onClick={() => navigate('/notes')} className="btn-primary">
            <Plus size={14} />Go to Notes
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set, i) => (
            <motion.div key={set.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 flex flex-col gap-3 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                  <Brain size={18} className="text-red-500 dark:text-red-400" />
                </div>
                <button
                  onClick={() => { if (window.confirm('Delete this MCQ set?')) deleteMutation.mutate(set.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{set.title}</h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`badge ${DIFF_COLORS[set.difficulty] || DIFF_COLORS.medium}`}>
                    {set.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <BarChart2 size={11} />{set.count} Qs
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />~{set.count} min
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{new Date(set.created_at).toLocaleDateString()}</p>
              </div>

              <button onClick={() => navigate(`/quiz/${set.id}`)}
                className="btn-primary w-full justify-center text-xs py-2">
                <Play size={12} />Start Quiz
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
