import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../utils/prisma';
import { createNotification } from './notification.controller';
import { TaskStatus } from '@prisma/client';

// POST /api/tasks/:taskId/subtasks - Create a new subtask
export const createSubTask = asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { title, description, assignedUserId, dueDate } = req.body;

    // 1. Check if the task exists and the current user is a creator or assigned user
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignedUsers: true },
    });

    const isCreatorOrAssigned = task && (
        task.creatorId === req.user.id ||
        task.assignedUsers.some(user => user.id === req.user.id)
    );

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

    const subTask = await prisma.subTask.create({
        data: {
            title,
            description,
            taskId,
            assignedUserId,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: TaskStatus.PENDING,
        },
        include: { task: { select: { title: true } } }
    });

    // 3. Notify the assigned user
    await createNotification(
        assignedUserId,
        `You were assigned a new sub-task: "${subTask.title}" under task "${subTask.task.title}".`
    );

    res.status(201).json(subTask);
});

// PATCH /api/subtasks/:id - Update subtask details or status
export const updateSubTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    // 1. Find subtask and ensure the user is the assigned user
    const subTask = await prisma.subTask.findUnique({ where: { id } });

    if (!subTask) {
        res.status(404);
        throw new Error('Sub-task not found');
    }

    // Allow the assigned user or the task creator to update status/details
    const task = await prisma.task.findUnique({ where: { id: subTask.taskId } });
    const isAuthorized = subTask.assignedUserId === req.user.id || task?.creatorId === req.user.id;

    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to update this sub-task.');
    }

    const updatedSubTask = await prisma.subTask.update({
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