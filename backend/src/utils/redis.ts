// import Redis from 'ioredis';
// import { logger } from './logger';

// const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// export const redis = new Redis(redisUrl, {
//   maxRetriesPerRequest: 3,
//   retryStrategy: (times) => {
//     if (times > 3) {
//       logger.warn('Redis connection failed after 3 retries, continuing without cache');
//       return null;
//     }
//     return Math.min(times * 200, 1000);
//   },
//   // lazyConnect: false,
//   lazyConnect: true,
// });

// redis.on('connect', () => logger.info('Redis connected'));
// redis.on('error', (err) => logger.warn('Redis error (non-fatal):', err.message));

// export const cache = {
//   async get<T>(key: string): Promise<T | null> {
//     try {
//       const val = await redis.get(key);
//       return val ? JSON.parse(val) : null;
//     } catch {
//       return null;
//     }
//   },

//   async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
//     try {
//       await redis.setex(key, ttlSeconds, JSON.stringify(value));
//     } catch {
//       // non-fatal
//     }
//   },

//   async del(key: string): Promise<void> {
//     try {
//       await redis.del(key);
//     } catch {
//       // non-fatal
//     }
//   },

//   async delPattern(pattern: string): Promise<void> {
//     try {
//       const keys = await redis.keys(pattern);
//       if (keys.length > 0) await redis.del(...keys);
//     } catch {
//       // non-fatal
//     }
//   },
// };

import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL;

export const redis = new Redis(redisUrl || 'redis://localhost:6379', {
  lazyConnect: true,

  // Don't keep commands queued while Redis is unavailable
  // enableOfflineQueue: false,

  // Don't retry individual commands indefinitely
  maxRetriesPerRequest: 1,

  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn(
        'Redis connection failed after 3 retries, continuing without cache'
      );
      return null;
    }

    return Math.min(times * 500, 2000);
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting');
});

redis.on('error', (err) => {
  logger.warn('Redis error (non-fatal):', err.message);
});

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redis.status !== 'ready') {
        return null;
      }

      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async set(
    key: string,
    value: unknown,
    ttlSeconds = 60
  ): Promise<void> {
    try {
      if (redis.status !== 'ready') {
        return;
      }

      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Redis is optional; ignore cache failures
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (redis.status !== 'ready') {
        return;
      }

      await redis.del(key);
    } catch {
      // Redis is optional; ignore cache failures
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      if (redis.status !== 'ready') {
        return;
      }

      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Redis is optional; ignore cache failures
    }
  },
};