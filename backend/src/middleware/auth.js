import { supabase } from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = header.split(' ')[1];

    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user       = user;
    req.user.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// AI-specific rate limit: stricter
import { rateLimit } from 'express-rate-limit';

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max     : parseInt(process.env.AI_RATE_LIMIT_MAX) || 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message : { error: 'Too many AI requests. Please wait a moment.' },
});
