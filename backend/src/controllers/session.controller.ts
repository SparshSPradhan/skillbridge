import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { AuthenticatedRequest } from '../types';

const CreateSessionSchema = z.object({
  batchId: z.string().min(1),
  title: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
});

export async function createSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    const body = CreateSessionSchema.parse(req.body);

    // Verify trainer is in this batch
    const membership = await prisma.batchTrainer.findUnique({
      where: { batchId_trainerId: { batchId: body.batchId, trainerId: user.id } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'You are not a trainer in this batch' });
    }

    const session = await prisma.session.create({
      data: {
        batchId: body.batchId,
        trainerId: user.id,
        title: body.title,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
      },
      include: {
        batch: { select: { name: true } },
        trainer: { select: { name: true } },
      },
    });

    await cache.delPattern(`sessions:*`);
    return res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
}

export async function listSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    const cacheKey = `sessions:${user.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    let sessions;

    if (user.role === 'STUDENT') {
      // Sessions in batches the student is enrolled in
      sessions = await prisma.session.findMany({
        where: {
          batch: { students: { some: { studentId: user.id } } },
        },
        include: {
          batch: { select: { name: true } },
          trainer: { select: { name: true } },
          attendance: {
            where: { studentId: user.id },
            select: { status: true, markedAt: true },
          },
        },
        orderBy: { date: 'desc' },
      });
    } else if (user.role === 'TRAINER') {
      sessions = await prisma.session.findMany({
        where: { trainerId: user.id },
        include: {
          batch: { select: { name: true } },
          _count: { select: { attendance: true } },
        },
        orderBy: { date: 'desc' },
      });
    } else {
      sessions = await prisma.session.findMany({
        include: {
          batch: { select: { name: true } },
          trainer: { select: { name: true } },
          _count: { select: { attendance: true } },
        },
        orderBy: { date: 'desc' },
        take: 100,
      });
    }

    const result = { sessions };
    await cache.set(cacheKey, result, 60);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        batch: { select: { name: true, id: true } },
        trainer: { select: { name: true, email: true } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json({ session });
  } catch (error) {
    next(error);
  }
}

export async function getSessionAttendance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionId = req.params.id;
    const user = req.user!;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          include: {
            students: { include: { student: { select: { id: true, name: true, email: true } } } },
          },
        },
        attendance: {
          include: { student: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Trainer must own this session
    if (user.role === 'TRAINER' && session.trainerId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build full attendance list including absent students
    const attendanceMap = new Map(session.attendance.map((a) => [a.studentId, a]));
    const fullAttendance = session.batch.students.map(({ student }) => ({
      student,
      status: attendanceMap.get(student.id)?.status ?? 'ABSENT',
      markedAt: attendanceMap.get(student.id)?.markedAt ?? null,
    }));

    return res.json({
      session: {
        id: session.id,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        batchName: session.batch.name,
      },
      attendance: fullAttendance,
      summary: {
        total: fullAttendance.length,
        present: fullAttendance.filter((a) => a.status === 'PRESENT').length,
        late: fullAttendance.filter((a) => a.status === 'LATE').length,
        absent: fullAttendance.filter((a) => a.status === 'ABSENT').length,
      },
    });
  } catch (error) {
    next(error);
  }
}