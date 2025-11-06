// src/routes/admin.routes.ts

import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { adminProtect } from '../middleware/admin.middleware';
import { getAllUsers, getTasksByUser } from '../controllers/admin.controller';

const router = express.Router();

// Apply general protect middleware first, then adminProtect
router.use(protect, adminProtect);

// Route 1: Get all users
router.get('/users', getAllUsers);

// Route 2: Get all tasks (and subtasks) for a specific user ID
router.get('/users/:userId/tasks', getTasksByUser);

export default router;