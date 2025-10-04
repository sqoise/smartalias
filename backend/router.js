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
const db = require('./config/db')
const Validator = require('./utils/validator')
const ApiResponse = require('./utils/apiResponse')
const IDUtils = require('./utils/idUtils')
const UserRepository = require('./repositories/UserRepository')
const ResidentRepository = require('./repositories/ResidentRepository')
const { authenticateToken, requireAdmin, requireResident } = require('./middleware/authMiddleware')
const { authLimiter, passwordChangeLimiter, generalLimiter } = require('./config/rateLimit')

// Import shared messages
const { AUTH_MESSAGES, HTTP_STATUS_MESSAGES } = require('../shared/constants')
const { USER_ROLES } = require('./config/constants')

const router = express.Router()

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

    // Get user from repository
    const user = await UserRepository.findByUsername(username)

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
    const isValidPin = await bcrypt.compare(pin.toString(), user.password)

    if (!isValidPin) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1
      
      // Lock account if too many failed attempts
      let lockedUntil = null
      if (failedAttempts >= config.MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + config.LOCKOUT_TIME).toISOString()
        logger.warn('Account locked due to failed attempts', { username, attempts: failedAttempts })
      }

      await UserRepository.updateLoginFailure(user.id, username, failedAttempts, lockedUntil)

      logger.warn('Failed login attempt', { username, ip: req.ip, attempts: failedAttempts })
      return ApiResponse.unauthorized(res, 'Invalid PIN. Please try again.')
    }

    // Successful login - reset failed attempts
    await UserRepository.updateLoginSuccess(user.id, username)

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    )

    logger.info('Successful login', { username, role: user.role })

    // Determine redirect URL based on role constants
    const redirectTo = user.role === USER_ROLES.ADMIN ? '/admin' : '/resident'

    return ApiResponse.success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        passwordChanged: user.is_password_changed !== 0
      },
      redirectTo
    }, `Welcome ${user.username}!`)

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

    const user = await UserRepository.findByUsername(username)

    if (!user) {
      return ApiResponse.notFound(res, 'User not found')
    }

    return ApiResponse.success(res, {
      user: {
        username: user.username,
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
      role: req.user.role
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

    // Get user
    const user = await UserRepository.findByUsername(req.user.username)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: AUTH_MESSAGES.USER_NOT_FOUND
      })
    }

    // Verify current PIN
    const isValidCurrentPin = await bcrypt.compare(currentPin.toString(), user.password)
    if (!isValidCurrentPin) {
      logger.warn('Invalid current PIN in change request', { username: req.user.username })
      return res.status(400).json({
        success: false,
        error: AUTH_MESSAGES.PIN_CURRENT_INCORRECT
      })
    }

    // Hash new PIN
    const newHashedPin = await bcrypt.hash(newPin.toString(), config.BCRYPT_ROUNDS)

    // Update user password
    await UserRepository.updatePassword(user.id, user.username, newHashedPin)

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
    const { page = 1, limit = 50, search = '' } = req.query

    const result = await ResidentRepository.findAll(search, parseInt(page), parseInt(limit))

    res.json({
      success: true,
      data: result.residents,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      },
      message: `Retrieved ${result.residents.length} residents`
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

    const resident = await ResidentRepository.findById(id)

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
      return ApiResponse.validationError(res, validation.errors, 'Invalid resident data')
    }

    // Sanitize input data
    const sanitizedData = {
      firstName: Validator.sanitizeInput(residentData.firstName),
      lastName: Validator.sanitizeInput(residentData.lastName),
      middleName: Validator.sanitizeInput(residentData.middleName || ''),
      suffix: Validator.sanitizeInput(residentData.suffix || ''),
      birthDate: residentData.birthDate || null,
      gender: Validator.sanitizeInput(residentData.gender || ''),
      civilStatus: Validator.sanitizeInput(residentData.civilStatus || ''),
      homeNumber: Validator.sanitizeInput(residentData.homeNumber || ''),
      mobileNumber: Validator.sanitizeInput(residentData.mobileNumber || ''),
      email: Validator.sanitizeInput(residentData.email || ''),
      address: Validator.sanitizeInput(residentData.address || ''),
      purok: residentData.purok || null,
      religion: Validator.sanitizeInput(residentData.religion || ''),
      occupation: Validator.sanitizeInput(residentData.occupation || ''),
      specialCategory: Validator.sanitizeInput(residentData.specialCategory || ''),
      notes: Validator.sanitizeInput(residentData.notes || '')
    }

    // Generate username and PIN
    const username = `${sanitizedData.firstName.toLowerCase()}.${sanitizedData.lastName.toLowerCase()}`
    const pin = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit random PIN
    const hashedPassword = await bcrypt.hash(pin, config.BCRYPT_ROUNDS)

    // Check if username already exists
    const existingUser = await UserRepository.findByUsername(username)
    if (existingUser) {
      return ApiResponse.error(res, 'Username already exists. Please try with different names.', 409)
    }

    // Create user account first
    const userData = {
      username: username,
      passwordHash: hashedPassword,
      role: 'resident',
      passwordChanged: false // User must change PIN on first login
    }

    const newUser = await UserRepository.create(userData)

    // Create resident record
    const residentDataWithUser = {
      ...sanitizedData,
      userId: IDUtils.parseID(newUser.id), // Parse formatted ID back to integer for database
      isActive: 1,
      createdBy: IDUtils.parseID(req.user.id)
    }

    const newResident = await ResidentRepository.create(residentDataWithUser)

    logger.info(`Resident and user created by ${req.user.username}`, { 
      residentId: newResident.id, 
      userId: newUser.id,
      username: username 
    })

    // Return resident data with credentials
    const responseData = {
      resident: newResident,
      credentials: {
        username: username,
        pin: pin
      }
    }

    return ApiResponse.success(res, responseData, 'Resident added successfully', 201)

  } catch (error) {
    logger.error('Error creating resident and user', error)
    return ApiResponse.error(res, 'Failed to create resident. Please try again.', 500)
  }
})

// PUT /api/residents/:id - Update resident (admin only)
router.put('/residents/:id', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Validate resident ID
    if (!id || isNaN(parseInt(id))) {
      return ApiResponse.error(res, 'Valid resident ID is required', 400)
    }

    // CRITICAL: Use identical validation as POST /api/residents (create endpoint)
    const validation = Validator.validateResident(updateData)
    if (!validation.isValid) {
      Validator.logValidationError(req, validation, 'resident update')
      return ApiResponse.validationError(res, validation.errors, 'Invalid resident data')
    }

    // Sanitize input data (identical to create endpoint)
    const sanitizedData = {
      firstName: Validator.sanitizeInput(updateData.firstName),
      lastName: Validator.sanitizeInput(updateData.lastName),
      middleName: Validator.sanitizeInput(updateData.middleName || ''),
      suffix: Validator.sanitizeInput(updateData.suffix || ''),
      birthDate: updateData.birthDate || null,
      gender: Validator.sanitizeInput(updateData.gender || ''),
      civilStatus: Validator.sanitizeInput(updateData.civilStatus || ''),
      homeNumber: Validator.sanitizeInput(updateData.homeNumber || ''),
      mobileNumber: Validator.sanitizeInput(updateData.mobileNumber || ''),
      email: Validator.sanitizeInput(updateData.email || ''),
      address: Validator.sanitizeInput(updateData.address || ''),
      purok: updateData.purok || null,
      religion: Validator.sanitizeInput(updateData.religion || ''),
      occupation: Validator.sanitizeInput(updateData.occupation || ''),
      specialCategory: Validator.sanitizeInput(updateData.specialCategory || ''),
      notes: Validator.sanitizeInput(updateData.notes || ''),
      isActive: updateData.isActive !== undefined ? updateData.isActive : 1
    }

    // Apply formatTitleCase for consistency (same as create)
    sanitizedData.firstName = Validator.formatTitleCase(sanitizedData.firstName)
    sanitizedData.lastName = Validator.formatTitleCase(sanitizedData.lastName)
    sanitizedData.middleName = Validator.formatTitleCase(sanitizedData.middleName)
    sanitizedData.address = Validator.formatTitleCase(sanitizedData.address)

    const updatedResident = await ResidentRepository.updateById(id, sanitizedData)

    if (!updatedResident) {
      return ApiResponse.error(res, 'Resident not found', 404)
    }

    logger.info(`Resident updated by ${req.user.username}`, { 
      residentId: id, 
      updatedFields: Object.keys(sanitizedData).filter(key => sanitizedData[key] !== null && sanitizedData[key] !== '')
    })

    return ApiResponse.success(res, updatedResident, 'Resident updated successfully')

  } catch (error) {
    logger.error('Error updating resident', error)
    return ApiResponse.error(res, 'Failed to update resident. Please try again.', 500)
  }
})

// PATCH /api/residents/:id/status - Update resident status (admin only)
router.patch('/residents/:id/status', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { is_active } = req.body

    // Validate resident ID
    if (!id || isNaN(parseInt(id))) {
      return ApiResponse.error(res, 'Valid resident ID is required', 400)
    }

    // Validate is_active value
    if (is_active === undefined || ![0, 1].includes(parseInt(is_active))) {
      return ApiResponse.error(res, 'is_active must be 0 (inactive) or 1 (active)', 400)
    }

    // Quick status toggle without full validation
    const updatedResident = await ResidentRepository.updateStatus(id, parseInt(is_active))

    if (!updatedResident) {
      return ApiResponse.error(res, 'Resident not found', 404)
    }

    logger.info(`Resident status updated by ${req.user.username}`, { 
      residentId: id, 
      newStatus: is_active === 1 ? 'active' : 'inactive'
    })

    return ApiResponse.success(res, { 
      id: updatedResident.id, 
      is_active: updatedResident.is_active 
    }, `Resident ${is_active === 1 ? 'activated' : 'deactivated'} successfully`)

  } catch (error) {
    logger.error('Error updating resident status', error)
    return ApiResponse.error(res, 'Failed to update resident status. Please try again.', 500)
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

    const deleted = await ResidentRepository.delete(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      })
    }

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
    const stats = await ResidentRepository.getStats()

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

// ==========================================================================
// RESIDENT SELF-REGISTRATION ROUTES
// ==========================================================================

// POST /api/auth/register - Resident self-registration (public endpoint)
router.post('/auth/register', generalLimiter, async (req, res) => {
  try {
    const registrationData = req.body

    // Validate input
    const validation = Validator.validateResident(registrationData)
    if (!validation.isValid) {
      Validator.logValidationError(req, validation, 'resident self-registration')
      return ApiResponse.validationError(res, validation.errors, 'Invalid registration data')
    }

    // Validate username and PIN are provided for self-registration
    if (!registrationData.username || !registrationData.pin) {
      return ApiResponse.validationError(res, {
        username: !registrationData.username ? ['Username is required'] : [],
        pin: !registrationData.pin ? ['PIN is required'] : []
      }, 'Username and PIN are required for registration')
    }

    // Validate PIN format (6 digits)
    const pinValidation = Validator.validatePin(registrationData.pin)
    if (!pinValidation.isValid) {
      return ApiResponse.validationError(res, {
        pin: pinValidation.errors
      }, 'Invalid PIN format')
    }

    // Sanitize input data
    const sanitizedData = {
      firstName: Validator.sanitizeInput(registrationData.firstName),
      lastName: Validator.sanitizeInput(registrationData.lastName),
      middleName: Validator.sanitizeInput(registrationData.middleName || ''),
      suffix: Validator.sanitizeInput(registrationData.suffix || ''),
      birthDate: registrationData.birthDate || null,
      gender: Validator.sanitizeInput(registrationData.gender || ''),
      civilStatus: Validator.sanitizeInput(registrationData.civilStatus || ''),
      homeNumber: Validator.sanitizeInput(registrationData.homeNumber || ''),
      mobileNumber: Validator.sanitizeInput(registrationData.mobileNumber || ''),
      email: Validator.sanitizeInput(registrationData.email || ''),
      address: Validator.sanitizeInput(registrationData.address || ''),
      purok: registrationData.purok || null,
      religion: Validator.sanitizeInput(registrationData.religion || ''),
      occupation: Validator.sanitizeInput(registrationData.occupation || ''),
      specialCategory: Validator.sanitizeInput(registrationData.specialCategory || ''),
      notes: Validator.sanitizeInput(registrationData.notes || '')
    }

    const username = Validator.sanitizeInput(registrationData.username)
    const pin = registrationData.pin

    // Check if username already exists
    const existingUser = await UserRepository.findByUsername(username)
    if (existingUser) {
      return ApiResponse.error(res, 'Username already exists. Please choose a different username.', 409)
    }

    // Hash the PIN
    const hashedPassword = await bcrypt.hash(pin, config.BCRYPT_ROUNDS)

    // Create user account first
    const userData = {
      username: username,
      passwordHash: hashedPassword,
      role: 'resident',
      passwordChanged: true // User chose their own PIN, no need to change
    }

    const newUser = await UserRepository.create(userData)

    // Create resident record
    const residentDataWithUser = {
      ...sanitizedData,
      userId: IDUtils.parseID(newUser.id), // Parse formatted ID back to integer for database
      isActive: 1,
      selfRegistered: true // Flag to indicate self-registration
    }

    const newResident = await ResidentRepository.create(residentDataWithUser)

    logger.info(`Resident self-registered`, { 
      residentId: newResident.id, 
      userId: newUser.id,
      username: username 
    })

    // Return success without credentials (user already knows their own credentials)
    return ApiResponse.success(res, {
      resident: newResident,
      message: 'Registration successful! You can now login with your username and PIN.'
    }, 'Registration completed successfully', 201)

  } catch (error) {
    logger.error('Error in resident self-registration', error)
    return ApiResponse.error(res, 'Registration failed. Please try again.', 500)
  }
})

module.exports = router
