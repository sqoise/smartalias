/**
 * SMARTLIAS API Router
 * All API routes centralized in one file for simplicity
 */

const express = require('express')
const fs = require('fs').promises
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Import utilities and middleware
const config = require('./config/config')
const logger = require('./config/logger')
const Validator = require('./utils/validator')
const ApiResponse = require('./utils/apiResponse')
const { authenticateToken, requireAdmin, requireResident } = require('./middleware/authMiddleware')
const { authLimiter, passwordChangeLimiter, generalLimiter } = require('./config/rateLimit')

// Import shared messages
const { AUTH_MESSAGES, HTTP_STATUS_MESSAGES } = require('../shared/constants')

const router = express.Router()

// ==========================================================================
// DATA HELPERS
// ==========================================================================

// Load JSON data
async function loadJsonData(filename) {
  try {
    const filePath = path.join(__dirname, 'data', filename)
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    logger.error(`Failed to load ${filename}`, error)
    return []
  }
}

// Save JSON data
async function saveJsonData(filename, data) {
  try {
    const filePath = path.join(__dirname, 'data', filename)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    logger.error(`Failed to save ${filename}`, error)
    return false
  }
}

// ==========================================================================
// AUTHENTICATION ROUTES
// ==========================================================================

// POST /api/auth/login - User login
router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, pin } = req.body

    // Validate input
    if (!username || !pin) {
      return ApiResponse.error(res, 'Username and PIN are required', 400)
    }

    const usernameValidation = Validator.validateUsername(username)
    const pinValidation = Validator.validatePin(pin)

    if (!usernameValidation.isValid) {
      return ApiResponse.validationError(res, {
        username: usernameValidation.errors
      }, 'Invalid username format')
    }

    if (!pinValidation.isValid) {
      return ApiResponse.validationError(res, {
        pin: pinValidation.errors
      }, 'Invalid PIN format')
    }

    // Load users
    const users = await loadJsonData('users.json')
    const user = users.find(u => u.username === username)

    if (!user) {
      logger.warn('Login attempt with non-existent username', { username, ip: req.ip })
      return ApiResponse.unauthorized(res, 'Invalid username or PIN')
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      logger.warn('Login attempt on locked account', { username, ip: req.ip })
      return ApiResponse.error(res, 'Account temporarily locked. Please try again later.', 423)
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin.toString(), user.passwordHash)

    if (!isValidPin) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
      user.lastFailedLogin = new Date().toISOString()

      // Lock account if too many failed attempts
      if (user.failedLoginAttempts >= config.MAX_LOGIN_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + config.LOCKOUT_TIME).toISOString()
        logger.warn('Account locked due to failed attempts', { username, attempts: user.failedLoginAttempts })
      }

      await saveJsonData('users.json', users)

      logger.warn('Failed login attempt', { username, ip: req.ip, attempts: user.failedLoginAttempts })
      return ApiResponse.unauthorized(res, 'Invalid PIN. Please try again.')
    }

    // Successful login - reset failed attempts
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLogin = new Date().toISOString()
    await saveJsonData('users.json', users)

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    )

    logger.info('Successful login', { username, role: user.role })

    // Determine redirect URL
    const redirectTo = user.role === 'admin' ? '/admin' : '/resident'

    return ApiResponse.success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordChanged: user.passwordChanged !== false
      },
      redirectTo
    }, `Welcome ${user.firstName}!`)

  } catch (error) {
    logger.error('Login error', error)
    return ApiResponse.serverError(res, 'Login failed. Please try again.', error)
  }
})

// POST /api/auth/check-user - Check if username exists
router.post('/auth/check-user', authLimiter, async (req, res) => {
  try {
    const { username } = req.body

    if (!username) {
      return ApiResponse.error(res, 'Username is required', 400)
    }

    const usernameValidation = Validator.validateUsername(username)
    if (!usernameValidation.isValid) {
      return ApiResponse.validationError(res, {
        username: usernameValidation.errors
      }, 'Invalid username format')
    }

    const users = await loadJsonData('users.json')
    const user = users.find(u => u.username === username)

    if (!user) {
      return ApiResponse.notFound(res, 'User not found')
    }

    return ApiResponse.success(res, {
      user: {
        username: user.username,
        firstName: user.firstName,
        role: user.role
      }
    }, 'User found')

  } catch (error) {
    logger.error('Check user error', error)
    return ApiResponse.serverError(res, 'Failed to check user', error)
  }
})

// GET /api/auth/me - Get current user info
router.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    },
    message: 'User information retrieved'
  })
})

// POST /api/auth/logout - User logout
router.post('/auth/logout', authenticateToken, (req, res) => {
  logger.info('User logout', { username: req.user.username })
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

// POST /api/auth/change-password - Change user PIN
router.post('/auth/change-password', passwordChangeLimiter, authenticateToken, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body

    // Validate input
    const currentPinValidation = Validator.validatePin(currentPin)
    const newPinValidation = Validator.validatePin(newPin)

    if (!currentPinValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current PIN format',
        details: currentPinValidation.errors
      })
    }

    if (!newPinValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid new PIN format',
        details: newPinValidation.errors
      })
    }

    // Load users
    const users = await loadJsonData('users.json')
    const userIndex = users.findIndex(u => u.id === req.user.id)

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: AUTH_MESSAGES.USER_NOT_FOUND
      })
    }

    const user = users[userIndex]

    // Verify current PIN
    const isValidCurrentPin = await bcrypt.compare(currentPin.toString(), user.passwordHash)
    if (!isValidCurrentPin) {
      logger.warn('Invalid current PIN in change request', { username: req.user.username })
      return res.status(400).json({
        success: false,
        error: AUTH_MESSAGES.PIN_CURRENT_INCORRECT
      })
    }

    // Hash new PIN
    const newHashedPin = await bcrypt.hash(newPin.toString(), config.BCRYPT_ROUNDS)

    // Update user
    users[userIndex] = {
      ...user,
      passwordHash: newHashedPin,
      passwordChanged: true,
      updatedAt: new Date().toISOString()
    }

    await saveJsonData('users.json', users)

    logger.info('Password changed successfully', { username: req.user.username })

    res.json({
      success: true,
      message: 'PIN changed successfully'
    })

  } catch (error) {
    logger.error('Change password error', error)
    res.status(500).json({
      success: false,
      error: 'Failed to change PIN'
    })
  }
})

// ==========================================================================
// RESIDENTS ROUTES
// ==========================================================================

// GET /api/residents - Get all residents
router.get('/residents', generalLimiter, authenticateToken, async (req, res) => {
  try {
    const { page, limit, search } = req.query
    const residents = await loadJsonData('residents.json')

    let filteredResidents = residents

    // Search functionality
    if (search) {
      const searchTerm = Validator.sanitizeInput(search).toLowerCase()
      filteredResidents = residents.filter(resident =>
        resident.firstName.toLowerCase().includes(searchTerm) ||
        resident.lastName.toLowerCase().includes(searchTerm) ||
        (resident.middleName && resident.middleName.toLowerCase().includes(searchTerm)) ||
        (resident.email && resident.email.toLowerCase().includes(searchTerm)) ||
        (resident.contactNumber && resident.contactNumber.includes(search))
      )
    }

    // Pagination
    if (page || limit) {
      const pagination = Validator.validatePagination(page, limit)
      if (!pagination.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters',
          details: pagination.errors
        })
      }

      const offset = (pagination.page - 1) * pagination.limit
      const paginatedResidents = filteredResidents.slice(offset, offset + pagination.limit)

      return res.json({
        success: true,
        data: paginatedResidents,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: filteredResidents.length,
          totalPages: Math.ceil(filteredResidents.length / pagination.limit)
        },
        message: `Retrieved ${paginatedResidents.length} residents`
      })
    }

    res.json({
      success: true,
      data: filteredResidents,
      message: `Retrieved ${filteredResidents.length} residents`
    })

  } catch (error) {
    logger.error('Error getting residents', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve residents'
    })
  }
})

// GET /api/residents/:id - Get resident by ID
router.get('/residents/:id', generalLimiter, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid resident ID is required'
      })
    }

    const residents = await loadJsonData('residents.json')
    const resident = residents.find(r => r.id === parseInt(id))

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      })
    }

    res.json({
      success: true,
      data: resident,
      message: 'Resident retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting resident by ID', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resident'
    })
  }
})

// POST /api/residents - Create new resident (admin only)
router.post('/residents', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const residentData = req.body

    // Validate input
    const validation = Validator.validateResident(residentData)
    if (!validation.isValid) {
      Validator.logValidationError(req, validation, 'resident creation')
      return res.status(400).json({
        success: false,
        error: 'Invalid resident data',
        details: validation.errors
      })
    }

    // Sanitize input data
    const sanitizedData = {
      firstName: Validator.sanitizeInput(residentData.firstName),
      lastName: Validator.sanitizeInput(residentData.lastName),
      middleName: Validator.sanitizeInput(residentData.middleName || ''),
      birthDate: residentData.birthDate || null,
      civilStatus: Validator.sanitizeInput(residentData.civilStatus || ''),
      address: Validator.sanitizeInput(residentData.address || ''),
      contactNumber: Validator.sanitizeInput(residentData.contactNumber || ''),
      email: Validator.sanitizeInput(residentData.email || ''),
    }

    const residents = await loadJsonData('residents.json')

    // Generate new ID
    const newId = residents.length > 0 
      ? Math.max(...residents.map(r => r.id)) + 1 
      : 1

    const newResident = {
      id: newId,
      ...sanitizedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    residents.push(newResident)
    await saveJsonData('residents.json', residents)

    logger.info(`Resident created by ${req.user.username}`, { residentId: newId })

    res.status(201).json({
      success: true,
      data: newResident,
      message: 'Resident created successfully'
    })

  } catch (error) {
    logger.error('Error creating resident', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create resident'
    })
  }
})

// PUT /api/residents/:id - Update resident (admin only)
router.put('/residents/:id', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid resident ID is required'
      })
    }

    // Validate input
    const validation = Validator.validateResident(updateData)
    if (!validation.isValid) {
      Validator.logValidationError(req, validation, 'resident update')
      return res.status(400).json({
        success: false,
        error: 'Invalid resident data',
        details: validation.errors
      })
    }

    const residents = await loadJsonData('residents.json')
    const index = residents.findIndex(r => r.id === parseInt(id))

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      })
    }

    // Sanitize input data
    const sanitizedData = {
      firstName: Validator.sanitizeInput(updateData.firstName),
      lastName: Validator.sanitizeInput(updateData.lastName),
      middleName: Validator.sanitizeInput(updateData.middleName || ''),
      birthDate: updateData.birthDate || null,
      civilStatus: Validator.sanitizeInput(updateData.civilStatus || ''),
      address: Validator.sanitizeInput(updateData.address || ''),
      contactNumber: Validator.sanitizeInput(updateData.contactNumber || ''),
      email: Validator.sanitizeInput(updateData.email || ''),
    }

    residents[index] = {
      ...residents[index],
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    }

    await saveJsonData('residents.json', residents)

    logger.info(`Resident updated by ${req.user.username}`, { residentId: id })

    res.json({
      success: true,
      data: residents[index],
      message: 'Resident updated successfully'
    })

  } catch (error) {
    logger.error('Error updating resident', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update resident'
    })
  }
})

// DELETE /api/residents/:id - Delete resident (admin only)
router.delete('/residents/:id', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid resident ID is required'
      })
    }

    const residents = await loadJsonData('residents.json')
    const index = residents.findIndex(r => r.id === parseInt(id))

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      })
    }

    const deletedResident = residents[index]
    residents.splice(index, 1)

    await saveJsonData('residents.json', residents)

    logger.info(`Resident deleted by ${req.user.username}`, { residentId: id })

    res.json({
      success: true,
      message: 'Resident deleted successfully'
    })

  } catch (error) {
    logger.error('Error deleting resident', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete resident'
    })
  }
})

// GET /api/residents/stats - Get resident statistics (admin only)
router.get('/residents/stats', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const residents = await loadJsonData('residents.json')
    
    const stats = {
      total: residents.length,
      recentCount: residents.filter(r => {
        const created = new Date(r.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return created > thirtyDaysAgo
      }).length
    }

    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting resident stats', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    })
  }
})

// ==========================================================================
// ADMIN ENDPOINTS (Logs Management)
// ==========================================================================

// GET /api/admin/logs - Get list of log files (admin only)
router.get('/admin/logs', generalLimiter, authenticateToken, requireAdmin, (req, res) => {
  try {
    const logFiles = logger.getLogFiles()
    
    res.json({
      success: true,
      data: logFiles,
      message: 'Log files retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting log files', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve log files'
    })
  }
})

// GET /api/admin/logs/:filename - Get log file content (admin only)
router.get('/admin/logs/:filename', generalLimiter, authenticateToken, requireAdmin, (req, res) => {
  try {
    const { filename } = req.params
    const { lines = 100 } = req.query
    
    // Validate filename to prevent path traversal
    if (!filename.endsWith('.log') || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid log filename'
      })
    }
    
    const logLines = logger.readLogFile(filename, parseInt(lines))
    
    res.json({
      success: true,
      data: {
        filename,
        lines: logLines,
        totalLines: logLines.length
      },
      message: `Retrieved ${logLines.length} lines from ${filename}`
    })
  } catch (error) {
    logger.error('Error reading log file', error)
    res.status(500).json({
      success: false,
      error: 'Failed to read log file'
    })
  }
})

// DELETE /api/admin/logs - Clear all log files (admin only)
router.delete('/admin/logs', generalLimiter, authenticateToken, requireAdmin, (req, res) => {
  try {
    const cleared = logger.clearLogs()
    
    if (cleared) {
      logger.info(`Log files cleared by admin: ${req.user.username}`)
      res.json({
        success: true,
        message: 'All log files cleared successfully'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear log files'
      })
    }
  } catch (error) {
    logger.error('Error clearing log files', error)
    res.status(500).json({
      success: false,
      error: 'Failed to clear log files'
    })
  }
})

module.exports = router
