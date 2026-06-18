import { supabase }        from '../config/supabase.js';
import { generateSummary } from '../services/gemini.js';
import { extractImportantTopics, explainLikeIm5 } from '../services/gemini.js';

// ── Generate Summary ──────────────────────────────────────────
export const createSummary = async (req, res) => {
  try {
    const { noteId, type = 'short', mode = 'easy' } = req.body;

    // Fetch note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, title, raw_text, is_processed')
      .eq('id', noteId)
      .eq('user_id', req.user.id)
      .single();

    if (noteError || !note) return res.status(404).json({ error: 'Note not found' });
    if (!note.raw_text)     return res.status(400).json({ error: 'Note has no extractable text' });

    // Generate
    const content = await generateSummary({ text: note.raw_text, type, mode });

    // Save
    const { data: summary, error: saveError } = await supabase
      .from('summaries')
      .insert({
        note_id     : noteId,
        user_id     : req.user.id,
        summary_type: type,
        mode,
        content,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    res.status(201).json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── List Summaries for a Note ─────────────────────────────────
export const listSummaries = async (req, res) => {
  try {
    const { noteId } = req.params;

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('note_id', noteId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ summaries: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Smart Study Tools ─────────────────────────────────────────
export const getSmartInsights = async (req, res) => {
  try {
    const { noteId } = req.params;

    const { data: note } = await supabase
      .from('notes')
      .select('raw_text')
      .eq('id', noteId)
      .eq('user_id', req.user.id)
      .single();

    if (!note?.raw_text) return res.status(404).json({ error: 'Note not found or empty' });

    const insights = await extractImportantTopics(note.raw_text);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getELI5 = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { topic }  = req.query;

    const { data: note } = await supabase
      .from('notes')
      .select('raw_text')
      .eq('id', noteId)
      .eq('user_id', req.user.id)
      .single();

    if (!note?.raw_text) return res.status(404).json({ error: 'Note not found' });

    const explanation = await explainLikeIm5({ text: note.raw_text, topic });
    res.json({ explanation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete Summary ────────────────────────────────────────────
export const deleteSummary = async (req, res) => {
  try {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Summary deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
