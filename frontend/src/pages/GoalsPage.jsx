import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, Check, X, Calendar, Clock } from 'lucide-react';
import { goalsAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active   : 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  paused   : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
};

function GoalCard({ goal, onDelete, onUpdate }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Target size={16} className="text-brand-500 shrink-0" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{goal.title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`badge ${STATUS_COLORS[goal.status]}`}>{goal.status}</span>
          <button onClick={() => onDelete(goal.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
        {goal.target_date && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />{new Date(goal.target_date).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={11} />{goal.daily_minutes} min/day
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-brand-600 rounded-full"
            animate={{ width: `${goal.progress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {goal.status !== 'completed' && (
          <button
            onClick={() => onUpdate(goal.id, { progress: Math.min(100, goal.progress + 10), status: goal.progress >= 90 ? 'completed' : 'active' })}
            className="flex-1 btn-secondary text-xs py-1.5 justify-center">
            <Check size={12} />+10% Progress
          </button>
        )}
        <button
          onClick={() => onUpdate(goal.id, { status: goal.status === 'paused' ? 'active' : 'paused' })}
          className="btn-ghost text-xs py-1.5">
          {goal.status === 'paused' ? 'Resume' : 'Pause'}
        </button>
      </div>
    </motion.div>
  );
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', targetDate: '', dailyMinutes: 30 });

  const { data, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn : () => goalsAPI.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: goalsAPI.create,
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      setForm({ title: '', targetDate: '', dailyMinutes: 30 });
      toast.success('Goal created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ([id, data]) => goalsAPI.update(id, data),
    onSuccess : () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: goalsAPI.delete,
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    },
  });

  const goals = data?.goals || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Study Goals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{goals.length} goal{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Create New Goal</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="section-label block mb-1.5">Goal Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Complete Data Structures revision"
                    className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Target Date</label>
                  <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                    className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Daily Goal (min)</label>
                  <input type="number" min={5} max={480} value={form.dailyMinutes}
                    onChange={e => setForm(f => ({ ...f, dailyMinutes: +e.target.value }))}
                    className="input" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => createMutation.mutate(form)}
                    disabled={!form.title || createMutation.isPending}
                    className="btn-primary w-full justify-center">
                    {createMutation.isPending ? 'Creating…' : 'Create Goal'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
      ) : !goals.length ? (
        <div className="text-center py-20">
          <Target size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No goals yet — set your first study goal!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal}
                onDelete={(id) => deleteMutation.mutate(id)}
                onUpdate={(id, d) => updateMutation.mutate([id, d])} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
