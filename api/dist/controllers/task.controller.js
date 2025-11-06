"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToInvitation = exports.inviteUserToTask = exports.deleteTask = exports.updateTask = exports.getTaskDetails = exports.getMyTasks = exports.createTask = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const notification_controller_1 = require("./notification.controller");
// Helper: Check if user is creator or assigned (for task management)
const isUserAuthorizedForTask = async (taskId, userId) => {
    const task = await prisma_1.default.task.findUnique({
        where: { id: taskId },
        include: { assignedUsers: true, creator: true },
    });
    if (!task)
        return false;
    // Creator is always authorized
    if (task.creatorId === userId)
        return true;
    // User must be one of the assigned users
    return task.assignedUsers.some(user => user.id === userId);
};
// POST /api/tasks - Create a new task
exports.createTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        res.status(400);
        throw new Error('Task title is required');
    }
    const task = await prisma_1.default.task.create({
        data: {
            title,
            description,
            creatorId: req.user.id,
            // Creator is automatically assigned
            assignedUsers: { connect: [{ id: req.user.id }] }
        },
    });
    res.status(201).json(task);
});
// GET /api/tasks - Get all tasks (created by or assigned to user)
exports.getMyTasks = (0, express_async_handler_1.default)(async (req, res) => {
    // ADMIN can see all tasks, USER sees their tasks
    if (req.user.role === client_1.Role.ADMIN) {
        const tasks = await prisma_1.default.task.findMany({
            include: { creator: true, assignedUsers: true, subTasks: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(tasks);
        return;
    }
    const tasks = await prisma_1.default.task.findMany({
        where: {
            OR: [
                { creatorId: req.user.id },
                { assignedUsers: { some: { id: req.user.id } } }
            ]
        },
        include: {
            creator: { select: { id: true, name: true } },
            assignedUsers: { select: { id: true, name: true } },
            subTasks: {
                include: { assignedUser: { select: { id: true, name: true } } }
            },
            invitations: {
                where: { invitedUserId: req.user.id, status: client_1.InvitationStatus.PENDING },
                include: { invitedByUser: { select: { name: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
});
// GET /api/tasks/:id - Get a single task details
exports.getTaskDetails = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const task = await prisma_1.default.task.findUnique({
        where: { id },
        include: {
            creator: { select: { id: true, name: true } },
            assignedUsers: { select: { id: true, name: true, email: true } },
            subTasks: {
                include: { assignedUser: { select: { id: true, name: true } } }
            },
            invitations: true
        },
    });
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }
    // Authorization check
    const isAuthorized = req.user.role === client_1.Role.ADMIN || await isUserAuthorizedForTask(id, req.user.id);
    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to view this task.');
    }
    res.json(task);
});
// PUT /api/tasks/:id - Update task details
exports.updateTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;
    // Only Creator or Admin can update core details
    const task = await prisma_1.default.task.findUnique({ where: { id } });
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }
    if (task.creatorId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
        res.status(403);
        throw new Error('Only the creator or an Admin can update task details.');
    }
    const updatedTask = await prisma_1.default.task.update({
        where: { id },
        data: {
            title,
            description,
            status: status,
        },
    });
    res.json(updatedTask);
});
// DELETE /api/tasks/:id - Delete a task
exports.deleteTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const task = await prisma_1.default.task.findUnique({ where: { id } });
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }
    // Only Creator or Admin can delete
    if (task.creatorId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
        res.status(403);
        throw new Error('Only the creator or an Admin can delete this task.');
    }
    // Delete related subTasks and invitations first due to foreign key constraints
    await prisma_1.default.subTask.deleteMany({ where: { taskId: id } });
    await prisma_1.default.taskInvitation.deleteMany({ where: { taskId: id } });
    await prisma_1.default.task.delete({ where: { id } });
    res.json({ message: 'Task and related items deleted successfully' });
});
exports.inviteUserToTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { id: taskId } = req.params;
    const { email: invitedUserEmail } = req.body;
    const task = await prisma_1.default.task.findUnique({ where: { id: taskId } });
    if (!task || (task.creatorId !== req.user.id && req.user.role !== client_1.Role.ADMIN)) {
        res.status(403);
        throw new Error('Only the task creator or an Admin can send invitations.');
    }
    const invitedUser = await prisma_1.default.user.findUnique({ where: { email: invitedUserEmail } });
    if (!invitedUser) {
        res.status(404);
        throw new Error('User with that email not found.');
    }
    if (invitedUser.id === req.user.id) {
        res.status(400);
        throw new Error('Cannot invite yourself to a task.');
    }
    const alreadyAssigned = await prisma_1.default.task.count({
        where: { id: taskId, assignedUsers: { some: { id: invitedUser.id } } }
    });
    if (alreadyAssigned > 0) {
        res.status(400);
        throw new Error('User is already assigned to this task.');
    }
    // 4. Create or update the pending invitation
    const invitation = await prisma_1.default.taskInvitation.upsert({
        where: {
            taskId_invitedUserId: {
                taskId,
                invitedUserId: invitedUser.id,
            },
        },
        update: {
            status: client_1.InvitationStatus.PENDING,
        },
        create: {
            taskId,
            invitedUserId: invitedUser.id,
            invitedByUserId: req.user.id,
            status: client_1.InvitationStatus.PENDING,
        },
        include: { invitedByUser: { select: { name: true } } }
    });
    // 5. Send notification
    await (0, notification_controller_1.createNotification)(invitedUser.id, `${req.user.name} has invited you to join the task: "${task.title}".`, task.id, invitation.id, 'TASK_INVITATION');
    res.json({ message: 'Invitation sent successfully', invitation });
});
// PATCH /api/tasks/:id/invitations/:invitationId - Accept/Reject an invitation
exports.respondToInvitation = (0, express_async_handler_1.default)(async (req, res) => {
    const { invitationId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    if (action !== 'accept' && action !== 'reject') {
        res.status(400);
        throw new Error('Action must be "accept" or "reject"');
    }
    // 1. Find the invitation
    const invitation = await prisma_1.default.taskInvitation.findUnique({
        where: { id: invitationId },
        include: { task: true, invitedByUser: true }
    });
    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found');
    }
    // 2. Ensure the authenticated user is the invited user
    if (invitation.invitedUserId !== req.user.id) {
        res.status(403);
        throw new Error('You are not authorized to respond to this invitation.');
    }
    if (invitation.status !== client_1.InvitationStatus.PENDING) {
        res.status(400);
        throw new Error(`Invitation is already ${invitation.status.toLowerCase()}.`);
    }
    const newStatus = action === 'accept' ? client_1.InvitationStatus.ACCEPTED : client_1.InvitationStatus.REJECTED;
    const updatedInvitation = await prisma_1.default.taskInvitation.update({
        where: { id: invitationId },
        data: { status: newStatus },
    });
    // 3. If accepted, connect the user to the Task's assignedUsers list
    if (action === 'accept') {
        await prisma_1.default.task.update({
            where: { id: invitation.taskId },
            data: { assignedUsers: { connect: { id: req.user.id } } },
        });
        await (0, notification_controller_1.createNotification)(invitation.task.creatorId, `${req.user.name} accepted your invitation to join the task: "${invitation.task.title}".`, invitation.taskId, undefined, 'INVITATION_RESPONSE');
    }
    else {
        await (0, notification_controller_1.createNotification)(invitation.task.creatorId, `${req.user.name} rejected your invitation to join the task: "${invitation.task.title}".`, invitation.taskId, // relatedTaskId
        undefined, 'INVITATION_RESPONSE');
    }
    res.json(updatedInvitation);
});
