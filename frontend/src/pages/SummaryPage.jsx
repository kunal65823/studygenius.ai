import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { summaryAPI, notesAPI } from '../services/api';

export default function SummaryPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const { data: noteData } = useQuery({
    queryKey: ['note', id],
    queryFn : () => notesAPI.get(id).then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['summaries', id],
    queryFn : () => summaryAPI.listForNote(id).then(r => r.data),
  });

  const summaries = data?.summaries || [];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <button onClick={() => navigate(`/notes/${id}`)} className="btn-ghost mb-2 -ml-2">
          <ArrowLeft size={15} />Back to Note
        </button>
        <h1 className="page-header">Summaries — {noteData?.title}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : !summaries.length ? (
        <div className="text-center py-16">
          <Zap size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No summaries yet — generate one from the note page</p>
          <button onClick={() => navigate(`/notes/${id}`)} className="btn-primary mt-3">Go to Note</button>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map(s => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">{s.summary_type}</span>
                <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400">{s.mode}</span>
                <span className="text-xs text-gray-400 ml-auto">{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
              <div className="prose-notes">
                <ReactMarkdown>{s.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
