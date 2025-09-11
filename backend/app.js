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

// Import centralized router
const apiRouter = require('./router')

const app = express()

// ==========================================================================
// SECURITY MIDDLEWARE
// ==========================================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API server
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

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

// Morgan HTTP request logger
app.use(morgan('combined', { 
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

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SMARTLIAS Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV
  })
})

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
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  })
})

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error)
  
  res.status(error.status || 500).json({
    success: false,
    error: config.isDevelopment ? error.message : 'Internal server error',
    ...(config.isDevelopment && { stack: error.stack })
  })
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
