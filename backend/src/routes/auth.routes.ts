import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register - Called after Clerk signup to sync user to our DB
router.post('/register', authRateLimiter, authController.register);

// GET /api/auth/me - Get current user profile
router.get('/me', requireAuth, authController.getMe);

export default router;