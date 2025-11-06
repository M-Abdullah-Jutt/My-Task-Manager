"use strict";
// src/routes/admin.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = express_1.default.Router();
// Apply general protect middleware first, then adminProtect
router.use(auth_middleware_1.protect, admin_middleware_1.adminProtect);
// Route 1: Get all users
router.get('/users', admin_controller_1.getAllUsers);
// Route 2: Get all tasks (and subtasks) for a specific user ID
router.get('/users/:userId/tasks', admin_controller_1.getTasksByUser);
exports.default = router;
