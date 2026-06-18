import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowRight, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { mcqAPI, quizAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function QuizPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState(null);
  const [answers, setAnswers]     = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft]   = useState(null);
  const [quizDone, setQuizDone]   = useState(false);
  const startTime                 = useRef(Date.now());
  const timerRef                  = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['mcq-set', id],
    queryFn : () => mcqAPI.getSet(id).then(r => r.data),
    onSuccess: (d) => {
      const secs = (d.set.questions?.length || 10) * 60; // 1 min per question
      setTimeLeft(secs);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload) => quizAPI.submit(payload),
    onSuccess : (res) => {
      navigate(`/quiz/${id}/result`, {
        state: {
          result   : res.data.result,
          set      : data?.set,
          answers,
          questions: data?.set?.questions,
        },
      });
    },
    onError: (err) => toast.error(err.message),
  });

  // Timer
  useEffect(() => {
    if (timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleFinish(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null]);

  const questions  = data?.set?.questions || [];
  const question   = questions[current];
  const totalQ     = questions.length;
  const timeTaken  = Math.round((Date.now() - startTime.current) / 1000);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, {
      questionId: question.id,
      selected,
      correct   : selected === question.correct_index,
    }];
    setAnswers(newAnswers);

    if (current + 1 >= totalQ) {
      handleFinish(newAnswers);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const handleFinish = (finalAnswers = answers) => {
    clearInterval(timerRef.current);
    const score = finalAnswers.filter(a => a.correct).length;
    submitMutation.mutate({
      mcqSetId : id,
      score,
      total    : totalQ,
      timeTaken,
      answers  : finalAnswers,
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white truncate">{data?.set?.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Question {current + 1} of {totalQ}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold
          ${timeLeft !== null && timeLeft < 60 ? 'bg-red-100 dark:bg-red-950 text-red-500' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}>
          <Clock size={14} />
          {timeLeft !== null ? formatTime(timeLeft) : '—'}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full bg-brand-600 rounded-full"
          animate={{ width: `${(current / totalQ) * 100}%` }} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="card p-6 space-y-5">
          <p className="font-semibold text-gray-900 dark:text-white leading-relaxed text-lg">
            {question?.question}
          </p>

          <div className="space-y-2.5">
            {question?.options?.map((opt, idx) => {
              const isCorrect  = idx === question.correct_index;
              const isSelected = idx === selected;
              let cls = 'border-2 border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 hover:border-brand-300 dark:hover:border-brand-700';
              if (selected !== null) {
                if (isCorrect) cls = 'border-2 border-green-500 bg-green-50 dark:bg-green-950/50';
                else if (isSelected && !isCorrect) cls = 'border-2 border-red-400 bg-red-50 dark:bg-red-950/50';
              }

              return (
                <button key={idx} onClick={() => handleSelect(idx)} disabled={selected !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${cls}`}>
                  <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all
                    ${selected !== null && isCorrect ? 'border-green-500 bg-green-500 text-white'
                      : selected !== null && isSelected ? 'border-red-400 bg-red-400 text-white'
                      : 'border-gray-200 dark:border-white/20 text-gray-500'}`}>
                    {['A','B','C','D'][idx]}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{opt}</span>
                  {selected !== null && isCorrect && <CheckCircle size={16} className="text-green-500 ml-auto shrink-0" />}
                  {selected !== null && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && question?.explanation && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-900 rounded-xl p-4">
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">Explanation</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{question.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {selected !== null && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={handleNext}
              disabled={submitMutation.isPending}
              className="btn-primary w-full justify-center">
              {current + 1 >= totalQ ? (
                submitMutation.isPending ? 'Submitting…' : <><Trophy size={16} />Finish Quiz</>
              ) : <><span>Next Question</span><ArrowRight size={16} /></>}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
