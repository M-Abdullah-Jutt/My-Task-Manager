"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const subtask_routes_1 = __importDefault(require("./routes/subtask.routes")); // New
const notification_routes_1 = __importDefault(require("./routes/notification.routes")); // New
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// CORS Configuration (Enable CORS for frontend origin)
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(',').map(s => s.trim());
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins?.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.json());
app.use(express_1.default.json());
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/subtasks', subtask_routes_1.default); // Register new route
app.use('/api/notifications', notification_routes_1.default); // Register new route
// Simple Error Handler (for async-handler errors)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode || 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
