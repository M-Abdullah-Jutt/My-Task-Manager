"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_utils_1 = require("../utils/auth.utils");
const client_1 = require("@prisma/client");
exports.registerUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please enter all fields');
    }
    const userExists = await prisma_1.default.user.findUnique({ where: { email } });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    const hashedPassword = await (0, auth_utils_1.hashPassword)(password);
    const userCount = await prisma_1.default.user.count();
    const role = userCount === 0 ? client_1.Role.ADMIN : client_1.Role.USER;
    const user = await prisma_1.default.user.create({
        data: { name, email, password: hashedPassword, role },
        select: { id: true, name: true, email: true, role: true }
    });
    const { accessToken, refreshToken } = (0, auth_utils_1.generateTokens)(user.id, user.email, user.role, user.name);
    res.status(201).json({ user, accessToken, refreshToken });
});
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (user && (await (0, auth_utils_1.comparePassword)(password, user.password))) {
        const { accessToken, refreshToken } = (0, auth_utils_1.generateTokens)(user.id, user.email, user.role, user.name);
        res.status(200).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            accessToken,
            refreshToken,
        });
    }
    else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});
