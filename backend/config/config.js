/**
 * Application Configuration
 * Central place for all environment variables and app settings
 */

require('dotenv').config()
const path = require('path')

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
  JWT_SECRET: process.env.JWT_SECRET || 'smartlias-development-secret-key-2025',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '12h',
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 10, // 10 attempts for 6-digit PIN
  LOCKOUT_TIME: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
  
  // Database Configuration
  // Local PostgreSQL (Development - Docker)
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT) || 5432,
  POSTGRES_DB: process.env.POSTGRES_DB || 'smartliasdb',
  POSTGRES_USER: process.env.POSTGRES_USER || 'smartlias_user',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'smartlias_password',

  // Local or Supabase
  DATABASE_URL: process.env.DATABASE_URL || null,
  
  // Data Source Configuration (removed mock data)
  // Always use PostgreSQL database
  USE_MOCK_DATA: false,
  
  // AI Configuration (Google Gemini)
  GEMINI_ENABLED: process.env.GEMINI_ENABLED === 'true' || false,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
  
  // SMS Configuration - IProg SMS API
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'iprog', // 'iprog', 'twilio'
  
  // IProg SMS Configuration (Primary Philippine SMS Provider)
  IPROG_API_TOKEN: process.env.IPROG_API_TOKEN,
  IPROG_SMS_PROVIDER: parseInt(process.env.IPROG_SMS_PROVIDER) || 0, // 0 or 1

  // File Upload / Local Storage (no object storage yet)
  // Directory can be absolute or relative to project root (backend/..)
  UPLOADS_DIR: process.env.UPLOADS_DIR || 'uploads',
  // Public base URL where files are served (used when constructing absolute URLs)
  UPLOADS_PUBLIC_URL: process.env.UPLOADS_PUBLIC_URL || 'http://localhost:9000/uploads',
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

module.exports = config
