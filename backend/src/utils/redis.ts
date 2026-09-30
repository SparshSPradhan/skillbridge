


import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    })
  : null;

if (redis) {
  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('ready', () => logger.info('Redis ready'));
  redis.on('error', (err) =>
    logger.warn('Redis error (non-fatal):', err.message)
  );
  redis.on('close', () => logger.warn('Redis connection closed'));
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis || redis.status !== 'ready') return null;

    try {
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!redis || redis.status !== 'ready') return;

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Redis is optional; ignore cache failures.
    }
  },

  async del(key: string): Promise<void> {
    if (!redis || redis.status !== 'ready') return;

    try {
      await redis.del(key);
    } catch {
      // Redis is optional; ignore cache failures.
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redis || redis.status !== 'ready') return;

    try {
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Redis is optional; ignore cache failures.
    }
  },
};