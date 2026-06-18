import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Send, Plus, MessageSquare, Trash2, Sparkles, FileText, Loader2
} from 'lucide-react';
import { chatAPI, notesAPI } from '../services/api';
import toast from 'react-hot-toast';

function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
        ${isUser ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
        {isUser ? 'U' : <Sparkles size={14} />}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {/* Sources */}
        {!isUser && message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.sources.map((s, i) => (
              <span key={i}
                className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full truncate max-w-48"
                title={s.excerpt}>
                📄 {s.excerpt?.slice(0, 30)}…
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const [input, setInput]   = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef             = useRef(null);

  // List sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn : () => chatAPI.listSessions().then(r => r.data),
  });

  // Load selected session
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn : () => chatAPI.getSession(sessionId).then(r => r.data),
    enabled : !!sessionId,
    onSuccess: (d) => setMessages(d.messages || []),
  });

  // Notes for new chat
  const { data: notesData } = useQuery({
    queryKey: ['notes-list'],
    queryFn : () => notesAPI.list({ limit: 50 }).then(r => r.data),
  });

  const newSessionMutation = useMutation({
    mutationFn: (noteId) => chatAPI.createSession({ noteId }).then(r => r.data.session),
    onSuccess : (s) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      navigate(`/chat/${s.id}`);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (question) => chatAPI.sendMessage({ sessionId, question }).then(r => r.data),
    onMutate  : (question) => {
      // Optimistic user bubble
      setMessages(m => [...m, { id: Date.now(), role: 'user', content: question, created_at: new Date().toISOString() }]);
    },
    onSuccess: (data) => {
      setMessages(m => [...m, data.message]);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: chatAPI.deleteSession,
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      navigate('/chat');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || sendMutation.isPending) return;
    setInput('');
    sendMutation.mutate(q);
  };

  const SUGGESTED = [
    "Summarize the key points",
    "What are the most important topics?",
    "Explain this in simple terms",
    "What questions might appear in an exam?",
  ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-4">
      {/* Sidebar: sessions */}
      <div className="hidden md:flex flex-col w-60 card p-3 space-y-1 shrink-0">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="section-label">Chats</span>
          <button onClick={() => navigate('/chat')} className="btn-ghost p-1.5">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {sessionsData?.sessions?.map(s => (
            <button key={s.id} onClick={() => navigate(`/chat/${s.id}`)}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-sm transition-all truncate flex items-center gap-2
                ${s.id === sessionId
                  ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
              <MessageSquare size={13} className="shrink-0" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
          {!sessionsData?.sessions?.length && (
            <p className="text-xs text-gray-400 text-center py-4">No chats yet</p>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {!sessionId ? (
          /* New chat - select note */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Chat with your Notes</h2>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-xs">
              Select a note to start asking questions. The AI answers only from your uploaded content.
            </p>
            <div className="w-full max-w-sm space-y-2">
              {notesData?.notes?.slice(0, 8).map(note => (
                <button key={note.id} onClick={() => newSessionMutation.mutate(note.id)}
                  disabled={newSessionMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 card hover:border-brand-200 dark:hover:border-brand-800 transition-all text-left">
                  <FileText size={16} className="text-brand-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{note.title}</span>
                </button>
              ))}
              {!notesData?.notes?.length && (
                <p className="text-sm text-gray-400 text-center">Upload a note first to start chatting!</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles size={16} className="text-brand-500 shrink-0" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {sessionData?.session?.title || 'AI Chat'}
                </span>
                {sessionData?.session?.notes?.title && (
                  <span className="badge bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400 hidden sm:inline-flex">
                    📄 {sessionData.session.notes.title}
                  </span>
                )}
              </div>
              <button onClick={() => deleteMutation.mutate(sessionId)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sessionLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-4">Ask anything about your note</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTED.map(q => (
                      <button key={q} onClick={() => { setInput(q); }}
                        className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 dark:hover:text-brand-400 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => <ChatBubble key={msg.id || i} message={msg} />)
              )}
              {sendMutation.isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                    <Sparkles size={14} className="text-gray-400" />
                  </div>
                  <div className="card px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-white/10">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask a question about your note…"
                  rows={1}
                  className="input flex-1 resize-none min-h-[42px] max-h-32 py-2.5 leading-relaxed"
                />
                <button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending}
                  className="btn-primary p-2.5 shrink-0 disabled:opacity-40">
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
