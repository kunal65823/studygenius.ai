// SignupPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export function SignupPage() {
  const [form, setForm]     = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName } },
      });
      if (error) throw error;
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-[#1a1a35] to-[#0f0f1a] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-600/30 mb-4">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Start studying smarter with AI</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {['fullName', 'email', 'password'].map((field) => (
              <div key={field}>
                <label className="text-sm text-gray-300 font-medium block mb-1.5 capitalize">
                  {field === 'fullName' ? 'Full Name' : field}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                             placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50
                             focus:border-brand-500 text-sm transition-all"
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default SignupPage;
