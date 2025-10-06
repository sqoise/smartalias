/**
 * Rate Limiting Configuration
 * Protects API endpoints from abuse
 */

const rateLimit = require('express-rate-limit')
const config = require('./config')

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.isDevelopment ? 2000 : 500, // 2000 in dev, 500 in production
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isDevelopment ? 1000 : 200, // 1000 in dev, 200 in production
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Very strict rate limiting for password changes
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.isDevelopment ? 200 : 50, // 200 in dev, 50 in production per hour
  message: {
    success: false,
    error: 'Too many password change attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  generalLimiter,
  authLimiter,
  passwordChangeLimiter,
}
