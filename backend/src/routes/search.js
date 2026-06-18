import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });

    const userId = req.user.id;
    const term   = `%${q}%`;

    const [notes, summaries, flashcardSets, mcqSets] = await Promise.all([
      supabase.from('notes').select('id, title, file_type, created_at').eq('user_id', userId).ilike('title', term).limit(5),
      supabase.from('summaries').select('id, summary_type, mode, created_at, note_id').eq('user_id', userId).ilike('content', term).limit(5),
      supabase.from('flashcard_sets').select('id, title, created_at').eq('user_id', userId).ilike('title', term).limit(5),
      supabase.from('mcq_sets').select('id, title, difficulty, created_at').eq('user_id', userId).ilike('title', term).limit(5),
    ]);

    res.json({
      results: {
        notes         : notes.data         || [],
        summaries     : summaries.data     || [],
        flashcardSets : flashcardSets.data || [],
        mcqSets       : mcqSets.data       || [],
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
