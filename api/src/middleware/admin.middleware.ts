// src/middleware/admin.middleware.ts

import { Request, Response, NextFunction } from 'express';

export const adminProtect = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({
            message: 'Forbidden: Only administrators can access this resource.'
        });
    }
};