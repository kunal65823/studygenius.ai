import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart2, TrendingUp, Clock, Brain, Layers, FileText } from 'lucide-react';
import { analyticsAPI } from '../services/api';

const COLORS = ['#6370f1','#22c55e','#f59e0b','#ef4444','#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.value} {p.name}
        </p>
      ))}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn : () => analyticsAPI.dashboard().then(r => r.data),
  });

  const stats = data?.stats || {};

  const pieData = [
    { name: 'Notes',      value: stats.notesCount      || 0 },
    { name: 'Summaries',  value: stats.summariesCount  || 0 },
    { name: 'Flashcards', value: stats.flashcardsCount || 0 },
    { name: 'Quizzes',    value: stats.quizzesCount    || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your study progress</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />) : <>
          <StatCard icon={FileText} label="Notes Uploaded"      value={stats.notesCount}      color="bg-blue-500"   />
          <StatCard icon={TrendingUp} label="Avg Quiz Score"    value={`${stats.avgQuizScore||0}%`} color="bg-green-500" />
          <StatCard icon={Layers}  label="Flashcard Sets"       value={stats.flashcardsCount} color="bg-purple-500" />
          <StatCard icon={Brain}   label="Quizzes Taken"        value={stats.quizzesCount}    color="bg-red-500"    />
        </>}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Weekly Activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Weekly Study Time (min)</h2>
          </div>
          {isLoading ? <div className="skeleton h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.weeklyActivity || []} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="minutes" fill="#6370f1" radius={[6,6,0,0]} name="min" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Quiz score trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Quiz Score Trend (%)</h2>
          </div>
          {isLoading ? <div className="skeleton h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={(data?.recentQuizScores || []).map((q,i) => ({ attempt: i+1, score: q.percentage }))}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#sg)" name="%" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Activity breakdown pie */}
        {pieData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-brand-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Activity Breakdown</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                     paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(val) => <span className="text-xs text-gray-500 dark:text-gray-400">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
