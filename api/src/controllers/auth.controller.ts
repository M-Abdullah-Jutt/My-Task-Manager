import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateTokens } from '../utils/auth.utils';
import { Role } from '@prisma/client';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please enter all fields');
    }

    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);

    const userCount = await prisma.user.count();
    const role: Role = userCount === 0 ? Role.ADMIN : Role.USER;

    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role },
        select: { id: true, name: true, email: true, role: true }
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role, user.name);

    res.status(201).json({ user, accessToken, refreshToken });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await comparePassword(password, user.password))) {
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role, user.name);
        res.status(200).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            accessToken,
            refreshToken,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});