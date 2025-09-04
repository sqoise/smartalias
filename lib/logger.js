import fs from 'fs'
import path from 'path'

// Log levels
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
}

// Log categories for better organization
export const LOG_CATEGORIES = {
  AUTH: 'AUTH',
  USER: 'USER',
  ADMIN: 'ADMIN',
  API: 'API',
  SECURITY: 'SECURITY',
  PASSWORD: 'PASSWORD',
  SYSTEM: 'SYSTEM'
}

class Logger {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs')
    this.ensureLogsDirectory()
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true })
    }
  }

  formatLogEntry(level, category, message, metadata = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      ...metadata
    }
    
    return JSON.stringify(logEntry)
  }

  writeToFile(logEntry, filename = 'application.log') {
    const logPath = path.join(this.logsDir, filename)
    const logLine = logEntry + '\n'
    
    try {
      fs.appendFileSync(logPath, logLine)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  log(level, category, message, metadata = {}) {
    const logEntry = this.formatLogEntry(level, category, message, metadata)
    
    // Write to file
    this.writeToFile(logEntry)
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const consoleMessage = `[${level}] [${category}] ${message}`
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(consoleMessage, metadata)
          break
        case LOG_LEVELS.WARN:
          console.warn(consoleMessage, metadata)
          break
        case LOG_LEVELS.INFO:
          console.info(consoleMessage, metadata)
          break
        case LOG_LEVELS.DEBUG:
          console.debug(consoleMessage, metadata)
          break
        default:
          console.log(consoleMessage, metadata)
      }
    }
  }

  // Convenience methods
  error(category, message, metadata = {}) {
    this.log(LOG_LEVELS.ERROR, category, message, metadata)
  }

  warn(category, message, metadata = {}) {
    this.log(LOG_LEVELS.WARN, category, message, metadata)
  }

  info(category, message, metadata = {}) {
    this.log(LOG_LEVELS.INFO, category, message, metadata)
  }

  debug(category, message, metadata = {}) {
    this.log(LOG_LEVELS.DEBUG, category, message, metadata)
  }

  // Specific logging methods for common scenarios
  authAttempt(username, success, details = {}) {
    this.info(LOG_CATEGORIES.AUTH, 
      `Authentication attempt for ${username}: ${success ? 'SUCCESS' : 'FAILED'}`, 
      { username, success, ...details }
    )
  }

  passwordChange(username, success, details = {}) {
    this.info(LOG_CATEGORIES.PASSWORD, 
      `Password change for ${username}: ${success ? 'SUCCESS' : 'FAILED'}`, 
      { username, success, ...details }
    )
  }

  adminAction(adminUsername, action, targetUser, details = {}) {
    this.info(LOG_CATEGORIES.ADMIN, 
      `Admin ${adminUsername} performed ${action} on ${targetUser}`, 
      { adminUsername, action, targetUser, ...details }
    )
  }

  securityEvent(event, details = {}) {
    this.warn(LOG_CATEGORIES.SECURITY, 
      `Security event: ${event}`, 
      { event, ...details }
    )
  }

  apiRequest(method, path, username, statusCode, details = {}) {
    this.info(LOG_CATEGORIES.API, 
      `${method} ${path} - ${statusCode} - User: ${username || 'anonymous'}`, 
      { method, path, username, statusCode, ...details }
    )
  }

  systemEvent(event, details = {}) {
    this.info(LOG_CATEGORIES.SYSTEM, 
      `System event: ${event}`, 
      { event, ...details }
    )
  }
}

// Create singleton instance
const logger = new Logger()

export default logger
