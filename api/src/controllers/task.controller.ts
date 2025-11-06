import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../utils/prisma';
import { Role, InvitationStatus, TaskStatus } from '@prisma/client';
import { createNotification } from './notification.controller';

// Helper: Check if user is creator or assigned (for task management)
const isUserAuthorizedForTask = async (taskId: string, userId: string): Promise<boolean> => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignedUsers: true, creator: true },
    });

    if (!task) return false;

    // Creator is always authorized
    if (task.creatorId === userId) return true;

    // User must be one of the assigned users
    return task.assignedUsers.some(user => user.id === userId);
};

// POST /api/tasks - Create a new task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
    const { title, description } = req.body;

    if (!title) {
        res.status(400);
        throw new Error('Task title is required');
    }

    const task = await prisma.task.create({
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
export const getMyTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ADMIN can see all tasks, USER sees their tasks
    if (req.user.role === Role.ADMIN) {
        const tasks = await prisma.task.findMany({
            include: { creator: true, assignedUsers: true, subTasks: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(tasks);
        return;
    }

    const tasks = await prisma.task.findMany({
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
                where: { invitedUserId: req.user.id, status: InvitationStatus.PENDING },
                include: { invitedByUser: { select: { name: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
});

// GET /api/tasks/:id - Get a single task details
export const getTaskDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
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
    const isAuthorized = req.user.role === Role.ADMIN || await isUserAuthorizedForTask(id, req.user.id);

    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to view this task.');
    }

    res.json(task);
});

// PUT /api/tasks/:id - Update task details
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    // Only Creator or Admin can update core details
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (task.creatorId !== req.user.id && req.user.role !== Role.ADMIN) {
        res.status(403);
        throw new Error('Only the creator or an Admin can update task details.');
    }

    const updatedTask = await prisma.task.update({
        where: { id },
        data: {
            title,
            description,
            status: status as TaskStatus,
        },
    });

    res.json(updatedTask);
});

// DELETE /api/tasks/:id - Delete a task
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Only Creator or Admin can delete
    if (task.creatorId !== req.user.id && req.user.role !== Role.ADMIN) {
        res.status(403);
        throw new Error('Only the creator or an Admin can delete this task.');
    }

    // Delete related subTasks and invitations first due to foreign key constraints
    await prisma.subTask.deleteMany({ where: { taskId: id } });
    await prisma.taskInvitation.deleteMany({ where: { taskId: id } });

    await prisma.task.delete({ where: { id } });

    res.json({ message: 'Task and related items deleted successfully' });
});

export const inviteUserToTask = asyncHandler(async (req: Request, res: Response) => {
    const { id: taskId } = req.params;
    const { email: invitedUserEmail } = req.body;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || (task.creatorId !== req.user.id && req.user.role !== Role.ADMIN)) {
        res.status(403);
        throw new Error('Only the task creator or an Admin can send invitations.');
    }

    const invitedUser = await prisma.user.findUnique({ where: { email: invitedUserEmail } });
    if (!invitedUser) {
        res.status(404);
        throw new Error('User with that email not found.');
    }

    if (invitedUser.id === req.user.id) {
        res.status(400);
        throw new Error('Cannot invite yourself to a task.');
    }

    const alreadyAssigned = await prisma.task.count({
        where: { id: taskId, assignedUsers: { some: { id: invitedUser.id } } }
    });
    if (alreadyAssigned > 0) {
        res.status(400);
        throw new Error('User is already assigned to this task.');
    }

    // 4. Create or update the pending invitation
    const invitation = await prisma.taskInvitation.upsert({
        where: {
            taskId_invitedUserId: {
                taskId,
                invitedUserId: invitedUser.id,
            },
        },
        update: {
            status: InvitationStatus.PENDING,
        },
        create: {
            taskId,
            invitedUserId: invitedUser.id,
            invitedByUserId: req.user.id,
            status: InvitationStatus.PENDING,
        },
        include: { invitedByUser: { select: { name: true } } }
    });

    // 5. Send notification
    await createNotification(
        invitedUser.id,
        `${req.user.name} has invited you to join the task: "${task.title}".`,
        task.id,
        invitation.id,
        'TASK_INVITATION'
    );

    res.json({ message: 'Invitation sent successfully', invitation });
});

// PATCH /api/tasks/:id/invitations/:invitationId - Accept/Reject an invitation
export const respondToInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { invitationId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (action !== 'accept' && action !== 'reject') {
        res.status(400);
        throw new Error('Action must be "accept" or "reject"');
    }

    // 1. Find the invitation
    const invitation = await prisma.taskInvitation.findUnique({
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

    if (invitation.status !== InvitationStatus.PENDING) {
        res.status(400);
        throw new Error(`Invitation is already ${invitation.status.toLowerCase()}.`);
    }

    const newStatus = action === 'accept' ? InvitationStatus.ACCEPTED : InvitationStatus.REJECTED;

    const updatedInvitation = await prisma.taskInvitation.update({
        where: { id: invitationId },
        data: { status: newStatus },
    });

    // 3. If accepted, connect the user to the Task's assignedUsers list
    if (action === 'accept') {
        await prisma.task.update({
            where: { id: invitation.taskId },
            data: { assignedUsers: { connect: { id: req.user.id } } },
        });

        await createNotification(
            invitation.task.creatorId,
            `${req.user.name} accepted your invitation to join the task: "${invitation.task.title}".`,
            invitation.taskId,
            undefined,
            'INVITATION_RESPONSE'
        );
    } else {
        await createNotification(
            invitation.task.creatorId,
            `${req.user.name} rejected your invitation to join the task: "${invitation.task.title}".`,
            invitation.taskId, // relatedTaskId
            undefined,
            'INVITATION_RESPONSE'
        );
    }

    res.json(updatedInvitation);
});