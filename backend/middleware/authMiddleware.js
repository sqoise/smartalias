/**
 * Authentication Middleware
 * Handles JWT token verification and user authorization
 */

const jwt = require('jsonwebtoken')
const config = require('../config/config')
const logger = require('../config/logger')
const { USER_ROLES } = require('../config/constants')
const UserRepository = require('../repositories/UserRepository')

// Verify JWT token and ensure it's a valid authentication token (not change-pin token)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    })
  }

  jwt.verify(token, config.JWT_SECRET, async (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt', { ip: req.ip, token: token.substring(0, 10) + '...' })
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      })
    }

    // SECURITY: Check if this is a change-pin token (not allowed on protected routes)
    if (user.purpose === 'change-pin') {
      logger.warn('Change-pin token used on protected route', { 
        username: user.username,
        ip: req.ip,
        path: req.path
      })
      return res.status(403).json({
        success: false,
        error: 'PIN change required. Please complete your PIN change first.'
      })
    }

    // SECURITY: Verify user still exists and has changed password
    try {
      const dbUser = await UserRepository.findByUsername(user.username)
      
      if (!dbUser) {
        logger.warn('Token for non-existent user', { username: user.username, ip: req.ip })
        return res.status(403).json({
          success: false,
          error: 'User not found'
        })
      }

      // Check if user needs to change password
      if (dbUser.is_password_changed === 0) {
        logger.warn('User with unchanged password attempting access', { 
          username: user.username,
          ip: req.ip 
        })
        return res.status(403).json({
          success: false,
          error: 'Password change required. Please change your PIN before accessing the system.'
        })
      }

      req.user = user
      next()
    } catch (error) {
      logger.error('Authentication middleware error', error)
      return res.status(500).json({
        success: false,
        error: 'Authentication failed'
      })
    }
  })
}

// Require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== USER_ROLES.ADMIN) {
    logger.warn('Unauthorized admin access attempt', { 
      user: req.user?.username || 'unknown',
      role: req.user?.role || 'none',
      ip: req.ip 
    })
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    })
  }
  next()
}

// Require resident role (or admin)
const requireResident = (req, res, next) => {
  if (!req.user || (req.user.role !== USER_ROLES.RESIDENT && req.user.role !== USER_ROLES.ADMIN)) {
    logger.warn('Unauthorized resident access attempt', { 
      user: req.user?.username || 'unknown',
      role: req.user?.role || 'none',
      ip: req.ip 
    })
    return res.status(403).json({
      success: false,
      error: 'Resident access required'
    })
  }
  next()
}

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user
      }
    })
  }
  next()
}

// Verify change-pin token (ONLY for password change endpoints)
const authenticateChangePinToken = (req, res, next) => {
  const { token } = req.body

  logger.info('authenticateChangePinToken middleware called', { hasToken: !!token })

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Change-pin token required'
    })
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid change-pin token', { ip: req.ip, error: err.message })
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please login again.'
        })
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }

    // SECURITY: Ensure this IS a change-pin token
    if (user.purpose !== 'change-pin') {
      logger.warn('Regular token used on change-pin endpoint', { 
        username: user.username,
        purpose: user.purpose,
        ip: req.ip 
      })
      return res.status(403).json({
        success: false,
        error: 'Invalid token type. Please use the correct change-pin link.'
      })
    }

    logger.info('Change-pin token validated successfully', { username: user.username })
    req.changePinUser = user
    next()
  })
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireResident,
  optionalAuth,
  authenticateChangePinToken,
}
