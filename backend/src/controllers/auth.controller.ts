import { Response, NextFunction } from 'express';
// import { createClerkClient } from '@clerk/backend';
import { verifyToken } from '@clerk/backend';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { cache } from '../utils/redis';

// const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const RegisterSchema = z.object({
//   clerkUserId: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['STUDENT', 'TRAINER', 'INSTITUTION', 'PROGRAMME_MANAGER', 'MONITORING_OFFICER']),
  institutionId: z.string().optional().nullable(),
});

export async function register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // The frontend sends the Clerk token; we verify it here
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    // const payload = await clerk.verifyToken(token);
    const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
    const clerkUserId = payload.sub;

    const body = RegisterSchema.parse(req.body);

    // Ensure token matches claimed clerkUserId
    // if (clerkUserId !== body.clerkUserId) {
    //   return res.status(403).json({ error: 'Token/user mismatch' });
    // }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { clerkUserId },
      update: { name: body.name, email: body.email },
      create: {
        clerkUserId,
        name: body.name,
        email: body.email,
        role: body.role,
        institutionId: body.institutionId ?? null,
      },
    });

    // Invalidate cache
    await cache.del(`user:${clerkUserId}`);

    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  return res.json({ user: req.user });
}