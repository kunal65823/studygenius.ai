import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate }   from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone }   from 'react-dropzone';
import {
  Upload, FileText, Search, Trash2, Edit3, ExternalLink,
  X, Check, File, AlertCircle, Plus
} from 'lucide-react';
import { notesAPI } from '../services/api';
import toast        from 'react-hot-toast';

const FILE_COLORS = {
  pdf : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  docx: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  txt : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  pptx: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
};

function UploadZone({ onUpload, uploading }) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback((files) => {
    if (files[0]) onUpload(files[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxSize: 25 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${isDragActive
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                    : 'border-gray-200 dark:border-white/15 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
    >
      <input {...getInputProps()} />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all
                       ${isDragActive ? 'bg-brand-100 dark:bg-brand-900' : 'bg-gray-100 dark:bg-white/10'}`}>
        {uploading
          ? <span className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          : <Upload size={24} className={isDragActive ? 'text-brand-600' : 'text-gray-400'} />
        }
      </div>
      <p className="font-semibold text-gray-700 dark:text-gray-200">
        {uploading ? 'Uploading & processing…' : isDragActive ? 'Drop to upload' : 'Drag & drop your file'}
      </p>
      <p className="text-sm text-gray-400 mt-1">PDF, DOCX, TXT, PPTX · up to 25 MB</p>
      <button type="button" className="btn-primary mt-4 mx-auto" disabled={uploading}>
        <Plus size={14} />Browse Files
      </button>
    </div>
  );
}

function NoteCard({ note, onDelete, onRename }) {
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(note.title);
  const navigate = useNavigate();

  const handleRename = async () => {
    if (newTitle.trim() && newTitle !== note.title) {
      await onRename(note.id, newTitle.trim());
    }
    setRenaming(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="card p-4 flex items-start gap-3 group hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${FILE_COLORS[note.file_type] || FILE_COLORS.txt}`}>
        <FileText size={18} />
      </div>
      <div className="flex-1 min-w-0">
        {renaming ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
              className="input py-1 text-sm flex-1" />
            <button onClick={handleRename} className="text-green-500 hover:text-green-600"><Check size={16} /></button>
            <button onClick={() => setRenaming(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        ) : (
          <button onClick={() => navigate(`/notes/${note.id}`)}
            className="text-sm font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 text-left truncate w-full transition-colors">
            {note.title}
          </button>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className={`badge ${FILE_COLORS[note.file_type] || FILE_COLORS.txt}`}>{note.file_type?.toUpperCase()}</span>
          {note.word_count && <span className="text-xs text-gray-400">{note.word_count.toLocaleString()} words</span>}
          {note.page_count && <span className="text-xs text-gray-400">{note.page_count} pages</span>}
          <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => navigate(`/notes/${note.id}`)} className="btn-ghost p-1.5" title="Open">
          <ExternalLink size={14} />
        </button>
        <button onClick={() => setRenaming(true)} className="btn-ghost p-1.5" title="Rename">
          <Edit3 size={14} />
        </button>
        <button onClick={() => onDelete(note.id)}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotesPage() {
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDbSearch] = useState('');
  const queryClient                  = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notes', debouncedSearch],
    queryFn : () => notesAPI.list({ search: debouncedSearch }).then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', file.name.replace(/\.[^/.]+$/, ''));
      return notesAPI.upload(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Note uploaded and processed!');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: notesAPI.delete,
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted');
    },
  });

  const renameMutation = useMutation({
    mutationFn: ([id, title]) => notesAPI.rename(id, title),
    onSuccess : () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window.__sg_st);
    window.__sg_st = setTimeout(() => setDbSearch(val), 400);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this note and all associated data?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">My Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data?.total || 0} document{data?.total !== 1 ? 's' : ''} uploaded
          </p>
        </div>
      </div>

      <UploadZone onUpload={(f) => uploadMutation.mutate(f)} uploading={uploadMutation.isPending} />

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="Search notes…"
          className="input pl-9" />
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : !data?.notes?.length ? (
        <div className="text-center py-16">
          <File size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {search ? `No notes matching "${search}"` : 'No notes yet — upload your first document above!'}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {data.notes.map(note => (
              <NoteCard key={note.id} note={note}
                onDelete={handleDelete}
                onRename={(id, title) => renameMutation.mutate([id, title])} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
