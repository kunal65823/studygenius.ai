import { supabase } from '../config/supabase.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      { count: notesCount },
      { count: summariesCount },
      { count: flashcardsCount },
      { count: quizzesCount },
      { data: profile },
      { data: recentNotes },
      { data: weeklyActivity },
      { data: quizScores },
    ] = await Promise.all([
      supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('summaries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('flashcard_sets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('quiz_results').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('profiles').select('study_streak, last_active').eq('id', userId).single(),
      supabase.from('notes').select('id, title, file_type, created_at').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('study_sessions').select('duration, activity_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at'),
      supabase.from('quiz_results').select('score, total, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Aggregate weekly activity by day
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const activityByDay = days.map((day, i) => ({
      day,
      minutes: (weeklyActivity || [])
        .filter(s => new Date(s.created_at).getDay() === i)
        .reduce((sum, s) => sum + (s.duration || 0), 0),
    }));

    // Average quiz score
    const avgScore = quizScores?.length
      ? Math.round(quizScores.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / quizScores.length)
      : 0;

    res.json({
      stats: {
        notesCount     : notesCount    || 0,
        summariesCount : summariesCount || 0,
        flashcardsCount: flashcardsCount|| 0,
        quizzesCount   : quizzesCount   || 0,
        studyStreak    : profile?.study_streak || 0,
        avgQuizScore   : avgScore,
      },
      recentNotes     : recentNotes || [],
      weeklyActivity  : activityByDay,
      recentQuizScores: quizScores?.map(q => ({
        score     : q.score,
        total     : q.total,
        percentage: Math.round((q.score / q.total) * 100),
        date      : q.created_at,
      })) || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const logStudySession = async (req, res) => {
  try {
    const { duration, activityType, noteId } = req.body;

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id      : req.user.id,
        note_id      : noteId || null,
        duration     : duration || 1,
        activity_type: activityType || 'reading',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ session: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
