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

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

// CORS must be first
app.use(cors(corsOptions));

// Handle ALL preflight requests
app.options('*', cors(corsOptions));

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
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check - must be before other routes
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