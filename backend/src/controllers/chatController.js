import { supabase }       from '../config/supabase.js';
import { chatWithNotes }  from '../services/gemini.js';

// ── Create Chat Session ───────────────────────────────────────
export const createSession = async (req, res) => {
  try {
    const { noteId, title } = req.body;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: req.user.id,
        note_id: noteId || null,
        title  : title || 'New Chat',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ session: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── List Sessions ─────────────────────────────────────────────
export const listSessions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, notes(title)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json({ sessions: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get Session with Messages ─────────────────────────────────
export const getSession = async (req, res) => {
  try {
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('*, notes(title, raw_text)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', req.params.id)
      .order('created_at');

    if (error) throw error;
    res.json({ session, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Send Message ──────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { sessionId, question } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });

    // Get session with note
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('*, notes(raw_text, title)')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const noteText = session.notes?.raw_text || '';

    // Get recent history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(6);

    const chatHistory = (history || []).reverse();

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role      : 'user',
      content   : question,
    });

    // AI response
    const { answer, sources } = await chatWithNotes({
      question,
      noteText,
      chatHistory,
    });

    // Save assistant message
    const { data: aiMsg, error: saveError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role      : 'assistant',
        content   : answer,
        sources,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Update session title on first message
    if (chatHistory.length === 0) {
      await supabase
        .from('chat_sessions')
        .update({ title: question.slice(0, 60) })
        .eq('id', sessionId);
    }

    res.json({
      message: aiMsg,
      sources,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete Session ────────────────────────────────────────────
export const deleteSession = async (req, res) => {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
