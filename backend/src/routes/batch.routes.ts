import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as batchController from '../controllers/batch.controller';

const router = Router();

// POST /api/batches - Create a batch (Trainer or Institution)
router.post('/', requireAuth, requireRole('TRAINER', 'INSTITUTION'), batchController.createBatch);

// GET /api/batches - List batches for the calling user
router.get('/', requireAuth, batchController.listBatches);

// GET /api/batches/:id - Get single batch
router.get('/:id', requireAuth, batchController.getBatch);

// POST /api/batches/:id/invite - Generate invite link (Trainer)
router.post('/:id/invite', requireAuth, requireRole('TRAINER', 'INSTITUTION'), batchController.generateInvite);

// POST /api/batches/:id/join - Join via invite link (Student)
router.post('/:id/join', requireAuth, requireRole('STUDENT'), batchController.joinBatch);

// GET /api/batches/:id/summary - Attendance summary (Institution+)
router.get(
  '/:id/summary',
  requireAuth,
  requireRole('INSTITUTION', 'PROGRAMME_MANAGER', 'MONITORING_OFFICER'),
  batchController.getBatchSummary
);

export default router;