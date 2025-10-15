/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const fs = require('fs')
const path = require('path')

const config = require('./config/config')
const logger = require('./config/logger')
const { generalLimiter } = require('./config/rateLimit')
const DateTime = require('./utils/datetime')
const ApiResponse = require('./utils/apiResponse')

// Import centralized router
const apiRouter = require('./router')

const app = express()

// ==========================================================================
// SECURITY MIDDLEWARE
// ==========================================================================

// Helmet for security headers with proper configuration for static files
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API server
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resources
}))

// ===== CORS CONFIGURATION (Simplified: Bearer tokens, no cookies) =====
// Removed dynamic PREVIEW_ORIGIN_PATTERN matching. Only explicit ALLOWED_ORIGINS are honored.
// Optional preview origin regex example (Netlify style preview subdomains):
// To re-enable dynamic preview origins, add the pattern to your environment and
// restore the matching logic. Keep this commented unless you intentionally need it.
// PREVIEW_ORIGIN_PATTERN=^https:\/\/[a-z0-9-]+--yourapp-preview\\.netlify\\.app$
const allowedOrigins = config.ALLOWED_ORIGINS

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true) // curl / mobile / same-origin
    if (allowedOrigins.includes(origin)) return callback(null, true)
    logger.warn('CORS blocked origin', { origin, allowedOrigins })
    return callback(new Error('CORS_NOT_ALLOWED'))
  },
  credentials: false, // We use Authorization header, no cookies -> simpler
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept']
}))

logger.info('CORS configuration loaded', { allowedOrigins, credentials: false })

// ==========================================================================
// GENERAL MIDDLEWARE
// ==========================================================================

// Parse JSON requests
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// HTTP Request logging with Morgan
// Create access log stream
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'), 
  { flags: 'a' }
)

// Custom Morgan token for Manila timezone with 24-hour format
morgan.token('manila-date', () => DateTime.now())

// Morgan HTTP request logger with Manila timezone
app.use(morgan(':remote-addr - :remote-user [:manila-date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', { 
  stream: accessLogStream,
  skip: (req, res) => res.statusCode < 400 // Only log errors in file
}))

// Morgan console logger (development)
if (config.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// Apply general rate limiting
app.use('/api', generalLimiter)

// ==========================================================================
// HEALTH CHECK ENDPOINT
// ==========================================================================

app.get('/api/health', (req, res) => {
  try {
    // Check if essential services are working
    const isHealthy = !!(config && logger && DateTime.now())
    
    return ApiResponse.health(res, isHealthy, {
      environment: config.NODE_ENV
    })
  } catch (error) {
    return ApiResponse.health(res, false, {
      environment: config.NODE_ENV,
      error: error.message
    })
  }
})

// ==========================================================================
// STATIC FILE SERVING
// ==========================================================================

// Serve static files from uploads directory (CORS handled globally above)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    res.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
  }
}))

// ==========================================================================
// API ROUTES
// ==========================================================================

// Mount centralized API router
app.use('/api', apiRouter)

// ==========================================================================
// ERROR HANDLING
// ==========================================================================

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`)
  return ApiResponse.error(res, 'Route not found', 404, {
    path: req.originalUrl,
    method: req.method
  })
})

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error)
  
  const errorDetails = config.isDevelopment ? {
    message: error.message,
    ...(error.stack && { stack: error.stack })
  } : null
  
  return ApiResponse.serverError(res, 
    config.isDevelopment ? error.message : 'Internal server error',
    errorDetails
  )
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise })
  process.exit(1)
})

module.exports = app
