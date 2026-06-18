import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('bookmarks').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ bookmarks: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    const { data, error } = await supabase.from('bookmarks').insert({ user_id: req.user.id, item_type: itemType, item_id: itemId }).select().single();
    if (error) return res.status(409).json({ error: 'Already bookmarked' });
    res.status(201).json({ bookmark: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('bookmarks').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Bookmark removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
