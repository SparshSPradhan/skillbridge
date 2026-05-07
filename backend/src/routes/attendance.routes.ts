import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { attendanceRateLimiter } from '../middleware/rateLimiter';
import * as attendanceController from '../controllers/attendance.controller';

const router = Router();

// POST /api/attendance/mark - Student marks own attendance
router.post(
  '/mark',
  requireAuth,
  requireRole('STUDENT'),
  attendanceRateLimiter,
  attendanceController.markAttendance
);

// GET /api/attendance/my - Student views their own attendance history
router.get('/my', requireAuth, requireRole('STUDENT'), attendanceController.getMyAttendance);

export default router;