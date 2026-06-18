import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X, RotateCcw, Trophy } from 'lucide-react';
import { flashcardsAPI } from '../services/api';

export default function FlashcardReview() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({ known: 0, unknown: 0, reviewed: 0 });
  const [done, setDone]     = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['flashcard-set', id],
    queryFn : () => flashcardsAPI.getSet(id).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ cardId, status }) => flashcardsAPI.updateStatus(id, cardId, status),
  });

  const cards = data?.set?.flashcards || [];
  const card  = cards[index];
  const total = cards.length;

  const handleStatus = (status) => {
    if (card) updateMutation.mutate({ cardId: card.id, status });
    setResults(r => ({
      ...r,
      known  : status === 'known'   ? r.known   + 1 : r.known,
      unknown: status === 'unknown' ? r.unknown + 1 : r.unknown,
      reviewed: r.reviewed + 1,
    }));
    setFlipped(false);
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center mx-auto mb-4">
        <Trophy size={36} className="text-brand-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{total} cards reviewed</p>
      <div className="flex justify-center gap-6 mb-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-500">{results.known}</p>
          <p className="text-sm text-gray-400">Known</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-400">{results.unknown}</p>
          <p className="text-sm text-gray-400">Review</p>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setIndex(0); setFlipped(false); setDone(false); setResults({ known: 0, unknown: 0, reviewed: 0 }); }}
          className="btn-secondary"><RotateCcw size={14} />Restart</button>
        <button onClick={() => navigate('/flashcards')} className="btn-primary">All Flashcards</button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/flashcards')} className="btn-ghost">
          <ArrowLeft size={16} />Back
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 dark:text-white truncate">{data?.set?.title}</h1>
        </div>
        <span className="text-sm text-gray-400">{index + 1} / {total}</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full bg-brand-600 rounded-full"
          animate={{ width: `${((index) / total) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* Card */}
      <div className="perspective-1000 h-72 cursor-pointer" onClick={() => setFlipped(f => !f)}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', damping: 20 }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div className="absolute inset-0 card p-8 flex flex-col items-center justify-center text-center backface-hidden">
            <span className="section-label mb-3">Question</span>
            <p className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
              {card?.front}
            </p>
            <p className="text-sm text-gray-400 mt-4 animate-pulse">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 card p-8 flex flex-col items-center justify-center text-center bg-brand-600 border-0"
               style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <span className="text-xs font-semibold text-brand-200 uppercase tracking-wider mb-3">Answer</span>
            <p className="text-lg font-medium text-white leading-relaxed">{card?.back}</p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      {flipped && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-center">
          <button onClick={() => handleStatus('unknown')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-500 font-semibold hover:bg-red-100 dark:hover:bg-red-950 transition-all active:scale-95">
            <X size={18} />Need Review
          </button>
          <button onClick={() => handleStatus('known')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-600 font-semibold hover:bg-green-100 dark:hover:bg-green-950 transition-all active:scale-95">
            <Check size={18} />Got It!
          </button>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
          disabled={index === 0} className="btn-ghost disabled:opacity-30">
          <ArrowLeft size={16} />Previous
        </button>
        <button onClick={() => { setIndex(i => Math.min(total - 1, i + 1)); setFlipped(false); }}
          disabled={index === total - 1} className="btn-ghost disabled:opacity-30">
          Next<ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
