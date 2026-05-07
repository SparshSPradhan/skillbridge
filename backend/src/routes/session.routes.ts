import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as sessionController from '../controllers/session.controller';

const router = Router();

// POST /api/sessions - Create session (Trainer only)
router.post('/', requireAuth, requireRole('TRAINER'), sessionController.createSession);

// GET /api/sessions - List sessions for the calling user
router.get('/', requireAuth, sessionController.listSessions);

// GET /api/sessions/:id - Single session details
router.get('/:id', requireAuth, sessionController.getSession);

// GET /api/sessions/:id/attendance - Full attendance for a session (Trainer+)
router.get(
  '/:id/attendance',
  requireAuth,
  requireRole('TRAINER', 'INSTITUTION', 'PROGRAMME_MANAGER', 'MONITORING_OFFICER'),
  sessionController.getSessionAttendance
);

export default router;