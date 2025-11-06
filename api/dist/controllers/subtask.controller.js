"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubTask = exports.createSubTask = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const notification_controller_1 = require("./notification.controller");
const client_1 = require("@prisma/client");
// POST /api/tasks/:taskId/subtasks - Create a new subtask
exports.createSubTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, assignedUserId, dueDate } = req.body;
    // 1. Check if the task exists and the current user is a creator or assigned user
    const task = await prisma_1.default.task.findUnique({
        where: { id: taskId },
        include: { assignedUsers: true },
    });
    const isCreatorOrAssigned = task && (task.creatorId === req.user.id ||
        task.assignedUsers.some(user => user.id === req.user.id));
    if (!isCreatorOrAssigned) {
        res.status(403);
        throw new Error('Not authorized to create sub-tasks for this task.');
    }
    // 2. Check if the assigned user is part of the task (creator or assigned)
    const isAssignedUserValid = task.creatorId === assignedUserId ||
        task.assignedUsers.some(user => user.id === assignedUserId);
    if (!isAssignedUserValid) {
        res.status(400);
        throw new Error('Assigned user must be an already assigned member of the parent task.');
    }
    const subTask = await prisma_1.default.subTask.create({
        data: {
            title,
            description,
            taskId,
            assignedUserId,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: client_1.TaskStatus.PENDING,
        },
        include: { task: { select: { title: true } } }
    });
    // 3. Notify the assigned user
    await (0, notification_controller_1.createNotification)(assignedUserId, `You were assigned a new sub-task: "${subTask.title}" under task "${subTask.task.title}".`);
    res.status(201).json(subTask);
});
// PATCH /api/subtasks/:id - Update subtask details or status
exports.updateSubTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;
    // 1. Find subtask and ensure the user is the assigned user
    const subTask = await prisma_1.default.subTask.findUnique({ where: { id } });
    if (!subTask) {
        res.status(404);
        throw new Error('Sub-task not found');
    }
    // Allow the assigned user or the task creator to update status/details
    const task = await prisma_1.default.task.findUnique({ where: { id: subTask.taskId } });
    const isAuthorized = subTask.assignedUserId === req.user.id || task?.creatorId === req.user.id;
    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to update this sub-task.');
    }
    const updatedSubTask = await prisma_1.default.subTask.update({
        where: { id },
        data: {
            title,
            description,
            status,
            dueDate: dueDate ? new Date(dueDate) : subTask.dueDate,
        },
    });
    res.json(updatedSubTask);
});
