import { Response, NextFunction } from 'express';
// import { createClerkClient } from '@clerk/backend';
import { verifyToken } from '@clerk/backend';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';
import { cache } from '../utils/redis';

// const clerk = createClerkClient({
//   secretKey: process.env.CLERK_SECRET_KEY!,
// });

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Clerk
    // const payload = await clerk.verifyToken(token);
    const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
    const clerkUserId = payload.sub;

    // Try cache first
    const cacheKey = `user:${clerkUserId}`;
    let user = await cache.get<AuthenticatedRequest['user']>(cacheKey);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { clerkUserId },
        select: {
          id: true,
          clerkUserId: true,
          name: true,
          email: true,
          role: true,
          institutionId: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found. Please complete registration.' });
      }

      await cache.set(cacheKey, user, 300); // cache 5 minutes
    }

    req.user = user!;
    next();
  } catch (error) {
    logger.warn('Auth failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
}