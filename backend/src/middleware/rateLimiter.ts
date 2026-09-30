

import rateLimit from 'express-rate-limit';

// General API rate limiter
// Uses in-memory storage so Redis failure cannot affect the API.
export const rateLimiter = rateLimit({
  windowMs: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || '900000',
    10
  ),
  max: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    10
  ),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
  },
});

// Strict rate limiter for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many auth attempts, please wait 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mark attendance rate limiter
export const attendanceRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Too many attendance submissions, slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});