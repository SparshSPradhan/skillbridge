import { Router } from 'express';
import authRoutes from './auth.routes';
import batchRoutes from './batch.routes';
import sessionRoutes from './session.routes';
import attendanceRoutes from './attendance.routes';
import summaryRoutes from './summary.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/', (_req, res) => {
    res.json({
      message: 'API working',
    });
  });
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/batches', batchRoutes);
router.use('/sessions', sessionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/', summaryRoutes);

export default router;