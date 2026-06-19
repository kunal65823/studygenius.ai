import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { logger } from './utils/logger.js';

import authRoutes      from './routes/auth.js';
import notesRoutes     from './routes/notes.js';
import summaryRoutes   from './routes/summary.js';
import flashcardRoutes from './routes/flashcards.js';
import mcqRoutes       from './routes/mcq.js';
import quizRoutes      from './routes/quiz.js';
import chatRoutes      from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';
import bookmarkRoutes  from './routes/bookmarks.js';
import goalRoutes      from './routes/goals.js';
import searchRoutes    from './routes/search.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// Allow these origins - add your Vercel URL here directly as a fallback
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://studygenius-ai-three.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // permissive for now - log it instead
      logger.warn(`CORS: origin not in allowlist: ${origin}`);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max     : parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',       authRoutes);
app.use('/api/notes',      notesRoutes);
app.use('/api/summary',    summaryRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/mcq',        mcqRoutes);
app.use('/api/quiz',       quizRoutes);
app.use('/api/chat',       chatRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/bookmarks',  bookmarkRoutes);
app.use('/api/goals',      goalRoutes);
app.use('/api/search',     searchRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 StudyGenius API running on port ${PORT}`);
});

export default app;