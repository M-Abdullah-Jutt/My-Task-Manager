"use strict";
// src/middleware/admin.middleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProtect = void 0;
const adminProtect = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({
            message: 'Forbidden: Only administrators can access this resource.'
        });
    }
};
exports.adminProtect = adminProtect;
