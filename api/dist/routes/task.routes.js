"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const task_controller_1 = require("../controllers/task.controller");
const subtask_controller_1 = require("../controllers/subtask.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect); // All Task routes are protected
// Base Task Routes: /tasks
router.route('/')
    .post(task_controller_1.createTask)
    .get(task_controller_1.getMyTasks);
// Task Detail Routes: /tasks/:id
router.route('/:id')
    .get(task_controller_1.getTaskDetails)
    .put(task_controller_1.updateTask)
    .delete(task_controller_1.deleteTask);
// Invitation and Sub-Task Nested Routes
// /tasks/:id/invite
router.post('/:id/invite', task_controller_1.inviteUserToTask);
// /tasks/:id/subtasks
router.post('/:taskId/subtasks', subtask_controller_1.createSubTask);
// Invitation Response: /tasks/invitations/:invitationId
router.patch('/invitations/:invitationId', task_controller_1.respondToInvitation);
exports.default = router;
