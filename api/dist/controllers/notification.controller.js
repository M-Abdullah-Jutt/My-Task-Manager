"use strict";
// src/controllers/notification.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.markAsRead = exports.getMyNotifications = exports.createNotification = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const createNotification = async (userId, message, relatedTaskId, relatedInvitationId, // <--- NEW FIELD
type) => {
    try {
        await prisma_1.default.notification.create({
            data: {
                userId,
                message,
                isRead: false,
                relatedTaskId,
                relatedInvitationId,
                type: type || 'OTHER',
            },
        });
    }
    catch (error) {
    }
};
exports.createNotification = createNotification;
// GET /api/notifications - Get all notifications for the authenticated user
exports.getMyNotifications = (0, express_async_handler_1.default)(async (req, res) => {
    const notifications = await prisma_1.default.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20, // Limit to the latest 20 notifications
    });
    res.json(notifications);
});
// PATCH /api/notifications/:id/read - Mark a specific notification as read
exports.markAsRead = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const notification = await prisma_1.default.notification.update({
        where: { id, userId: req.user.id },
        data: { isRead: true },
    });
    res.json(notification);
});
// GET /api/notifications/unread-count - Get the count of unread notifications
exports.getUnreadCount = (0, express_async_handler_1.default)(async (req, res) => {
    const count = await prisma_1.default.notification.count({
        where: { userId: req.user.id, isRead: false },
    });
    res.json({ count });
});
