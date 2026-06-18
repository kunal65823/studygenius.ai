// routes/goals.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('study_goals').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ goals: data });
});

router.post('/', async (req, res) => {
  const { title, targetDate, dailyMinutes } = req.body;
  const { data, error } = await supabase.from('study_goals').insert({ user_id: req.user.id, title, target_date: targetDate, daily_minutes: dailyMinutes }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ goal: data });
});

router.patch('/:id', async (req, res) => {
  const { progress, status } = req.body;
  const { data, error } = await supabase.from('study_goals').update({ progress, status }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ goal: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('study_goals').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Goal deleted' });
});

export default router;
