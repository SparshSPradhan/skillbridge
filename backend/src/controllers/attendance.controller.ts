import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { AuthenticatedRequest } from '../types';

const MarkAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  status: z.enum(['PRESENT', 'LATE']),
});

export async function markAttendance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    const { sessionId, status } = MarkAttendanceSchema.parse(req.body);

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { batch: true },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Verify student is enrolled in the batch
    const enrollment = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId: session.batchId, studentId: user.id } },
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this batch' });
    }

    // Check session date is today or recent (within 24h)
    const sessionDate = new Date(session.date);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - sessionDate.getTime()) / 36e5;
    if (diffHours > 24) {
      return res.status(400).json({ error: 'Attendance can only be marked within 24 hours of the session' });
    }

    // Upsert attendance
    const attendance = await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId: user.id } },
      update: { status, markedAt: new Date() },
      create: { sessionId, studentId: user.id, status },
    });

    await cache.delPattern(`sessions:${user.id}`);
    return res.status(201).json({ attendance });
  } catch (error) {
    next(error);
  }
}

export async function getMyAttendance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;

    const records = await prisma.attendance.findMany({
      where: { studentId: user.id },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            date: true,
            startTime: true,
            endTime: true,
            batch: { select: { name: true } },
          },
        },
      },
      orderBy: { markedAt: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;

    return res.json({
      records,
      summary: {
        total,
        present,
        absent: total - present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}