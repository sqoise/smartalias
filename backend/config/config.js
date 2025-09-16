/**
 * Application Configuration
 * Central place for all environment variables and app settings
 */

require('dotenv').config()

const config = {
  // Server Configuration
  PORT: process.env.PORT || 9000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // CORS Configuration - Multiple allowed origins
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ],
  
  // Authentication Configuration
  JWT_SECRET: process.env.JWT_SECRET || null,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCKOUT_TIME: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
  
  // Database Configuration (for future use)
  DATABASE_URL: process.env.DATABASE_URL || null,
  
  // Data Source Configuration
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true' || false,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

module.exports = config
