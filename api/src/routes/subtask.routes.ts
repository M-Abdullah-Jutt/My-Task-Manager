import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { updateSubTask } from '../controllers/subtask.controller';

const router = Router();

router.use(protect); // All sub-task routes are protected

// /subtasks/:id
router.patch('/:id', updateSubTask);

export default router;