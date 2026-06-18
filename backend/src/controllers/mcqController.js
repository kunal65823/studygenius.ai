import { supabase }    from '../config/supabase.js';
import { generateMCQs } from '../services/gemini.js';

// ──────────────── MCQ CONTROLLER ─────────────────────────────

export const createMCQSet = async (req, res) => {
  try {
    const { noteId, count = 10, difficulty = 'medium', title } = req.body;

    const { data: note } = await supabase
      .from('notes')
      .select('id, title, raw_text')
      .eq('id', noteId)
      .eq('user_id', req.user.id)
      .single();

    if (!note?.raw_text) return res.status(404).json({ error: 'Note not found' });

    const mcqs = await generateMCQs({
      text      : note.raw_text,
      count     : Math.min(count, 50),
      difficulty,
    });

    // Create set
    const { data: set, error: setError } = await supabase
      .from('mcq_sets')
      .insert({
        note_id   : noteId,
        user_id   : req.user.id,
        title     : title || `${note.title} – ${count} MCQs (${difficulty})`,
        difficulty,
        count     : mcqs.length,
      })
      .select()
      .single();

    if (setError) throw setError;

    // Insert MCQs
    const mcqRows = mcqs.map(q => ({
      set_id       : set.id,
      question     : q.question,
      options      : q.options,
      correct_index: q.correct_index,
      explanation  : q.explanation,
    }));

    const { data: questions, error: qError } = await supabase
      .from('mcqs')
      .insert(mcqRows)
      .select();

    if (qError) throw qError;

    res.status(201).json({ set: { ...set, questions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listMCQSets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mcq_sets')
      .select('*, mcqs(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ sets: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMCQSet = async (req, res) => {
  try {
    const { data: set } = await supabase
      .from('mcq_sets')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!set) return res.status(404).json({ error: 'MCQ set not found' });

    const { data: questions, error } = await supabase
      .from('mcqs')
      .select('*')
      .eq('set_id', req.params.id);

    if (error) throw error;
    res.json({ set: { ...set, questions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMCQSet = async (req, res) => {
  try {
    const { error } = await supabase
      .from('mcq_sets')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'MCQ set deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ──────────────── QUIZ CONTROLLER ────────────────────────────

export const submitQuizResult = async (req, res) => {
  try {
    const { mcqSetId, score, total, timeTaken, answers } = req.body;

    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        user_id   : req.user.id,
        mcq_set_id: mcqSetId,
        score,
        total,
        time_taken: timeTaken,
        answers,
      })
      .select()
      .single();

    if (error) throw error;

    // Log study session
    await supabase.from('study_sessions').insert({
      user_id      : req.user.id,
      duration     : Math.ceil((timeTaken || 60) / 60),
      activity_type: 'quiz',
    });

    res.status(201).json({ result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getQuizHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*, mcq_sets(title, difficulty)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ results: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
