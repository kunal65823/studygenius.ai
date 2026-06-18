import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

import AppLayout        from './components/layout/AppLayout';
import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import ForgotPage       from './pages/ForgotPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage    from './pages/DashboardPage';
import NotesPage        from './pages/NotesPage';
import NoteDetailPage   from './pages/NoteDetailPage';
import SummaryPage      from './pages/SummaryPage';
import FlashcardsPage   from './pages/FlashcardsPage';
import FlashcardReview  from './pages/FlashcardReview';
import MCQPage          from './pages/MCQPage';
import QuizPage         from './pages/QuizPage';
import QuizResultPage   from './pages/QuizResultPage';
import ChatPage         from './pages/ChatPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import GoalsPage        from './pages/GoalsPage';
import BookmarksPage    from './pages/BookmarksPage';
import SearchPage       from './pages/SearchPage';
import ProfilePage      from './pages/ProfilePage';

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <span className="text-gray-400 text-sm">Loading StudyGenius…</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  console.log('ProtectedRoute → loading:', loading, '| user:', user?.email ?? 'none');
  if (loading) return <FullPageSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const initialize = useAuthStore(s => s.initialize);
  const apply      = useThemeStore(s => s.apply);

  useEffect(() => {
    apply();
    initialize();
  }, []);

  return (
    <Routes>
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/signup"          element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPage />} />
      <Route path="/auth/callback"   element={<AuthCallbackPage />} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"             element={<DashboardPage />} />
        <Route path="notes"                 element={<NotesPage />} />
        <Route path="notes/:id"             element={<NoteDetailPage />} />
        <Route path="notes/:id/summary"     element={<SummaryPage />} />
        <Route path="flashcards"            element={<FlashcardsPage />} />
        <Route path="flashcards/:id/review" element={<FlashcardReview />} />
        <Route path="mcq"                   element={<MCQPage />} />
        <Route path="quiz/:id"              element={<QuizPage />} />
        <Route path="quiz/:id/result"       element={<QuizResultPage />} />
        <Route path="chat"                  element={<ChatPage />} />
        <Route path="chat/:sessionId"       element={<ChatPage />} />
        <Route path="analytics"             element={<AnalyticsPage />} />
        <Route path="goals"                 element={<GoalsPage />} />
        <Route path="bookmarks"             element={<BookmarksPage />} />
        <Route path="search"               element={<SearchPage />} />
        <Route path="profile"              element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}