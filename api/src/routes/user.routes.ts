import { Router } from 'express';
import { getMyProfile, getAllUsers } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.get('/profile', getMyProfile);

router.get('/', restrictTo(Role.ADMIN), getAllUsers);

export default router;