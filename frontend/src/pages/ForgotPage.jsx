import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function ForgotPage() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-[#1a1a35] to-[#0f0f1a] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl mb-4">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="text-gray-400 text-sm mt-1">We'll send a reset link to your email</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <Mail size={22} className="text-green-400" />
              </div>
              <p className="text-white font-medium">Check your inbox</p>
              <p className="text-gray-400 text-sm mt-1">We sent a reset link to <span className="text-brand-400">{email}</span></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 font-medium block mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                             focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-sm" />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-gray-500 mt-5">
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
