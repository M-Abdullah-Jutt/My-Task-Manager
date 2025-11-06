// src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../utils/prisma';

// 1. Get List of All Users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    // Admins need to see all users, including basic info (excluding password)
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json(users);
});

// 2. Get Tasks for a Specific User
export const getTasksByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Fetch all tasks where the user is the creator OR is in the assignedUsers list
    const tasks = await prisma.task.findMany({
        where: {
            OR: [
                { creatorId: userId },
                { assignedUsers: { some: { id: userId } } }
            ]
        },
        include: {
            assignedUsers: { select: { id: true, name: true } },
            subTasks: true,
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
});