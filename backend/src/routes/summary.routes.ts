import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as summaryController from '../controllers/summary.controller';

const router = Router();

// GET /api/institutions/:id/summary - PM sees all batches in an institution
router.get(
  '/institutions/:id/summary',
  requireAuth,
  requireRole('PROGRAMME_MANAGER', 'MONITORING_OFFICER', 'INSTITUTION'),
  summaryController.getInstitutionSummary
);

// GET /api/programme/summary - PM and MO see programme-wide summary
router.get(
  '/programme/summary',
  requireAuth,
  requireRole('PROGRAMME_MANAGER', 'MONITORING_OFFICER'),
  summaryController.getProgrammeSummary
);

export default router;