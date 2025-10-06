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
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 10, // 10 attempts for 6-digit PIN
  LOCKOUT_TIME: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
  
  // Database Configuration
  // Local PostgreSQL (Development - Docker)
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT) || 5432,
  POSTGRES_DB: process.env.POSTGRES_DB || 'smartliasdb',
  POSTGRES_USER: process.env.POSTGRES_USER || 'smartlias_user',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'smartlias_password',
  DATABASE_URL: process.env.DATABASE_URL || null,
  
  // Supabase Configuration (Production)
  SUPABASE_URL: process.env.SUPABASE_URL || null,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || null,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
  
  // Data Source Configuration (removed mock data)
  // Always use PostgreSQL database
  USE_MOCK_DATA: false,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
  
  // SMS Configuration (Semaphore - Philippine SMS Provider)
  SEMAPHORE_API_KEY: process.env.SEMAPHORE_API_KEY || 'your-semaphore-api-key-here',
  SEMAPHORE_SENDER_NAME: process.env.SEMAPHORE_SENDER_NAME || 'BARANGAY',
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

module.exports = config
