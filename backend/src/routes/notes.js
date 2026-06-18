// routes/notes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadNote, listNotes, getNote, renameNote, deleteNote } from '../controllers/notesController.js';
const router = Router();
router.use(authenticate);
router.post('/', upload.single('file'), uploadNote);
router.get('/', listNotes);
router.get('/:id', getNote);
router.patch('/:id', renameNote);
router.delete('/:id', deleteNote);
export default router;
