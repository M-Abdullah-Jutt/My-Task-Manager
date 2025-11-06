import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import taskRoutes from './routes/task.routes';
import subTaskRoutes from './routes/subtask.routes'; // New
import notificationRoutes from './routes/notification.routes'; // New

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration (Enable CORS for frontend origin)
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(',').map(s => s.trim());
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins?.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subTaskRoutes); // Register new route
app.use('/api/notifications', notificationRoutes); // Register new route

// Simple Error Handler (for async-handler errors)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode || 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});