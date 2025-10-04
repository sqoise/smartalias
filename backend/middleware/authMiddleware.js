/**
 * Authentication Middleware
 * Handles JWT token verification and user authorization
 */

const jwt = require('jsonwebtoken')
const config = require('../config/config')
const logger = require('../config/logger')
const { USER_ROLES } = require('../config/constants')

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    })
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt', { ip: req.ip, token: token.substring(0, 10) + '...' })
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      })
    }

    req.user = user
    next()
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

module.exports = {
  authenticateToken,
  requireAdmin,
  requireResident,
  optionalAuth,
}
