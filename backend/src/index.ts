


import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { redis } from './utils/redis';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    // Database is required
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Redis is optional.
    // Do not let Redis prevent the API from starting.
    if (redis) {
      logger.info('ℹ️ Redis configured (optional)');
    } else {
      logger.info('ℹ️ REDIS_URL not configured, continuing without cache');
    }

    app.listen(PORT, () => {
      logger.info(
        `🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`
      );
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  await prisma.$disconnect();

  if (redis) {
    redis.disconnect();
  }

  process.exit(0);
});

bootstrap();