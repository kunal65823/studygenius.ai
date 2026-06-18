import { supabase }           from '../config/supabase.js';
import { generateFlashcards } from '../services/gemini.js';

// ── Generate Flashcard Set ────────────────────────────────────
export const createFlashcardSet = async (req, res) => {
  try {
    const { noteId, count = 15, title } = req.body;

    const { data: note } = await supabase
      .from('notes')
      .select('id, title, raw_text')
      .eq('id', noteId)
      .eq('user_id', req.user.id)
      .single();

    if (!note?.raw_text) return res.status(404).json({ error: 'Note not found' });

    const cards = await generateFlashcards({ text: note.raw_text, count: Math.min(count, 50) });

    // Create set
    const { data: set, error: setError } = await supabase
      .from('flashcard_sets')
      .insert({
        note_id : noteId,
        user_id : req.user.id,
        title   : title || `${note.title} – Flashcards`,
      })
      .select()
      .single();

    if (setError) throw setError;

    // Insert cards
    const cardRows = cards.map(c => ({
      set_id : set.id,
      user_id: req.user.id,
      front  : c.front,
      back   : c.back,
    }));

    const { data: flashcards, error: cardsError } = await supabase
      .from('flashcards')
      .insert(cardRows)
      .select();

    if (cardsError) throw cardsError;

    res.status(201).json({ set: { ...set, flashcards } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── List Flashcard Sets ───────────────────────────────────────
export const listFlashcardSets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('*, flashcards(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ sets: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get Flashcard Set with Cards ──────────────────────────────
export const getFlashcardSet = async (req, res) => {
  try {
    const { data: set } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!set) return res.status(404).json({ error: 'Flashcard set not found' });

    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', req.params.id)
      .order('created_at');

    if (error) throw error;

    res.json({ set: { ...set, flashcards } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Update Flashcard Status ───────────────────────────────────
export const updateCardStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'known', 'unknown', 'review'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('flashcards')
      .update({ status, last_reviewed: new Date().toISOString() })
      .eq('id', req.params.cardId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete Flashcard Set ──────────────────────────────────────
export const deleteFlashcardSet = async (req, res) => {
  try {
    const { error } = await supabase
      .from('flashcard_sets')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Flashcard set deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
