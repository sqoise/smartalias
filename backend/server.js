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
  try {
    // Initialize database connection (required)
    await database.connect()
    
    // Start the server
    const server = app.listen(config.PORT, () => {
      logger.info(`SMARTLIAS API Server started`)
      logger.info(`Environment: ${config.NODE_ENV}`)
      logger.info(`Port: ${config.PORT}`)
      logger.info(`Frontend URL: ${config.FRONTEND_URL}`)
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`)
      
      server.close(async () => {
        logger.info('HTTP server closed')
        
        try {
          await database.disconnect()
          logger.info('Database disconnected')
          process.exit(0)
        } catch (error) {
          logger.error('Error during shutdown', error)
          process.exit(1)
        }
      })
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
