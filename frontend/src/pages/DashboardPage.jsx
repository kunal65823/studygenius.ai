import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText, Zap, Layers, Brain, Flame, TrendingUp,
  ArrowRight, Plus, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { useAuthStore }  from '../store/authStore';

const StatCard = ({ icon: Icon, label, value, color, to, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Link to={to} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group block">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
      </div>
      <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
    </Link>
  </motion.div>
);

function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.value} {p.name === 'minutes' ? 'min' : '%'}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user }      = useAuthStore();
  const firstName     = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn : () => analyticsAPI.dashboard().then(r => r.data),
  });

  const stats = data?.stats || {};

  const STATS = [
    { icon: FileText, label: 'Notes Uploaded',      value: stats.notesCount,      color: 'bg-blue-500',   to: '/notes',      delay: 0    },
    { icon: Zap,      label: 'Summaries Generated', value: stats.summariesCount,  color: 'bg-amber-500',  to: '/notes',      delay: 0.05 },
    { icon: Layers,   label: 'Flashcard Sets',      value: stats.flashcardsCount, color: 'bg-purple-500', to: '/flashcards', delay: 0.1  },
    { icon: Brain,    label: 'Quizzes Taken',        value: stats.quizzesCount,    color: 'bg-green-500',  to: '/mcq',        delay: 0.15 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Good morning, {firstName} 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Here's your study overview
          </p>
        </div>
        <Link to="/notes" className="btn-primary">
          <Plus size={16} />
          Upload Note
        </Link>
      </div>

      {/* Streak */}
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-4 flex items-center gap-4 bg-gradient-to-r from-brand-600 to-purple-600 text-white border-0"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Flame size={24} className="text-orange-300" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.studyStreak || 0} day streak 🔥</p>
            <p className="text-sm text-white/70">Keep it up! Study today to maintain your streak.</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-sm text-white/70">Avg Quiz Score</p>
            <p className="text-2xl font-bold">{stats.avgQuizScore || 0}%</p>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
          : STATS.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Weekly Study Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Weekly Study Time</h2>
          </div>
          {isLoading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.weeklyActivity || []} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="minutes" fill="#6370f1" radius={[6, 6, 0, 0]} name="minutes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Quiz scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-green-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Quiz Performance</h2>
          </div>
          {isLoading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={(data?.recentQuizScores || []).reverse()}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="percentage" stroke="#22c55e" strokeWidth={2}
                      fill="url(#scoreGrad)" name="score" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Recent Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Notes</h2>
          <Link to="/notes" className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !data?.recentNotes?.length ? (
          <div className="text-center py-8">
            <FileText size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notes yet. Upload your first document!</p>
            <Link to="/notes" className="btn-primary mt-3 inline-flex"><Plus size={14} />Upload Note</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentNotes.map(note => (
              <Link key={note.id} to={`/notes/${note.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-950 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{note.title}</p>
                  <p className="text-xs text-gray-400">{note.file_type?.toUpperCase()} · {new Date(note.created_at).toLocaleDateString()}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
