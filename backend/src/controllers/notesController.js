import { supabase }      from '../config/supabase.js';
import { extractText }   from '../services/fileParser.js';
import { getFileExtension } from '../middleware/upload.js';
import { v4 as uuid }    from 'uuid';
import xss               from 'xss';

// ── Upload Note ───────────────────────────────────────────────
export const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId   = req.user.id;
    const file     = req.file;
    const title    = xss(req.body.title || file.originalname.replace(/\.[^/.]+$/, ''));
    const ext      = getFileExtension(file.mimetype);
    const fileName = `${userId}/${uuid()}.${ext}`;

    // 1. Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('notes')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert     : false,
      });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage.from('notes').getPublicUrl(fileName);

    // 2. Extract text
    const { text, pageCount, wordCount } = await extractText(file.buffer, file.mimetype);

    // 3. Save metadata to DB
    const { data: note, error: dbError } = await supabase
      .from('notes')
      .insert({
        user_id     : userId,
        title,
        file_name   : file.originalname,
        file_type   : ext,
        file_url    : publicUrl,
        file_size   : file.size,
        page_count  : pageCount,
        word_count  : wordCount,
        raw_text    : text,
        is_processed: true,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json({ message: 'Note uploaded successfully', note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── List Notes ────────────────────────────────────────────────
export const listNotes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ notes: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get Single Note ───────────────────────────────────────────
export const getNote = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Note not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Rename Note ───────────────────────────────────────────────
export const renameNote = async (req, res) => {
  try {
    const title = xss(req.body.title?.trim());
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { data, error } = await supabase
      .from('notes')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Note not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete Note ───────────────────────────────────────────────
export const deleteNote = async (req, res) => {
  try {
    // Get note to find storage path
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('file_url, file_name')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !note) return res.status(404).json({ error: 'Note not found' });

    // Delete from DB (cascades to summaries, flashcards, etc.)
    const { error: dbError } = await supabase
      .from('notes')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (dbError) throw dbError;

    // Optionally delete from storage (non-blocking)
    const storagePath = note.file_url.split('/notes/')[1];
    if (storagePath) {
      await supabase.storage.from('notes').remove([storagePath]).catch(() => {});
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
