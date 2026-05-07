import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

// GET /api/users - List users (Institution sees their trainers, PM sees institutions)
router.get('/', requireAuth, requireRole('INSTITUTION', 'PROGRAMME_MANAGER', 'MONITORING_OFFICER'), userController.listUsers);

// POST /api/users/assign-institution - Assign trainer to institution
router.post(
  '/assign-institution',
  requireAuth,
  requireRole('INSTITUTION', 'PROGRAMME_MANAGER'),
  userController.assignToInstitution
);

export default router;