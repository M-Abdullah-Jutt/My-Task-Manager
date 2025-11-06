"use strict";
// src/controllers/admin.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasksByUser = exports.getAllUsers = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// 1. Get List of All Users
exports.getAllUsers = (0, express_async_handler_1.default)(async (req, res) => {
    // Admins need to see all users, including basic info (excluding password)
    const users = await prisma_1.default.user.findMany({
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
exports.getTasksByUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId } = req.params;
    // Fetch all tasks where the user is the creator OR is in the assignedUsers list
    const tasks = await prisma_1.default.task.findMany({
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
