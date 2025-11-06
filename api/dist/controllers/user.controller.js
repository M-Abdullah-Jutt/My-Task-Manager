"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.getMyProfile = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.getMyProfile = (0, express_async_handler_1.default)(async (req, res) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json(user);
});
exports.getAllUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const users = await prisma_1.default.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json(users);
});
