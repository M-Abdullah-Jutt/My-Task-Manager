import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../utils/prisma';

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json(user);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json(users);
});