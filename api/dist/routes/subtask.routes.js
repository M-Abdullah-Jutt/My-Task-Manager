"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const subtask_controller_1 = require("../controllers/subtask.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect); // All sub-task routes are protected
// /subtasks/:id
router.patch('/:id', subtask_controller_1.updateSubTask);
exports.default = router;
