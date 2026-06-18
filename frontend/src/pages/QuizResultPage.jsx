import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, RotateCcw, Home, BarChart2 } from 'lucide-react';

export default function QuizResultPage() {
  const { state }  = useLocation();
  const { id }     = useParams();
  const navigate   = useNavigate();

  if (!state) { navigate('/mcq'); return null; }

  const { set, answers = [], questions = [] } = state;
  const score      = answers.filter(a => a.correct).length;
  const total      = questions.length;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  const grade =
    percentage >= 90 ? { label: 'Excellent!', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-950' } :
    percentage >= 70 ? { label: 'Good Job!',  color: 'text-blue-500',  bg: 'bg-blue-100 dark:bg-blue-950'  } :
    percentage >= 50 ? { label: 'Keep Going!',color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-950'} :
                       { label: 'Needs Work', color: 'text-red-500',   bg: 'bg-red-100 dark:bg-red-950'    };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Score card */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="card p-8 text-center">
        <div className={`w-20 h-20 rounded-full ${grade.bg} flex items-center justify-center mx-auto mb-4`}>
          <Trophy size={36} className={grade.color} />
        </div>
        <h1 className={`text-3xl font-bold ${grade.color} mb-1`}>{grade.label}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{set?.title}</p>

        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{percentage}%</p>
            <p className="text-xs text-gray-400 mt-1">Score</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-500">{score}</p>
            <p className="text-xs text-gray-400 mt-1">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-red-400">{total - score}</p>
            <p className="text-xs text-gray-400 mt-1">Wrong</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-400'
            }`} />
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(`/quiz/${id}`)} className="btn-secondary">
            <RotateCcw size={14} />Retry Quiz
          </button>
          <button onClick={() => navigate('/mcq')} className="btn-primary">
            <Home size={14} />All MCQs
          </button>
        </div>
      </motion.div>

      {/* Question review */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart2 size={16} className="text-brand-500" />Review Answers
        </h2>
        {questions.map((q, i) => {
          const ans = answers[i];
          const correct = ans?.correct;
          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card p-4 border-l-4 ${correct ? 'border-l-green-500' : 'border-l-red-400'}`}>
              <div className="flex items-start gap-2 mb-2">
                {correct
                  ? <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                  : <XCircle    size={16} className="text-red-400 shrink-0 mt-0.5" />}
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{q.question}</p>
              </div>
              <div className="ml-6 space-y-1">
                {q.options.map((opt, idx) => (
                  <p key={idx}
                    className={`text-xs px-2 py-1 rounded-lg
                      ${idx === q.correct_index ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 font-medium' :
                        idx === ans?.selected && !correct ? 'bg-red-50 dark:bg-red-950/50 text-red-500' :
                        'text-gray-500'}`}>
                    {['A','B','C','D'][idx]}. {opt}
                    {idx === q.correct_index && ' ✓'}
                  </p>
                ))}
                {q.explanation && (
                  <p className="text-xs text-brand-500 dark:text-brand-400 mt-2 pl-1 italic">{q.explanation}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
