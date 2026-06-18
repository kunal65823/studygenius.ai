// routes/quiz.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { submitQuizResult, getQuizHistory } from '../controllers/mcqController.js';
const quizRouter = Router();
quizRouter.use(authenticate);
quizRouter.post('/submit', submitQuizResult);
quizRouter.get('/history', getQuizHistory);
export { quizRouter as default };
