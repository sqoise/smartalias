/**
 * SMARTLIAS API Router
 * All API routes centralized in one file for simplicity
 */

const express = require('express')
const fs = require('fs').promises
const fsSync = require('fs')
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

// Import route modules
const uploadRoutes = require('./routes/uploadRoutes')
const ResidentRepository = require('./repositories/ResidentRepository')
const AnnouncementRepository = require('./repositories/AnnouncementRepository')
const DashboardRepository = require('./repositories/DashboardRepository')
const SMSService = require('./services/smsService')
const { authenticateToken, requireAdmin, requireResident } = require('./middleware/authMiddleware')
const { authLimiter, passwordChangeLimiter, generalLimiter } = require('./config/rateLimit')

// Import shared messages
const { AUTH_MESSAGES, HTTP_STATUS_MESSAGES } = require('./config/constants')
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
// DASHBOARD ENDPOINTS (Optimized for Admin Dashboard with Lazy Loading)
// ==========================================================================

// GET /api/dashboard/lightweight - Get essential stats for initial load (admin only)
router.get('/dashboard/lightweight', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await DashboardRepository.getLightweightStats()

    res.json({
      success: true,
      data: stats,
      message: 'Lightweight dashboard statistics retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting lightweight dashboard stats', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve lightweight dashboard statistics'
    })
  }
})

// GET /api/dashboard/categories - Get resident categories breakdown (admin only)
router.get('/dashboard/categories', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categories = await DashboardRepository.getResidentCategories()

    res.json({
      success: true,
      data: categories,
      message: 'Resident categories retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting resident categories', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resident categories'
    })
  }
})

// GET /api/dashboard/sms - Get SMS statistics (admin only)
router.get('/dashboard/sms', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const smsStats = await DashboardRepository.getSMSStats()

    res.json({
      success: true,
      data: smsStats,
      message: 'SMS statistics retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting SMS stats', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve SMS statistics'
    })
  }
})

// GET /api/dashboard/stats - Get comprehensive dashboard statistics (admin only)
router.get('/dashboard/stats', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await DashboardRepository.getDashboardStats()

    res.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting dashboard stats', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics'
    })
  }
})

// GET /api/dashboard/activity - Get recent activity (admin only)
router.get('/dashboard/activity', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const activity = await DashboardRepository.getRecentActivity()

    res.json({
      success: true,
      data: activity,
      message: 'Recent activity retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting recent activity', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent activity'
    })
  }
})

// GET /api/dashboard/health - Get system health status (admin only)
router.get('/dashboard/health', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const health = await DashboardRepository.getSystemHealth()

    res.json({
      success: true,
      data: health,
      message: 'System health retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting system health', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system health'
    })
  }
})

// GET /api/dashboard/trends - Get growth trends for charts (admin only)
router.get('/dashboard/trends', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const trends = await DashboardRepository.getGrowthTrends()

    res.json({
      success: true,
      data: trends,
      message: 'Growth trends retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting growth trends', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve growth trends'
    })
  }
})

// GET /api/dashboard/announcements/top - Get top performing announcements (admin only)
router.get('/dashboard/announcements/top', generalLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const topAnnouncements = await DashboardRepository.getTopAnnouncements()

    res.json({
      success: true,
      data: topAnnouncements,
      message: 'Top announcements retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting top announcements', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve top announcements'
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

// ==========================================================================
// ANNOUNCEMENTS ROUTES
// ==========================================================================

// GET /api/announcements - List announcements (filtered by user role/targeting)
router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    // Get announcements from database
    const announcements = await AnnouncementRepository.findAll()
    
    // Transform database format to API format
    const transformedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      is_urgent: announcement.type === 5, // Advisory type
      status: announcement.published_at ? 'published' : 'draft',
      target_groups: announcement.target_groups || ['all'],
      sms_target_groups: announcement.sms_target_groups || [], // Use actual SMS target groups from repository
      created_by: announcement.created_by,
      created_at: announcement.created_at,
      updated_at: announcement.updated_at,
      published_by: announcement.published_by,
      published_at: announcement.published_at
    }))

    return ApiResponse.success(res, transformedAnnouncements, 'Announcements retrieved successfully')
  } catch (error) {
    logger.error('Error fetching announcements', error)
    return ApiResponse.error(res, 'Failed to fetch announcements', 500)
  }
})

// GET /api/announcements/:id - Get specific announcement
router.get('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const announcementId = parseInt(req.params.id)
    
    // Mock implementation - replace with actual database query
    const mockAnnouncement = {
      id: announcementId,
      title: 'Community Health Drive',
      content: 'Join us for a free health check-up and vaccination drive this Saturday. All residents are welcome.',
      is_urgent: false,
      status: 'published',
      published_at: '2024-01-15T10:00:00Z',
      expires_at: null,
      target_groups: ['all'],
      created_by: 1,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z'
    }

    return ApiResponse.success(res, mockAnnouncement, 'Announcement retrieved successfully')
  } catch (error) {
    logger.error('Error fetching announcement', error)
    return ApiResponse.error(res, 'Failed to fetch announcement', 500)
  }
})

// POST /api/announcements - Create new announcement (Admin only)
router.post('/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      target_groups,
      sms_target_groups,
      status
    } = req.body

    // Validate required fields
    if (!title || !content) {
      return ApiResponse.validationError(res, {
        title: !title ? ['Title is required'] : [],
        content: !content ? ['Content is required'] : []
      }, 'Missing required fields')
    }

    // Validate content length
    const contentValidation = Validator.validateContent(content)
    if (!contentValidation.isValid) {
      return ApiResponse.validationError(res, {
        content: contentValidation.errors
      }, 'Content validation failed')
    }

    // Validate target groups (use default if not provided)
    const finalTargetGroups = target_groups && Array.isArray(target_groups) && target_groups.length > 0 
      ? target_groups 
      : ['all_residents'] // Default target group

    // Parse SMS target groups to target_type and target_value
    let target_type = null  // null = SMS disabled
    let target_value = null
    
    if (sms_target_groups && sms_target_groups.length > 0) {
      if (sms_target_groups.includes('all')) {
        // If 'all' is included, use 'all' (ignore other selections)
        target_type = 'all'
        target_value = null
      } else if (sms_target_groups.length === 1) {
        // Single specific target group
        const target = sms_target_groups[0]
        if (target.includes(':')) {
          const [type, value] = target.split(':')
          target_type = type
          target_value = value
        } else {
          target_type = 'specific'
          target_value = target
        }
      } else {
        // Multiple specific target groups - store as JSON array
        target_type = 'multiple'
        target_value = JSON.stringify(sms_target_groups)
      }
    }
    // If sms_target_groups is empty or null, target_type remains null (SMS disabled)

    // Create announcement in database
    const announcementData = {
      title: Validator.sanitizeInput(title),
      content: Validator.sanitizeContent(content),
      type: type || 1, // Use provided type or default to 1 (General)
      status: status || 'unpublished',
      target_type: target_type,
      target_value: target_value,
      created_by: req.user.id,
      published_by: status === 'published' ? req.user.id : null
    }

    const newAnnouncement = await AnnouncementRepository.create(announcementData)

    // If publishing and SMS enabled (target_type is not null), send SMS notifications
    if (status === 'published' && target_type !== null) {
      const smsTargetGroups = [`${target_type}:${target_value}`]
      
      // Send SMS in background (don't wait for completion)
      SMSService.getRecipients(smsTargetGroups)
        .then(recipients => {
          logger.info('SMS recipients retrieved', {
            announcementId: newAnnouncement.id,
            recipientCount: recipients.length,
            targetGroups: sms_target_groups
          })
          
          return SMSService.sendSMS(newAnnouncement, recipients, sms_target_groups)
        })
        .then(results => {
          logger.info('SMS notifications sent', {
            announcementId: newAnnouncement.id,
            ...results
          })
        })
        .catch(error => {
          logger.error('Error sending SMS notifications', {
            announcementId: newAnnouncement.id,
            error: error.message
          })
        })
    }

    const message = status === 'published' 
      ? 'Announcement created and published successfully'
      : 'Announcement saved as draft'

    return ApiResponse.success(res, newAnnouncement, message, 201)
  } catch (error) {
    logger.error('Error creating announcement', error)
    return ApiResponse.error(res, 'Failed to create announcement', 500)
  }
})

// PUT /api/announcements/:id - Update announcement (Admin only)
router.put('/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcementId = parseInt(req.params.id)
    // Extract fields from request body
    const {
      title,
      content,
      type,
      is_urgent,
      expires_at,
      target_groups,
      sms_target_groups,
      send_sms,
      status
    } = req.body

    // Debug logging
    logger.info('Update announcement request data', {
      announcementId,
      title,
      content,
      type,
      send_sms,
      sms_target_groups,
      sms_target_groups_type: typeof sms_target_groups,
      sms_target_groups_length: sms_target_groups?.length
    })

    // Validate required fields
    if (!title || !content) {
      return ApiResponse.validationError(res, {
        title: !title ? ['Title is required'] : [],
        content: !content ? ['Content is required'] : []
      }, 'Missing required fields')
    }

    // Validate content length
    const contentValidation = Validator.validateContent(content)
    if (!contentValidation.isValid) {
      return ApiResponse.validationError(res, {
        content: contentValidation.errors
      }, 'Content validation failed')
    }

    // Check if announcement exists
    const existing = await AnnouncementRepository.findById(announcementId)
    if (!existing) {
      return ApiResponse.error(res, 'Announcement not found', 404)
    }

    // Prepare update data
    const updateData = {
      title: Validator.sanitizeInput(title),
      content: Validator.sanitizeContent(content),
      type: type ? parseInt(type) : existing.type // Use the actual type from frontend, fallback to existing
    }

    logger.info('Prepared update data for repository', {
      updateData,
      originalTitle: title,
      originalContent: content,
      originalType: type
    })

    // Parse SMS target groups to target_type and target_value
    if (send_sms && sms_target_groups && sms_target_groups.length > 0) {
      if (sms_target_groups.includes('all')) {
        // If 'all' is included, use 'all' (ignore other selections)
        updateData.target_type = 'all'
        updateData.target_value = null
      } else if (sms_target_groups.length === 1) {
        // Single specific target group
        const target = sms_target_groups[0]
        if (target.includes(':')) {
          const [type, value] = target.split(':')
          updateData.target_type = type
          updateData.target_value = value
        } else {
          updateData.target_type = 'specific'
          updateData.target_value = target
        }
      } else {
        // Multiple specific target groups - store as JSON array
        updateData.target_type = 'multiple'
        updateData.target_value = JSON.stringify(sms_target_groups)
      }
    } else {
      // No SMS - set to null (SMS disabled)
      updateData.target_type = null
      updateData.target_value = null
    }

    // Handle status change (draft → published)
    const existingStatus = existing.published_at ? 'published' : 'draft'
    if (status && status !== existingStatus) {
      updateData.status = status
      if (status === 'published' && existingStatus === 'draft') {
        updateData.published_by = req.user.id // Track who published it (use id not userId)
      }
    }

    logger.info('Final update data before repository call', {
      updateData,
      existingStatus,
      newStatus: status,
      userId: req.user.id
    })

    // Update announcement in database (simplified - no separate target groups parameter)
    const updatedAnnouncement = await AnnouncementRepository.update(
      announcementId, 
      updateData
    )

    // If publishing and SMS enabled (target_type is not null), send SMS notifications
    logger.info('Checking SMS conditions', {
      status,
      target_type: updateData.target_type,
      target_value: updateData.target_value,
      shouldSendSMS: status === 'published' && updateData.target_type !== null
    })
    
    if (status === 'published' && updateData.target_type !== null) {
      let smsTargetGroups
      
      if (updateData.target_type === 'all') {
        smsTargetGroups = ['all']
      } else if (updateData.target_type === 'multiple') {
        // Parse JSON array for multiple target groups
        try {
          smsTargetGroups = JSON.parse(updateData.target_value || '[]')
        } catch (error) {
          logger.error('Error parsing multiple target groups', { target_value: updateData.target_value, error })
          smsTargetGroups = []
        }
      } else {
        smsTargetGroups = [`${updateData.target_type}:${updateData.target_value}`]
      }
      
      logger.info('SMS target groups prepared', {
        announcementId,
        smsTargetGroups,
        target_type: updateData.target_type,
        target_value: updateData.target_value
      })
      
      // Send SMS in background (don't wait for completion)
      SMSService.getRecipients(smsTargetGroups)
        .then(recipients => {
          logger.info('SMS recipients retrieved for update', {
            announcementId: announcementId,
            recipientCount: recipients.length,
            targetGroups: smsTargetGroups,
            recipients: recipients.map(r => ({ name: `${r.first_name} ${r.last_name}`, phone: r.mobile_number }))
          })
          
          if (recipients.length === 0) {
            logger.warn('No SMS recipients found', { announcementId, smsTargetGroups })
            return { total: 0, sent: 0, failed: 0 }
          }
          
          // Add id to updatedAnnouncement for SMS sending
          return SMSService.sendSMS({ ...updatedAnnouncement, id: announcementId }, recipients, smsTargetGroups)
        })
        .then(results => {
          logger.info('SMS notifications sent for update', {
            announcementId: announcementId,
            ...results
          })
        })
        .catch(error => {
          logger.error('Error sending SMS notifications for update', {
            announcementId: announcementId,
            error: error.message
          })
        })
    }

    const message = status === 'published' 
      ? 'Announcement updated and published successfully'
      : 'Announcement updated and saved as draft'

    return ApiResponse.success(res, updatedAnnouncement, message)
  } catch (error) {
    logger.error('Error updating announcement', error)
    return ApiResponse.error(res, 'Failed to update announcement', 500)
  }
})

// DELETE /api/announcements/:id - Delete announcement (Admin only)
router.delete('/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcementId = parseInt(req.params.id)
    
    // Check if announcement exists
    const existing = await AnnouncementRepository.findById(announcementId)
    if (!existing) {
      return ApiResponse.error(res, 'Announcement not found', 404)
    }

    // Delete from database (CASCADE will remove target groups and SMS records)
    await AnnouncementRepository.delete(announcementId)
    
    logger.info('Announcement deleted', { announcementId, deletedBy: req.user.id })

    return ApiResponse.success(res, null, 'Announcement deleted successfully')
  } catch (error) {
    logger.error('Error deleting announcement', error)
    return ApiResponse.error(res, 'Failed to delete announcement', 500)
  }
})

// GET /api/announcements/:id/sms-status - Get SMS delivery status for announcement (Admin only)
router.get('/announcements/:id/sms-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcementId = parseInt(req.params.id)
    
    // Query actual SMS logs from database
    const query = `
      SELECT 
        announcement_id,
        target_groups,
        total_recipients,
        successful_sends,
        failed_sends,
        sms_content,
        sent_at
      FROM announcement_sms_logs 
      WHERE announcement_id = $1
      ORDER BY sent_at DESC
      LIMIT 1
    `
    
    const result = await db.query(query, [announcementId])
    
    if (result.rows.length === 0) {
      // No SMS logs found for this announcement
      return ApiResponse.success(res, {
        total_recipients: 0,
        successful_sends: 0,
        failed_sends: 0,
        sms_content: null,
        sent_at: null
      }, 'No SMS data found for this announcement')
    }
    
    const smsLog = result.rows[0]
    
    return ApiResponse.success(res, {
      total_recipients: smsLog.total_recipients || 0,
      successful_sends: smsLog.successful_sends || 0,
      failed_sends: smsLog.failed_sends || 0,
      sms_content: smsLog.sms_content,
      target_groups: smsLog.target_groups,
      sent_at: smsLog.sent_at
    }, 'SMS status retrieved successfully')
  } catch (error) {
    logger.error('Error fetching SMS status', error)
    return ApiResponse.error(res, 'Failed to fetch SMS status', 500)
  }
})

// ==========================================================================
// UPLOAD ROUTES
// ==========================================================================

// Use upload routes
router.use('/upload', uploadRoutes)

module.exports = router
