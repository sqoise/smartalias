/**
 * SMARTLIAS Backend Server
 * Server startup and initialization
 */

// ==========================================================================
// TIMEZONE CONFIGURATION (MUST BE FIRST)
// ==========================================================================

// Set timezone to Manila/Philippines BEFORE any other imports
process.env.TZ = 'Asia/Manila'

const app = require('./app')
const config = require('./config/config')
const logger = require('./config/logger')
const database = require('./config/db')

// ==========================================================================
// SERVER STARTUP
// ==========================================================================

async function startServer() {
  let dbConnected = false

  // Connect to database
  try {
    await database.connect()
    dbConnected = true
  } catch (error) {
    logger.error('Database connection failed', { error: error.message })
  }
  
  // Start the server
  try {
    const server = app.listen(config.PORT, () => {
      logger.info('SMARTLIAS API Server started')
      logger.info(`Environment: ${config.NODE_ENV}`)
      logger.info(`Port: ${config.PORT}`)
      logger.info(`Frontend URL: ${config.FRONTEND_URL}`)
      logger.info(`Database connected: ${dbConnected}`)
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`)
      
      server.close(async () => {
        logger.info('HTTP server closed')
        
        if (dbConnected) {
          try {
            await database.disconnect()
            logger.info('Database disconnected')
          } catch (error) {
            logger.error('Error disconnecting database', error)
          }
        }
        
        process.exit(0)
      })
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    }

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

// Start the server
startServer()
