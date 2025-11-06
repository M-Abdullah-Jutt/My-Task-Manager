import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';

const router = Router();

// Public pages [cite: 13]
router.post('/signup', registerUser);
router.post('/login', loginUser);

export default router;