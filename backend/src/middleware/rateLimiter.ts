import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  store: new RedisStore({
    // sendCommand: (...args: string[]) => redis.call(...args) as Promise<unknown>,
    sendCommand: (...args: string[]) =>
        redis.call(args[0], ...args.slice(1)) as Promise<any>,
  }),
  skip: () => {
    if (redis.status !== 'ready') {
      logger.warn('Redis not ready, skipping rate limit store');
      return true;
    }
    return false;
  },
});

// Strict rate limiter for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mark attendance rate limiter
export const attendanceRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5,
  message: { error: 'Too many attendance submissions, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});