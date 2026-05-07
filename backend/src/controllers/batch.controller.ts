import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { AuthenticatedRequest } from '../types';

const CreateBatchSchema = z.object({
  name: z.string().min(1).max(100),
});

const JoinBatchSchema = z.object({
  token: z.string().min(1),
});

export async function createBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name } = CreateBatchSchema.parse(req.body);
    const user = req.user!;

    const batch = await prisma.batch.create({
      data: {
        name,
        institutionId: user.institutionId ?? user.id,
        createdById: user.id,
        ...(user.role === 'TRAINER'
          ? { trainers: { create: { trainerId: user.id } } }
          : {}),
      },
      include: { trainers: true },
    });

    await cache.delPattern(`batches:*`);
    return res.status(201).json({ batch });
  } catch (error) {
    next(error);
  }
}

export async function listBatches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const cacheKey = `batches:${user.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    let batches;

    if (user.role === 'STUDENT') {
      batches = await prisma.batch.findMany({
        where: { students: { some: { studentId: user.id } } },
        include: { trainers: { include: { trainer: { select: { name: true, email: true } } } } },
      });
    } else if (user.role === 'TRAINER') {
      batches = await prisma.batch.findMany({
        where: { trainers: { some: { trainerId: user.id } } },
        include: {
          students: { select: { studentId: true } },
          sessions: { select: { id: true } },
        },
      });
    } else if (user.role === 'INSTITUTION') {
      batches = await prisma.batch.findMany({
        where: { institutionId: user.id },
        include: {
          trainers: { include: { trainer: { select: { name: true, email: true } } } },
          students: { select: { studentId: true } },
        },
      });
    } else {
      // PM, MO - all batches
      batches = await prisma.batch.findMany({
        include: {
          trainers: { include: { trainer: { select: { name: true } } } },
          students: { select: { studentId: true } },
        },
      });
    }

    const result = { batches };
    await cache.set(cacheKey, result, 60);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        trainers: { include: { trainer: { select: { id: true, name: true, email: true } } } },
        students: { include: { student: { select: { id: true, name: true, email: true } } } },
        sessions: { orderBy: { date: 'desc' }, take: 10 },
      },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    return res.json({ batch });
  } catch (error) {
    next(error);
  }
}

export async function generateInvite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    const batchId = req.params.id;

    // Verify trainer belongs to this batch (or is institution)
    if (user.role === 'TRAINER') {
      const membership = await prisma.batchTrainer.findUnique({
        where: { batchId_trainerId: { batchId, trainerId: user.id } },
      });
      if (!membership) {
        return res.status(403).json({ error: 'You are not a trainer in this batch' });
      }
    }

    const invite = await prisma.inviteLink.create({
      data: {
        batchId,
        createdBy: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        maxUsage: 200,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/join/${invite.token}`;
    return res.status(201).json({ invite, inviteUrl });
  } catch (error) {
    next(error);
  }
}

export async function joinBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { token } = JoinBatchSchema.parse(req.body);
    const user = req.user!;

    const invite = await prisma.inviteLink.findUnique({ where: { token } });

    if (!invite) return res.status(404).json({ error: 'Invalid invite link' });
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invite link has expired' });
    }
    if (invite.maxUsage && invite.usageCount >= invite.maxUsage) {
      return res.status(400).json({ error: 'Invite link has reached maximum usage' });
    }

    // Check if already in batch
    const existing = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId: invite.batchId, studentId: user.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already enrolled in this batch' });

    await prisma.$transaction([
      prisma.batchStudent.create({
        data: { batchId: invite.batchId, studentId: user.id },
      }),
      prisma.inviteLink.update({
        where: { id: invite.id },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    await cache.delPattern(`batches:*`);
    return res.status(201).json({ message: 'Successfully joined batch', batchId: invite.batchId });
  } catch (error) {
    next(error);
  }
}

export async function getBatchSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const batchId = req.params.id;
    const cacheKey = `batch:summary:${batchId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        students: { include: { student: { select: { id: true, name: true, email: true } } } },
        sessions: {
          include: {
            attendance: true,
          },
        },
      },
    });

    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const totalSessions = batch.sessions.length;
    const studentSummaries = batch.students.map(({ student }) => {
      const attended = batch.sessions.reduce((count, session) => {
        const record = session.attendance.find((a) => a.studentId === student.id);
        return count + (record?.status === 'PRESENT' || record?.status === 'LATE' ? 1 : 0);
      }, 0);
      return {
        student: { id: student.id, name: student.name, email: student.email },
        attended,
        total: totalSessions,
        percentage: totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0,
      };
    });

    const result = {
      batchId,
      batchName: batch.name,
      totalSessions,
      totalStudents: batch.students.length,
      studentSummaries,
    };

    await cache.set(cacheKey, result, 120);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}