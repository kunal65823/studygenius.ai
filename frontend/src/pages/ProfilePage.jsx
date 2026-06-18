// ProfilePage.jsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, Save, Flame, FileText, Brain, Layers } from 'lucide-react';
import { authAPI, analyticsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [saved, setSaved]       = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn : () => authAPI.getProfile().then(r => r.data.profile),
    onSuccess: (p) => setFullName(p.full_name || ''),
  });

  const { data: statsData } = useQuery({
    queryKey: ['dashboard'],
    queryFn : () => analyticsAPI.dashboard().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: () => authAPI.updateProfile({ fullName }),
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      toast.success('Profile updated!');
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => toast.error(err.message),
  });

  const stats = statsData?.stats || {};
  const profile = profileData;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="page-header">Profile</h1>

      {/* Avatar + info */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600
                        flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '…' : profile?.full_name || 'Student'}
          </h2>
          <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
            <Mail size={13} />{user?.email}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Flame,    label: 'Day Streak',  value: stats.studyStreak    || 0, color: 'text-orange-500' },
          { icon: FileText, label: 'Notes',        value: stats.notesCount     || 0, color: 'text-blue-500'   },
          { icon: Brain,    label: 'Quizzes',      value: stats.quizzesCount   || 0, color: 'text-red-500'    },
          { icon: Layers,   label: 'Flashcard Sets', value: stats.flashcardsCount || 0, color: 'text-purple-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <Icon size={20} className={`${color} mx-auto mb-1`} />
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Edit profile */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <User size={16} className="text-brand-500" />Edit Profile
        </h3>
        <div>
          <label className="section-label block mb-1.5">Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Your full name" className="input max-w-sm" />
        </div>
        <div>
          <label className="section-label block mb-1.5">Email</label>
          <input value={user?.email || ''} disabled
            className="input max-w-sm opacity-60 cursor-not-allowed" />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
        </div>
        <button onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || saved}
          className="btn-primary">
          <Save size={14} />
          {saved ? 'Saved!' : updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
