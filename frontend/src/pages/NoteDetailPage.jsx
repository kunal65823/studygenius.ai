import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  FileText, Zap, Layers, Brain, MessageSquare, Lightbulb,
  ArrowLeft, Clock, Hash, BookOpen, Loader2, ChevronRight, Sparkles
} from 'lucide-react';
import { notesAPI, summaryAPI, flashcardsAPI, mcqAPI, chatAPI } from '../services/api';
import toast from 'react-hot-toast';

const SUMMARY_TYPES = [
  { type: 'short',    label: 'Short',    desc: '2-3 paragraph overview' },
  { type: 'detailed', label: 'Detailed', desc: 'Comprehensive breakdown' },
  { type: 'bullet',   label: 'Bullet',   desc: 'Key points list' },
  { type: 'chapter',  label: 'Chapter',  desc: 'Section by section' },
  { type: 'concepts', label: 'Concepts', desc: 'Definitions & terms' },
];

const MODES = [
  { mode: 'easy',  label: 'Easy Mode',  color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  { mode: 'exam',  label: 'Exam Mode',  color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  { mode: 'quick', label: 'Quick',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
];

function AIActionCard({ icon: Icon, title, desc, color, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="card p-4 text-left hover:shadow-md transition-all group active:scale-[0.98] w-full">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
      </div>
      <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 mt-2 transition-colors" />
    </button>
  );
}

export default function NoteDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();

  const [summaryType, setSummaryType] = useState('short');
  const [mode, setMode]               = useState('easy');
  const [mcqCount, setMcqCount]       = useState(10);
  const [mcqDiff, setMcqDiff]         = useState('medium');
  const [activeTab, setActiveTab]     = useState('actions'); // actions | summary | insights
  const [insights, setInsights]       = useState(null);
  const [generatedSummary, setGeneratedSummary] = useState(null);

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn : () => notesAPI.get(id).then(r => r.data),
  });

  const summaryMutation = useMutation({
    mutationFn: () => summaryAPI.create({ noteId: id, type: summaryType, mode }).then(r => r.data.summary),
    onSuccess : (summary) => {
      setGeneratedSummary(summary);
      setActiveTab('summary');
      toast.success('Summary generated!');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const flashcardMutation = useMutation({
    mutationFn: () => flashcardsAPI.createSet({ noteId: id, count: 15 }).then(r => r.data.set),
    onSuccess : (set) => {
      toast.success(`${set.flashcards?.length} flashcards created!`);
      navigate(`/flashcards/${set.id}/review`);
    },
    onError: (err) => toast.error(err.message),
  });

  const mcqMutation = useMutation({
    mutationFn: () => mcqAPI.createSet({ noteId: id, count: mcqCount, difficulty: mcqDiff }).then(r => r.data.set),
    onSuccess : (set) => {
      toast.success(`${mcqCount} MCQs generated!`);
      navigate(`/quiz/${set.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const insightsMutation = useMutation({
    mutationFn: () => summaryAPI.getInsights(id).then(r => r.data.insights),
    onSuccess : (data) => {
      setInsights(data);
      setActiveTab('insights');
    },
    onError: (err) => toast.error(err.message),
  });

  const chatMutation = useMutation({
    mutationFn: () => chatAPI.createSession({ noteId: id, title: note?.title }).then(r => r.data.session),
    onSuccess : (session) => navigate(`/chat/${session.id}`),
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!note) return <div className="text-center py-20 text-gray-400">Note not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/notes')} className="btn-ghost mb-3 -ml-2">
          <ArrowLeft size={16} />Back to Notes
        </button>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center shrink-0">
            <FileText size={22} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{note.title}</h1>
            <div className="flex flex-wrap gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Hash size={12} />{note.word_count?.toLocaleString()} words
              </span>
              {note.page_count && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <BookOpen size={12} />{note.page_count} pages
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />{new Date(note.created_at).toLocaleDateString()}
              </span>
              <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                {note.file_type?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-white/10">
        {['actions', 'summary', 'insights'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px
              ${activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Actions tab */}
      {activeTab === 'actions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Summary generator */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-amber-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Generate Summary</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="section-label mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                  {SUMMARY_TYPES.map(({ type, label }) => (
                    <button key={type} onClick={() => setSummaryType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                        ${summaryType === type ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="section-label mb-2">Mode</p>
                <div className="flex flex-wrap gap-2">
                  {MODES.map(({ mode: m, label, color }) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                        ${mode === m ? 'ring-2 ring-brand-500 ' + color : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => summaryMutation.mutate()} disabled={summaryMutation.isPending}
              className="btn-primary">
              {summaryMutation.isPending ? <><Loader2 size={14} className="animate-spin" />Generating…</> : <><Sparkles size={14} />Generate Summary</>}
            </button>
          </div>

          {/* AI Action grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AIActionCard icon={Layers} title="Flashcards" desc="AI generates flip cards"
              color="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
              onClick={() => flashcardMutation.mutate()} loading={flashcardMutation.isPending} />

            <AIActionCard icon={MessageSquare} title="Chat with Note" desc="Ask questions, get answers"
              color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
              onClick={() => chatMutation.mutate()} loading={chatMutation.isPending} />

            <AIActionCard icon={Lightbulb} title="Smart Insights" desc="Topics, exam Qs, formulas"
              color="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
              onClick={() => insightsMutation.mutate()} loading={insightsMutation.isPending} />

            <div className="card p-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center mb-3">
                <Brain size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Generate MCQs</p>
              <div className="space-y-2 mb-3">
                <select value={mcqCount} onChange={e => setMcqCount(+e.target.value)} className="input text-xs py-1.5">
                  {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n} Questions</option>)}
                </select>
                <select value={mcqDiff} onChange={e => setMcqDiff(e.target.value)} className="input text-xs py-1.5">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <button onClick={() => mcqMutation.mutate()} disabled={mcqMutation.isPending}
                className="btn-primary text-xs py-1.5 w-full justify-center">
                {mcqMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Generate'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary tab */}
      {activeTab === 'summary' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
          {generatedSummary ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  {generatedSummary.summary_type}
                </span>
                <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                  {generatedSummary.mode}
                </span>
              </div>
              <div className="prose-notes">
                <ReactMarkdown>{generatedSummary.content}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <Zap size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No summary yet — generate one from the Actions tab</p>
              <button onClick={() => setActiveTab('actions')} className="btn-secondary mt-3">Generate Summary</button>
            </div>
          )}
        </motion.div>
      )}

      {/* Insights tab */}
      {activeTab === 'insights' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
          {insights ? (
            <div className="prose-notes">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-10">
              <Lightbulb size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No insights yet — generate from the Actions tab</p>
              <button onClick={() => { setActiveTab('actions'); insightsMutation.mutate(); }} className="btn-primary mt-3">
                <Lightbulb size={14} />Generate Insights
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
