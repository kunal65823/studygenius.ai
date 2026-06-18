// routes/analytics.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboardStats, logStudySession } from '../controllers/analyticsController.js';
const analyticsRouter = Router();
analyticsRouter.use(authenticate);
analyticsRouter.get('/dashboard', getDashboardStats);
analyticsRouter.post('/session', logStudySession);
export { analyticsRouter as default };
