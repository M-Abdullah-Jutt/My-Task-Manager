// src/controllers/notification.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../utils/prisma';

export const createNotification = async (
    userId: string,
    message: string,
    relatedTaskId?: string,
    relatedInvitationId?: string, // <--- NEW FIELD
    type?: 'TASK_INVITATION' | 'INVITATION_RESPONSE' | 'OTHER'
) => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                message,
                isRead: false,
                relatedTaskId,
                relatedInvitationId,
                type: type || 'OTHER',
            },
        });
    } catch (error) {
    }
};


// GET /api/notifications - Get all notifications for the authenticated user
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20, // Limit to the latest 20 notifications
    });

    res.json(notifications);
});

// PATCH /api/notifications/:id/read - Mark a specific notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const notification = await prisma.notification.update({
        where: { id, userId: req.user.id },
        data: { isRead: true },
    });

    res.json(notification);
});

// GET /api/notifications/unread-count - Get the count of unread notifications
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
    });

    res.json({ count });
});