import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { AuthenticatedRequest } from '../types';

const AssignSchema = z.object({
  userId: z.string().min(1),
  institutionId: z.string().min(1),
});

export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { role } = req.query as { role?: string };

    let where: Record<string, unknown> = {};

    if (user.role === 'INSTITUTION') {
      where = { institutionId: user.id };
    } else if (user.role === 'PROGRAMME_MANAGER' || user.role === 'MONITORING_OFFICER') {
      if (role) where = { role };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, institutionId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function assignToInstitution(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, institutionId } = AssignSchema.parse(req.body);
    const caller = req.user!;

    // Institution can only assign to themselves
    if (caller.role === 'INSTITUTION' && institutionId !== caller.id) {
      return res.status(403).json({ error: 'You can only assign users to your own institution' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { institutionId },
      select: { id: true, name: true, role: true, institutionId: true },
    });

    await cache.del(`user:${updated.id}`);
    return res.json({ user: updated });
  } catch (error) {
    next(error);
  }
}