import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    createTask, getMyTasks, getTaskDetails, updateTask, deleteTask,
    inviteUserToTask, respondToInvitation
} from '../controllers/task.controller';
import { createSubTask } from '../controllers/subtask.controller';

const router = Router();

router.use(protect); // All Task routes are protected

// Base Task Routes: /tasks
router.route('/')
    .post(createTask)
    .get(getMyTasks);

// Task Detail Routes: /tasks/:id
router.route('/:id')
    .get(getTaskDetails)
    .put(updateTask)
    .delete(deleteTask);

// Invitation and Sub-Task Nested Routes
// /tasks/:id/invite
router.post('/:id/invite', inviteUserToTask);

// /tasks/:id/subtasks
router.post('/:taskId/subtasks', createSubTask);

// Invitation Response: /tasks/invitations/:invitationId
router.patch('/invitations/:invitationId', respondToInvitation);



export default router;