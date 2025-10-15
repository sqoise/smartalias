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
const crypto = require('crypto')

// Import utilities and middleware
const config = require('./config/config')
const logger = require('./config/logger')
const db = require('./config/db')
const Validator = require('./utils/validator')
const ApiResponse = require('./utils/apiResponse')
const UserRepository = require('./repositories/UserRepository')

// Import route modules
const uploadRoutes = require('./routes/uploadRoutes')
const ResidentRepository = require('./repositories/ResidentRepository')
const AnnouncementRepository = require('./repositories/AnnouncementRepository')
const DashboardRepository = require('./repositories/DashboardRepository')
const ChatbotRepository = require('./repositories/ChatbotRepository')
const DocumentRequestRepository = require('./repositories/DocumentRequestRepository')
const DocumentDetails = require('./utils/documentDetails')
const SMSService = require('./services/smsService')
const FileUploadService = require('./services/fileUploadService')
const { authenticateToken, requireAdmin, requireStaffOrAdmin, requireResident, authenticateChangePinToken, requireAdminForDelete } = require('./middleware/authMiddleware')
const { authLimiter, passwordChangeLimiter, generalLimiter } = require('./config/rateLimit')

// Import controllers
const documentController = require('./controllers/documentController')

// Import shared messages
const { AUTH_MESSAGES, HTTP_STATUS_MESSAGES } = require('./config/constants')
const { USER_ROLES } = require('./config/constants')

const router = express.Router()

// Initialize file upload service
const fileUploadService = new FileUploadService()
const uploadMiddleware = fileUploadService.getSingleUploadMiddleware('documentImage')

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
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      logger.warn('Login attempt on locked account', { username, ip: req.ip })
      return ApiResponse.error(res, 'Account temporarily locked. Please try again later.', 423)
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin.toString(), user.password)

    if (!isValidPin) {
      // Increment failed attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1
      
      logger.warn('Failed login attempt', { 
        username, 
        ip: req.ip, 
        attempts: failedAttempts,
        maxAttempts: config.MAX_LOGIN_ATTEMPTS,
        currentFailedAttempts: user.failed_login_attempts
      })
      
      // Lock account if too many failed attempts
      let lockedUntil = null
      if (failedAttempts >= config.MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + config.LOCKOUT_TIME).toISOString()
        logger.warn('Account locked due to failed attempts', { 
          username, 
          attempts: failedAttempts,
          lockedUntil,
          lockoutTimeMs: config.LOCKOUT_TIME
        })
      }

      await UserRepository.updateLoginFailure(user.id, username, failedAttempts, lockedUntil)

      const message = failedAttempts >= config.MAX_LOGIN_ATTEMPTS 
        ? 'Account locked due to too many failed attempts. Please try again in 15 minutes.'
        : 'Invalid PIN. Please try again.'
      
      return ApiResponse.unauthorized(res, message)
    }

    // Check if user account is active (pending approval)
    if (user.is_active === 0) {
      logger.warn('Login attempt with pending approval account', { username, user_id: user.id })
      return ApiResponse.error(res, 'Account pending approval. We will notify you via SMS once activated.', 403)
    }

    // Check if resident account is active (for role 3 - Resident)
    if (user.role === USER_ROLES.RESIDENT) {
      const resident = await ResidentRepository.findByUserId(user.id)
      
      if (resident && resident.is_active === 0) {
        logger.warn('Login attempt with inactive resident account', { username, user_id: user.id, resident_id: resident.id })
        return ApiResponse.error(res, 'Your account has been deactivated. Please contact the barangay office.', 403)
      }
    }

    // Successful login - reset failed attempts
    await UserRepository.updateLoginSuccess(user.id, username)

    logger.info('Successful login', { username, role: user.role })

    // Determine redirect URL and token based on password change status
    let redirectTo
    let token
    
    if (user.is_password_changed === 0) {
      // User needs to change PIN - generate ONLY change-pin token
      // This token has limited permissions and cannot access dashboard
      token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          purpose: 'change-pin',
          timestamp: Date.now()
        },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      )
      redirectTo = `/change-pin?token=${token}`
    } else {
      // User has changed password - generate regular auth token
      token = jwt.sign(
        {
          userId: user.id,
          id: user.id, // Keep for backward compatibility
          username: user.username,
          role: user.role
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      )
      // Redirect based on role: Admin and Staff go to /admin, Residents go to /resident
      if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF) {
        redirectTo = '/admin'
      } else {
        redirectTo = '/resident'
      }
    }

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

// GET /api/public/special-categories - Get special categories for registration (public endpoint)
router.get('/public/special-categories', generalLimiter, async (req, res) => {
  try {
    const categories = await ChatbotRepository.getSpecialCategories()
    
    return ApiResponse.success(res, categories, 'Special categories retrieved successfully')
  } catch (error) {
    logger.error('Error fetching public special categories', error)
    return ApiResponse.serverError(res, 'Failed to fetch special categories', error)
  }
})

// GET /api/auth/me - Get current user info
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    // Get full user info including is_password_changed
    const user = await UserRepository.findByUsername(req.user.username)
    
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404)
    }

    // Check if this is a PIN change token (not a regular auth token)
    if (req.user.purpose === 'change-pin') {
      return ApiResponse.error(res, 'PIN change required. Please complete your PIN change first.', 403)
    }

    // Check if user needs to change password
    if (user.is_password_changed === 0) {
      return ApiResponse.error(res, 'Password change required. Please change your PIN before accessing the dashboard.', 403)
    }

    return ApiResponse.success(res, {
      id: user.id,
      username: user.username,
      role: user.role,
      passwordChanged: user.is_password_changed !== 0
    }, 'User information retrieved')
  } catch (error) {
    logger.error('Get user info error', error)
    return ApiResponse.serverError(res, 'Failed to get user info', error)
  }
})

// POST /api/auth/logout - User logout
router.post('/auth/logout', authenticateToken, (req, res) => {
  logger.info('User logout', { username: req.user.username })
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

// POST /api/auth/change-password - Change user PIN (requires current PIN)
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

// POST /api/auth/validate-change-token - Validate change-pin token
router.post('/auth/validate-change-token', authenticateChangePinToken, async (req, res) => {
  try {
    // Token already validated by middleware, get user from req.changePinUser
    const decoded = req.changePinUser

    // Get user to check if password has already been changed
    const user = await UserRepository.findByUsername(decoded.username)
    
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404)
    }

    // If password already changed, token is no longer valid
    if (user.is_password_changed !== 0) {
      return ApiResponse.error(res, 'Password has already been changed. Please login.', 400)
    }

    // Token is valid
    return ApiResponse.success(res, {
      username: user.username,
      role: user.role,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    }, 'Token is valid')

  } catch (error) {
    logger.error('Token validation error', error)
    return ApiResponse.serverError(res, 'Failed to validate token', error)
  }
})

// POST /api/auth/change-password-first-time - Change PIN for first-time users (no current PIN required)
router.post('/auth/change-password-first-time', passwordChangeLimiter, authenticateChangePinToken, async (req, res) => {
  try {
    const { newPin } = req.body
    // Token already validated by middleware, get user from req.changePinUser
    const decoded = req.changePinUser

    if (!decoded) {
      logger.error('changePinUser not set by middleware')
      return ApiResponse.error(res, 'Invalid request. Token validation failed.', 500)
    }

    // Validate input
    const newPinValidation = Validator.validatePin(newPin)

    if (!newPinValidation.isValid) {
      return ApiResponse.validationError(res, {
        newPin: newPinValidation.errors
      }, 'Invalid new PIN format')
    }

    // Get user from token
    const user = await UserRepository.findByUsername(decoded.username)

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404)
    }

    // Check if user has already changed password
    if (user.is_password_changed !== 0) {
      return ApiResponse.error(res, 'Password already changed. Please login with your new PIN.', 400)
    }

    // Hash new PIN
    const newHashedPin = await bcrypt.hash(newPin.toString(), config.BCRYPT_ROUNDS)

    // Update user password and set is_password_changed to 1
    await UserRepository.updatePassword(user.id, user.username, newHashedPin)

    logger.info('First-time PIN changed successfully', { username: decoded.username, userId: decoded.userId })

    return ApiResponse.success(res, null, 'PIN changed successfully. You can now use your new PIN to login.')

  } catch (error) {
    logger.error('First-time PIN change error', error)
    return ApiResponse.serverError(res, 'Failed to change PIN', error)
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

// GET /api/residents/special-categories - Get special categories for dropdowns (authenticated)
router.get('/residents/special-categories', generalLimiter, authenticateToken, async (req, res) => {
  try {
    const categories = await ChatbotRepository.getSpecialCategories()
    
    return ApiResponse.success(res, categories, 'Special categories retrieved successfully')
  } catch (error) {
    logger.error('Error fetching special categories', error)
    return ApiResponse.serverError(res, 'Failed to fetch special categories', error)
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

// POST /api/residents - Create new resident (STAFF OR ADMIN)
// NOTE: This endpoint creates IMMEDIATELY ACTIVE accounts (both user and resident)
// For PUBLIC self-registration, use POST /api/auth/register which requires approval
router.post('/residents', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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

    // Generate username and PIN (remove spaces from names)
    const cleanFirstName = sanitizedData.firstName.toLowerCase().replace(/\s+/g, '')
    const cleanLastName = sanitizedData.lastName.toLowerCase().replace(/\s+/g, '')
    const username = `${cleanFirstName}.${cleanLastName}`
    const pin = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit random PIN
    const hashedPassword = await bcrypt.hash(pin, config.BCRYPT_ROUNDS)

    // Check if username already exists
    const existingUser = await UserRepository.findByUsername(username)
    if (existingUser) {
      return ApiResponse.error(res, 'Username already exists. Please try with different names.', 409)
    }

    // Create user account first (ACTIVE - admin-created users are immediately active)
    const userData = {
      username: username,
      passwordHash: hashedPassword,
      role: 'resident',
      passwordChanged: false, // User must change PIN on first login
      isActive: 1 // ACTIVE - admin-created users are immediately active
    }

    const newUser = await UserRepository.create(userData)

    // Create resident record (ACTIVE - admin-created residents are immediately active)
    const residentDataWithUser = {
      ...sanitizedData,
      userId: newUser.id, // Use clean integer ID
      isActive: 1, // ACTIVE - admin-created residents are immediately active
      createdBy: req.user.id // Use clean integer ID
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

// PUT /api/residents/:id - Update resident (staff or admin)
router.put('/residents/:id', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Validate resident ID
    if (!id || isNaN(parseInt(id))) {
      return ApiResponse.error(res, 'Valid resident ID is required', 400)
    }

    // Transform snake_case to camelCase for validation (support both formats)
    const normalizedData = {
      firstName: updateData.firstName || updateData.first_name,
      lastName: updateData.lastName || updateData.last_name,
      middleName: updateData.middleName || updateData.middle_name || '',
      suffix: updateData.suffix || '',
      birthDate: updateData.birthDate || updateData.birth_date || null,
      gender: updateData.gender || '',
      civilStatus: updateData.civilStatus || updateData.civil_status || '',
      homeNumber: updateData.homeNumber || updateData.home_number || '',
      mobileNumber: updateData.mobileNumber || updateData.mobile_number || '',
      email: updateData.email || '',
      address: updateData.address || '',
      purok: updateData.purok || null,
      religion: updateData.religion || '',
      occupation: updateData.occupation || '',
      special_category_id: updateData.specialCategory || updateData.special_category || updateData.special_category_id || null,
      notes: updateData.notes || '',
      isActive: updateData.isActive !== undefined ? updateData.isActive : (updateData.is_active !== undefined ? updateData.is_active : 1)
    }

    // CRITICAL: Use identical validation as POST /api/residents (create endpoint)
    const validation = Validator.validateResident(normalizedData)
    if (!validation.isValid) {
      Validator.logValidationError(req, validation, 'resident update')
      return ApiResponse.validationError(res, validation.errors, 'Invalid resident data')
    }

    // Additional validation: Check if special_category_id exists in database
    if (normalizedData.special_category_id) {
      const categories = await ChatbotRepository.getSpecialCategories()
      const validCategoryIds = categories.map(cat => cat.id)
      const categoryId = parseInt(normalizedData.special_category_id)
      
      if (!validCategoryIds.includes(categoryId)) {
        return ApiResponse.validationError(res, ['Invalid special category selected'], 'Invalid special category')
      }
    }

    // Sanitize input data (identical to create endpoint)
    const sanitizedData = {
      firstName: Validator.sanitizeInput(normalizedData.firstName),
      lastName: Validator.sanitizeInput(normalizedData.lastName),
      middleName: Validator.sanitizeInput(normalizedData.middleName),
      suffix: Validator.sanitizeInput(normalizedData.suffix),
      birthDate: normalizedData.birthDate,
      gender: Validator.sanitizeInput(normalizedData.gender),
      civilStatus: Validator.sanitizeInput(normalizedData.civilStatus),
      homeNumber: Validator.sanitizeInput(normalizedData.homeNumber),
      mobileNumber: Validator.sanitizeInput(normalizedData.mobileNumber),
      email: Validator.sanitizeInput(normalizedData.email),
      address: Validator.sanitizeInput(normalizedData.address),
      purok: normalizedData.purok,
      religion: Validator.sanitizeInput(normalizedData.religion),
      occupation: Validator.sanitizeInput(normalizedData.occupation),
      special_category_id: normalizedData.special_category_id || null,
      notes: Validator.sanitizeInput(normalizedData.notes),
      isActive: normalizedData.isActive
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

// PATCH /api/residents/:id/status - Update resident status (staff or admin)
router.patch('/residents/:id/status', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
router.delete('/residents/:id', generalLimiter, authenticateToken, requireAdminForDelete, async (req, res) => {
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

// POST /api/residents/:id/reset-pin - Reset resident PIN and generate new credentials (admin or staff)
router.post('/residents/:id/reset-pin', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Validate ID
    const residentId = parseInt(id)
    if (!residentId || isNaN(residentId)) {
      return ApiResponse.validationError(res, { id: ['Valid resident ID is required'] }, 'Invalid resident ID')
    }

    // Get resident to verify it exists and get user_id
    const resident = await ResidentRepository.findById(residentId)

    if (!resident) {
      return ApiResponse.error(res, 'Resident not found', 404)
    }

    // Check if resident has user_id (from API format)
    const userId = resident.user_id || resident.userId
    
    if (!userId) {
      logger.warn(`Reset PIN failed: Resident ${residentId} has no user account`, { 
        residentId: residentId,
        residentData: { ...resident, user_id: resident.user_id, userId: resident.userId }
      })
      return ApiResponse.error(res, 'This resident does not have a user account', 400)
    }

    // Ensure userId is integer
    const userIdInt = parseInt(userId)

    logger.info(`Attempting to reset PIN for resident ${residentId}, user ${userIdInt}`, {
      residentId: residentId,
      userId: userIdInt,
      requestedBy: req.user.username
    })

    // Get user account
    const user = await UserRepository.findById(userIdInt)

    if (!user) {
      return ApiResponse.error(res, 'User account not found', 404)
    }

    // Generate new 6-digit PIN
    const newPin = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedPassword = await bcrypt.hash(newPin, config.BCRYPT_ROUNDS)

    // Update user password and reset password_changed flag
    const updateData = {
      passwordHash: hashedPassword,
      passwordChanged: false // User must change PIN on next login
    }

    await UserRepository.resetPassword(user.id, updateData)

    logger.info(`PIN reset for resident ${id} by ${req.user.username}`, { 
      residentId: id, 
      userId: user.id,
      username: user.username 
    })

    // Return new credentials
    return ApiResponse.success(res, {
      username: user.username,
      pin: newPin,
      message: 'PIN has been reset successfully. User must change this PIN on next login.'
    }, 'PIN reset successfully', 200)

  } catch (error) {
    logger.error('Error resetting resident PIN', error)
    return ApiResponse.error(res, 'Failed to reset PIN', 500)
  }
})

// GET /api/residents/stats - Get resident statistics (admin or staff only)
router.get('/residents/stats', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
router.get('/dashboard/lightweight', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
router.get('/dashboard/categories', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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

// GET /api/dashboard/sms - Get SMS statistics and service status (admin only)
router.get('/dashboard/sms', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    // Get both SMS stats and service status
    const [smsStats, serviceStatus] = await Promise.all([
      DashboardRepository.getSMSStats(),
      SMSService.checkSMSCredits()
    ])

    res.json({
      success: true,
      data: {
        ...smsStats,
        serviceStatus
      },
      message: 'SMS statistics and service status retrieved successfully'
    })

  } catch (error) {
    logger.error('Error getting SMS stats and service status', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve SMS statistics and service status'
    })
  }
})

// GET /api/dashboard/stats - Get comprehensive dashboard statistics (admin only)
router.get('/dashboard/stats', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
router.get('/dashboard/activity', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const activity = await DashboardRepository.getRecentActivity()

    // Debug: Log all activities with timestamps
    console.log('=== ALL ACTIVITIES ===')
    activity.forEach((act, idx) => {
      console.log(`Activity ${idx + 1}:`, {
        type: act.type,
        details: act.details.substring(0, 50),
        timestamp: act.timestamp,
        timestampISO: act.timestamp instanceof Date ? act.timestamp.toISOString() : act.timestamp
      })
    })
    console.log('=== END ===')

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
router.get('/dashboard/health', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
router.get('/dashboard/trends', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
router.get('/dashboard/announcements/top', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
router.get('/admin/logs', generalLimiter, authenticateToken, requireStaffOrAdmin, (req, res) => {
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
router.get('/admin/logs/:filename', generalLimiter, authenticateToken, requireStaffOrAdmin, (req, res) => {
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
router.delete('/admin/logs', generalLimiter, authenticateToken, requireAdminForDelete, (req, res) => {
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
// USER MANAGEMENT ROUTES (Admin Only)
// ==========================================================================

// GET /api/admin/users/with-roles - Get users with specific roles (admin or staff)
router.get('/admin/users/with-roles', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    // Get users with specified roles, including resident information
    const query = `
      SELECT 
        u.id,
        u.username,
        u.role,
        u.is_active,
        u.created_at,
        r.first_name,
        r.last_name,
        r.middle_name,
        r.mobile_number
      FROM users u
      LEFT JOIN residents r ON u.id = r.user_id
      WHERE u.role IN (1, 2) AND u.is_active = 1
      ORDER BY u.created_at DESC
    `
    
    const result = await db.query(query)
    
    // Format response data
    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      role: row.role === 1 ? 'admin' : 'staff',
      is_active: row.is_active,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      middle_name: row.middle_name || '',
      mobile_number: row.mobile_number || '',
      created_at: row.created_at
    }))

    return ApiResponse.success(res, users, `Retrieved ${users.length} users`)

  } catch (error) {
    logger.error('Error getting users with roles', error)
    return ApiResponse.error(res, 'Failed to retrieve users', 500)
  }
})

// GET /api/admin/users/pending-requests - Get pending access requests (admin or staff)
router.get('/admin/users/pending-requests', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    // Get inactive users (pending approval) with their resident information
    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        u.is_active as user_active,
        u.created_at,
        u.attachment_image,
        r.id as resident_id,
        r.first_name,
        r.last_name,
        r.middle_name,
        r.mobile_number,
        r.address,
        r.birth_date,
        r.gender,
        r.civil_status,
        r.purok,
        r.is_active as resident_active
      FROM users u
      INNER JOIN residents r ON u.id = r.user_id
      WHERE u.is_active = 0 AND u.role = 3
      ORDER BY u.created_at DESC
    `
    
    const result = await db.query(query)
    
    // Format response data
    const requests = result.rows.map(row => ({
      id: row.resident_id,
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      middle_name: row.middle_name || '',
      mobile_number: row.mobile_number || '',
      address: row.address || '',
      birth_date: row.birth_date,
      gender: row.gender,
      civil_status: row.civil_status || '',
      purok: row.purok,
      attachment_image: row.attachment_image,
      created_at: row.created_at,
      user_active: row.user_active,
      resident_active: row.resident_active
    }))

    return ApiResponse.success(res, requests, `Retrieved ${requests.length} pending requests`)

  } catch (error) {
    logger.error('Error getting pending access requests', error)
    return ApiResponse.error(res, 'Failed to retrieve pending requests', 500)
  }
})

// PATCH /api/admin/users/:id/revoke-access - Revoke user access (admin only)
router.patch('/admin/users/:id/revoke-access', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    if (!userId || isNaN(userId)) {
      return ApiResponse.validationError(res, { id: ['Valid user ID is required'] }, 'Invalid user ID')
    }

    // Get user to verify exists
    const user = await UserRepository.findById(userId)
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404)
    }

    // Prevent admin from revoking their own access
    if (userId === req.user.id) {
      return ApiResponse.error(res, 'You cannot revoke your own access', 403)
    }

    // Change user role back to resident (role = 3)
    const updateQuery = `
      UPDATE users 
      SET role = 3, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING username, role
    `
    
    const result = await db.query(updateQuery, [userId])
    
    if (result.rows.length === 0) {
      return ApiResponse.error(res, 'Failed to update user role', 500)
    }

    logger.info(`Access revoked for user ${result.rows[0].username} by ${req.user.username}`, {
      userId: userId,
      previousRole: user.role,
      newRole: 3,
      revokedBy: req.user.id
    })

    return ApiResponse.success(res, { 
      username: result.rows[0].username,
      newRole: 'resident'
    }, 'Access revoked successfully')

  } catch (error) {
    logger.error('Error revoking user access', error)
    return ApiResponse.error(res, 'Failed to revoke access', 500)
  }
})

// PATCH /api/admin/users/:id/grant-access - Grant user access (admin only)
router.patch('/admin/users/:id/grant-access', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { role } = req.body
    
    if (!userId || isNaN(userId)) {
      return ApiResponse.validationError(res, { id: ['Valid user ID is required'] }, 'Invalid user ID')
    }

    if (!role || !['admin', 'staff'].includes(role)) {
      return ApiResponse.validationError(res, { role: ['Role must be admin or staff'] }, 'Invalid role')
    }

    // Get user to verify exists
    const user = await UserRepository.findById(userId)
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404)
    }

    // Convert role name to role ID
    const roleMap = { 'admin': 1, 'staff': 2 }
    const roleId = roleMap[role]

    // Update user role
    const updateQuery = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING username, role
    `
    
    const result = await db.query(updateQuery, [roleId, userId])
    
    if (result.rows.length === 0) {
      return ApiResponse.error(res, 'Failed to update user role', 500)
    }

    logger.info(`Access granted to user ${result.rows[0].username} by ${req.user.username}`, {
      userId: userId,
      previousRole: user.role,
      newRole: roleId,
      grantedBy: req.user.id
    })

    return ApiResponse.success(res, { 
      username: result.rows[0].username,
      newRole: role
    }, `${role.charAt(0).toUpperCase() + role.slice(1)} access granted successfully`)

  } catch (error) {
    logger.error('Error granting user access', error)
    return ApiResponse.error(res, 'Failed to grant access', 500)
  }
})

// PATCH /api/admin/users/:id/approve-request - Approve access request (admin only)
router.patch('/admin/users/:id/approve-request', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    if (!userId || isNaN(userId)) {
      return ApiResponse.validationError(res, { id: ['Valid user ID is required'] }, 'Invalid user ID')
    }

    // Get user to verify exists and is inactive
    const user = await UserRepository.findById(userId)
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404)
    }

    if (user.is_active === 1) {
      return ApiResponse.error(res, 'User is already active', 400)
    }

    // Update user to active and resident to active with approval info
    const updateUserQuery = `
      UPDATE users 
      SET is_active = 1, 
          updated_at = CURRENT_TIMESTAMP,
          approved_by = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING username
    `
    
    const updateResidentQuery = `
      UPDATE residents 
      SET is_active = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
      RETURNING mobile_number
    `
    
    const userResult = await db.query(updateUserQuery, [userId, req.user.id])
    const residentResult = await db.query(updateResidentQuery, [userId])
    
    if (userResult.rows.length === 0) {
      return ApiResponse.error(res, 'Failed to activate user account', 500)
    }

    const username = userResult.rows[0].username
    const mobileNumber = residentResult.rows.length > 0 ? residentResult.rows[0].mobile_number : null

    // Send SMS notification if mobile number is available
    if (mobileNumber) {
      try {
        // Get resident's first name for personalized SMS
        const getResidentNameQuery = `
          SELECT first_name 
          FROM residents 
          WHERE user_id = $1
        `
        const residentNameResult = await db.query(getResidentNameQuery, [userId])
        const first_name = residentNameResult.rows[0]?.first_name || ''
        
        await SMSService.sendActivationSMS({
          mobile_number: mobileNumber,
          username: username,
          first_name: first_name
        })
        
        logger.info(`SMS notification sent for approved account`, {
          userId: userId,
          username: username,
          mobileNumber: mobileNumber
        })
      } catch (smsError) {
        logger.error('Error sending SMS notification for approved account', smsError)
        // Don't fail the request if SMS fails
      }
    }

    logger.info(`Access request approved for user ${username} by ${req.user.username}`, {
      userId: userId,
      approvedBy: req.user.id
    })

    return ApiResponse.success(res, { 
      username: username,
      smsNotificationSent: !!mobileNumber
    }, 'Access request approved and account activated')

  } catch (error) {
    logger.error('Error approving access request', error)
    return ApiResponse.error(res, 'Failed to approve access request', 500)
  }
})

// DELETE /api/admin/users/:id/delete-request - Delete access request (admin only)
router.delete('/admin/users/:id/delete-request', generalLimiter, authenticateToken, requireAdminForDelete, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    if (!userId || isNaN(userId)) {
      return ApiResponse.validationError(res, { id: ['Valid user ID is required'] }, 'Invalid user ID')
    }

    // Get user and resident information before deletion
    const getUserQuery = `
      SELECT 
        u.username, 
        u.attachment_image,
        r.first_name,
        r.last_name
      FROM users u
      LEFT JOIN residents r ON u.id = r.user_id
      WHERE u.id = $1
    `
    
    const userInfo = await db.query(getUserQuery, [userId])
    
    if (userInfo.rows.length === 0) {
      return ApiResponse.error(res, 'User not found', 404)
    }

    const { username, attachment_image, first_name, last_name } = userInfo.rows[0]

    // Delete resident record first (foreign key constraint)
    const deleteResidentQuery = `DELETE FROM residents WHERE user_id = $1`
    await db.query(deleteResidentQuery, [userId])

    // Delete user record
    const deleteUserQuery = `DELETE FROM users WHERE id = $1`
    const deleteResult = await db.query(deleteUserQuery, [userId])

    if (deleteResult.rowCount === 0) {
      return ApiResponse.error(res, 'Failed to delete user', 500)
    }

    // Clean up uploaded file if it exists
    if (attachment_image) {
      try {
        const fileUploadService = new FileUploadService()
        const filePath = path.join(__dirname, '../uploads', attachment_image)
        await fileUploadService.deleteFile(filePath)
        logger.info(`Deleted attachment file: ${attachment_image}`)
      } catch (fileError) {
        logger.error(`Error deleting attachment file: ${attachment_image}`, fileError)
        // Don't fail the request if file deletion fails
      }
    }

    logger.info(`Access request deleted by ${req.user.username}`, {
      deletedUserId: userId,
      deletedUsername: username,
      deletedName: `${first_name} ${last_name}`,
      deletedBy: req.user.id
    })

    return ApiResponse.success(res, { 
      username: username,
      name: `${first_name} ${last_name}`
    }, 'Registration deleted successfully')

  } catch (error) {
    logger.error('Error deleting access request', error)
    return ApiResponse.error(res, 'Failed to delete registration', 500)
  }
})

// GET /api/admin/users/available-for-access - Get available users for granting staff access (admin or staff)
router.get('/admin/users/available-for-access', generalLimiter, authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    
    // Get users with resident role (role=3) who are active (users.is_active=1) and don't already have staff/admin access
    let query = `
      SELECT 
        u.id as user_id,
        u.username,
        u.is_active as user_is_active,
        r.id as resident_id,
        r.first_name,
        r.last_name,
        r.middle_name,
        r.mobile_number,
        r.address,
        r.purok
      FROM users u
      INNER JOIN residents r ON u.id = r.user_id
      WHERE u.role = 3 AND u.is_active = 1
    `
    const params = []

    if (search) {
      query += ` AND (
        LOWER(r.first_name) LIKE LOWER($1) OR 
        LOWER(r.last_name) LIKE LOWER($1) OR
        LOWER(u.username) LIKE LOWER($1)
      )`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY r.last_name, r.first_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(limit), offset)

    const result = await db.query(query, params)
    
    // Count query for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      INNER JOIN residents r ON u.id = r.user_id
      WHERE u.role = 3 AND u.is_active = 1
    `
    const countParams = []
    
    if (search) {
      countQuery += ` AND (
        LOWER(r.first_name) LIKE LOWER($1) OR 
        LOWER(r.last_name) LIKE LOWER($1) OR
        LOWER(u.username) LIKE LOWER($1)
      )`
      countParams.push(`%${search}%`)
    }
    
    const countResult = await db.query(countQuery, countParams)
    
    // Format response data - use user_id as the ID for grant access operations
    const users = result.rows.map(row => ({
      id: row.user_id,        // This is the users.id that grant-access endpoint expects
      user_id: row.user_id,   // Also include as user_id for clarity
      resident_id: row.resident_id,
      username: row.username,
      is_active: row.user_is_active,  // This is users.is_active
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      middle_name: row.middle_name || '',
      mobile_number: row.mobile_number || '',
      address: row.address || '',
      purok: row.purok
    }))

    return ApiResponse.success(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
      }
    }, `Retrieved ${users.length} available users`)

  } catch (error) {
    logger.error('Error getting available users for access', error)
    return ApiResponse.error(res, 'Failed to retrieve available users', 500)
  }
})

// ==========================================================================
// RESIDENT SELF-REGISTRATION ROUTES
// ==========================================================================

// POST /api/auth/register - Resident self-registration (PUBLIC ENDPOINT ONLY)
// NOTE: This endpoint is for PUBLIC self-registration with document upload and approval workflow
// For ADMIN user creation, use POST /api/residents which creates immediately active accounts
router.post('/auth/register', generalLimiter, uploadMiddleware, async (req, res) => {
  try {
    const registrationData = req.body

    // Add console logging for immediate debugging
    console.log('=== PUBLIC REGISTRATION ATTEMPT ===')
    console.log('Has file:', !!req.file)
    console.log('Data keys:', Object.keys(registrationData))
    console.log('Registration data:', registrationData)

    // Add detailed logging for debugging
    logger.info('Registration attempt received', {
      hasFile: !!req.file,
      dataKeys: Object.keys(registrationData),
      username: registrationData.username,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      gender: registrationData.gender,
      purok: registrationData.purok,
      religion: registrationData.religion,
      occupation: registrationData.occupation
    })

    // Validate input
    const validation = Validator.validateResident(registrationData)
    if (!validation.isValid) {
      logger.error('Registration validation failed', {
        errors: validation.errors,
        receivedData: {
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          birthDate: registrationData.birthDate,
          gender: registrationData.gender,
          civilStatus: registrationData.civilStatus,
          address: registrationData.address,
          purok: registrationData.purok,
          mobileNumber: registrationData.mobileNumber,
          religion: registrationData.religion,
          occupation: registrationData.occupation
        }
      })
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
      gender: registrationData.gender || null, // Keep as number, don't sanitize
      civilStatus: Validator.sanitizeInput(registrationData.civilStatus || ''),
      homeNumber: Validator.sanitizeInput(registrationData.homeNumber || ''),
      mobileNumber: Validator.sanitizeInput(registrationData.mobileNumber || ''),
      email: Validator.sanitizeInput(registrationData.email || ''),
      address: Validator.sanitizeInput(registrationData.address || ''),
      purok: registrationData.purok || null,
      religion: Validator.sanitizeInput(registrationData.religion || ''),
      occupation: Validator.sanitizeInput(registrationData.occupation || ''),
      specialCategory: registrationData.specialCategory || null, // Keep as number, don't sanitize
      notes: null // Notes are admin-only, not for public registration
    }

    const username = Validator.sanitizeInput(registrationData.username)
    const pin = registrationData.pin

    // Validate document upload
    if (!req.file) {
      return ApiResponse.validationError(res, {
        documentImage: ['Residency document is required']
      }, 'Document upload is required for registration')
    }

    // Validate uploaded file
    try {
      fileUploadService.validateUploadedFile(req.file)
    } catch (fileError) {
      // Clean up uploaded file if validation fails
      if (req.file && req.file.path) {
        try {
          await fileUploadService.deleteFile(req.file.path)
        } catch (cleanupError) {
          logger.error('Error cleaning up invalid file', cleanupError)
        }
      }
      
      logger.error('File validation failed', {
        error: fileError.message,
        filename: req.file?.filename
      })
      
      return ApiResponse.validationError(res, {
        documentImage: [fileError.message]
      }, 'Invalid document upload')
    }

    // Check if username already exists
    const existingUser = await UserRepository.findByUsername(username)
    if (existingUser) {
      // Clean up uploaded file if username exists
      await fileUploadService.deleteFile(req.file.path)
      return ApiResponse.error(res, 'Username already exists. Please choose a different username.', 409)
    }

    // Hash the PIN
    const hashedPassword = await bcrypt.hash(pin, config.BCRYPT_ROUNDS)

    // Create user account (INACTIVE - public registration requires admin approval)
    const userData = {
      username: username,
      passwordHash: hashedPassword,
      role: 'resident',
      passwordChanged: true, // User chose their own PIN, no need to change
      isActive: 0 // INACTIVE - public registration requires admin approval
    }

    const newUser = await UserRepository.create(userData, req.file.filename)

    // Create resident record (INACTIVE - requires admin approval like user account)
    const residentDataWithUser = {
      ...sanitizedData,
      userId: newUser.id, // Use clean integer ID
      isActive: 0, // INACTIVE - resident record requires admin approval
      selfRegistered: true // Flag to indicate self-registration
    }

    const newResident = await ResidentRepository.create(residentDataWithUser)

    logger.info(`Resident self-registered`, { 
      residentId: newResident.id, 
      userId: newUser.id,
      username: username 
    })

    // Return success with pending approval message
    return ApiResponse.success(res, {
      resident: newResident,
      message: 'Registration successful! Your account is pending approval. We will notify you via SMS once activated.'
    }, 'Registration completed successfully - pending approval', 201)

  } catch (error) {
    logger.error('Error in resident self-registration', error)
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fileUploadService.deleteFile(req.file.path)
      } catch (cleanupError) {
        logger.error('Error cleaning up uploaded file in catch block', cleanupError)
      }
    }
    
    return ApiResponse.error(res, 'Registration failed. Please try again.', 500)
  }
})

// ==========================================================================
// ANNOUNCEMENTS ROUTES
// ==========================================================================

// GET /api/announcements/public - List published announcements (public access, no auth required)
router.get('/announcements/public', generalLimiter, async (req, res) => {
  try {
    // Parse pagination parameters
    const limit = parseInt(req.query.limit) || 20
    const offset = parseInt(req.query.offset) || 0
    
    logger.info('Public announcements request', { limit, offset })
    
    // Get all announcements from database
    const announcements = await AnnouncementRepository.findAll()
    
    // Filter to only published announcements
    const publishedAnnouncements = announcements.filter(announcement => 
      announcement.published_at !== null
    )
    
    // Sort by published_at (newest first)
    publishedAnnouncements.sort((a, b) => {
      const dateA = new Date(a.published_at)
      const dateB = new Date(b.published_at)
      return dateB - dateA
    })
    
    // Apply pagination
    const paginatedAnnouncements = publishedAnnouncements.slice(offset, offset + limit)
    const hasMore = (offset + limit) < publishedAnnouncements.length
    
    logger.info('Public announcements retrieved', { 
      total: publishedAnnouncements.length, 
      returned: paginatedAnnouncements.length,
      hasMore 
    })
    
    return res.json({
      success: true,
      data: {
        announcements: paginatedAnnouncements,
        pagination: {
          limit,
          offset,
          total: publishedAnnouncements.length,
          hasMore
        }
      }
    })
  } catch (error) {
    logger.error('Error fetching public announcements:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch announcements'
    })
  }
})

// GET /api/announcements - List announcements (filtered by user role/targeting)
router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    // Parse pagination parameters
    const limit = parseInt(req.query.limit) || 20 // Default to 20 if not specified
    const offset = parseInt(req.query.offset) || 0 // Default to 0 if not specified
    
    // Get announcements from database
    const announcements = await AnnouncementRepository.findAll()
    
    // Filter announcements based on user role
    let filteredAnnouncements = announcements
    
    // For residents, only show published announcements
    if (req.user.role === 3) { // Resident role
      filteredAnnouncements = announcements.filter(announcement => 
        announcement.published_at !== null
      )
    }
    
    // Sort by published_at (newest first) for proper pagination
    filteredAnnouncements.sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at)
      const dateB = new Date(b.published_at || b.created_at)
      return dateB - dateA
    })
    
    // Apply pagination
    const totalCount = filteredAnnouncements.length
    const paginatedAnnouncements = filteredAnnouncements.slice(offset, offset + limit)
    
    // Transform database format to API format
    const transformedAnnouncements = paginatedAnnouncements.map(announcement => ({
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

    // Return appropriate format based on whether pagination is requested
    if (req.query.limit || req.query.offset) {
      // Paginated response for residents
      return ApiResponse.success(res, {
        announcements: transformedAnnouncements,
        pagination: {
          total: totalCount,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < totalCount
        }
      }, 'Announcements retrieved successfully')
    } else {
      // Simple array response for admin (backward compatibility)
      return ApiResponse.success(res, filteredAnnouncements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        is_urgent: announcement.type === 5, // Advisory type
        status: announcement.published_at ? 'published' : 'draft',
        target_groups: announcement.target_groups || ['all'],
        sms_target_groups: announcement.sms_target_groups || [],
        created_by: announcement.created_by,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
        published_by: announcement.published_by,
        published_at: announcement.published_at
      })), 'Announcements retrieved successfully')
    }
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

// POST /api/announcements - Create new announcement (Admin or Staff)
router.post('/announcements', authenticateToken, requireStaffOrAdmin, async (req, res) => {
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

    // Validate content length (800 character limit)
    const contentValidation = Validator.validateContent(content, 30, 800)
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

// PUT /api/announcements/:id - Update announcement (Admin or Staff)
router.put('/announcements/:id', authenticateToken, requireStaffOrAdmin, async (req, res) => {
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

    // Validate content length (800 character limit)
    const contentValidation = Validator.validateContent(content, 30, 800)
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
router.delete('/announcements/:id', authenticateToken, requireAdminForDelete, async (req, res) => {
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
router.get('/announcements/:id/sms-status', authenticateToken, requireStaffOrAdmin, async (req, res) => {
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
        provider_response,
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
    
    // Calculate unique phone numbers from provider_response
    let uniquePhoneCount = 0
    if (smsLog.provider_response && Array.isArray(smsLog.provider_response)) {
      uniquePhoneCount = smsLog.provider_response.length
    }
    
    return ApiResponse.success(res, {
      total_recipients: smsLog.total_recipients || 0,
      successful_sends: smsLog.successful_sends || 0,
      failed_sends: smsLog.failed_sends || 0,
      unique_phone_count: uniquePhoneCount,
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

// ==========================================================================
// PDF GENERATION ROUTES
// ==========================================================================

// POST /api/documents/generate - Generate filled DOCX document
router.post('/documents/generate', authenticateToken, requireStaffOrAdmin, documentController.generatePDF)

// GET /api/documents/templates - Get available templates
router.get('/documents/templates', authenticateToken, documentController.getAvailableTemplates)

// GET /api/documents/download-template/:documentType - Download DOCX template file
router.get('/documents/download-template/:documentType', authenticateToken, documentController.downloadTemplate)

// ==========================================================================
// DOCUMENT REQUESTS ROUTES
// ==========================================================================

// GET /api/document-catalog - Get documents from catalog (active by default, or all if active_only=false)
router.get('/document-catalog', authenticateToken, async (req, res) => {
  try {
    const activeOnly = req.query.active_only !== 'false' // Default to true unless explicitly set to false
    
    const catalog = activeOnly 
      ? await DocumentRequestRepository.getActiveCatalog()
      : await DocumentRequestRepository.getAllCatalog()
    
    return ApiResponse.success(res, catalog, 'Document catalog retrieved successfully')
  } catch (error) {
    logger.error('Error fetching document catalog:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document catalog')
  }
})

// POST /api/document-requests/search - Get document requests with filters (role-based access)
router.post('/document-requests/search', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user
    const userId = req.user.userId || req.user.id  // Handle both token formats
    const { 
      status, 
      document_type, 
      search, 
      date_range, 
      page = 1, 
      limit = 25,
      sort_field = 'created_at',
      sort_direction = 'desc'
    } = req.body
    
    // For residents (role 3), filter by user_id directly (not resident_id)
    let filterUserId = null
    if (role === 3) {
      filterUserId = userId
      logger.info('Document search for resident', { userId, role })
    }
    
    // Prepare filters for repository
    const filters = {
      status,
      document_type,
      search,
      date_range,
      role: role,
      userId: filterUserId  // Use user_id for residents (direct filtering)
    }
    
    // Prepare pagination
    const pagination = {
      page: Math.max(1, parseInt(page)),
      limit: Math.min(Math.max(1, parseInt(limit)), 100) // Max 100 items per page
    }
    
    // Prepare sorting
    const sorting = {
      field: sort_field,
      direction: sort_direction
    }
    
    // Use repository method
    const result = await DocumentRequestRepository.searchRequests(filters, pagination, sorting)
    
    return ApiResponse.success(res, result, 'Document requests retrieved successfully')

  } catch (error) {
    logger.error('Error fetching document requests:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document requests')
  }
})

// GET /api/document-requests - Simple GET for basic listing (deprecated - use POST /search)
router.get('/document-requests', authenticateToken, async (req, res) => {
  try {
    // Redirect to POST search for better performance
    return ApiResponse.success(res, { 
      message: 'Please use POST /api/document-requests/search for better performance and filtering options',
      endpoint: '/api/document-requests/search'
    }, 'Use POST search endpoint for document requests')
  } catch (error) {
    logger.error('Error in GET document requests:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document requests')
  }
})

// POST /api/document-requests - Create new document request (residents only)
router.post('/document-requests', authenticateToken, requireResident, async (req, res) => {
  try {
    // Handle both legacy (id) and new (userId) token structures
    const userId = req.user.userId || req.user.id
    const { document_id, purpose, notes, details } = req.body

    // Validate user ID
    if (!userId) {
      logger.error('No user ID found in token', { user: req.user })
      return ApiResponse.error(res, 'Authentication error: user ID not found', 401)
    }

    // Validate required fields
    if (!document_id || !purpose) {
      return ApiResponse.error(res, 'Document ID and purpose are required', 400)
    }

    // Convert document_id to integer and validate
    const documentId = parseInt(document_id)
    if (isNaN(documentId) || documentId <= 0) {
      return ApiResponse.error(res, 'Invalid document ID', 400)
    }

    // Validate purpose field
    const sanitizedPurpose = Validator.sanitizeInput(purpose)
    if (!sanitizedPurpose) {
      return ApiResponse.error(res, 'Purpose is required and must contain valid characters', 400)
    }

    // Validate notes field (alphanumeric only)
    const notesValidation = Validator.validateAlphanumericNotes(notes)
    if (!notesValidation.isValid) {
      return ApiResponse.error(res, notesValidation.errors.join(', '), 400)
    }
    const sanitizedNotes = notes ? Validator.sanitizeInput(notes) : null

    // Validate and sanitize details field (simple approach)
    let sanitizedDetails = null
    if (details) {
      // Clean and validate details
      const sanitizationResult = DocumentDetails.sanitizeDetails(details)
      
      // Check for validation errors
      if (sanitizationResult.validationErrors.length > 0) {
        return ApiResponse.error(res, sanitizationResult.validationErrors.join(', '), 400)
      }
      
      sanitizedDetails = sanitizationResult.cleaned
    }

    // Get resident_id from user_id (residents table has user_id that links to users table)
    const resident = await ResidentRepository.findByUserId(userId)
    if (!resident) {
      logger.error('No resident found for user', { userId })
      return ApiResponse.error(res, 'Resident profile not found. Please contact the barangay office.', 404)
    }
    const residentId = resident.id

    // Check if document exists and is active (use repository method)
    const isDocumentActive = await DocumentRequestRepository.isDocumentActive(documentId)
    if (!isDocumentActive) {
      return ApiResponse.error(res, 'Invalid document type or document not available', 400)
    }

    // Get document type for details validation
    const documentInfo = await DocumentRequestRepository.getDocumentById(documentId)
    if (!documentInfo) {
      return ApiResponse.error(res, 'Document type not found', 404)
    }

    // Validate details specific to document type
    if (sanitizedDetails) {
      const detailsValidation = DocumentDetails.validateDetails(documentInfo.title, sanitizedDetails)
      if (!detailsValidation.isValid) {
        return ApiResponse.error(res, detailsValidation.errors.join(', '), 400)
      }
    }

    // Check if user has pending/processing request for same document type (use repository method)
    const hasExistingRequest = await DocumentRequestRepository.hasExistingRequest(userId, documentId)
    if (hasExistingRequest) {
      return ApiResponse.error(res, 'You already have a pending or processing request for this document type. Please wait for it to be completed before submitting a new request.', 400)
    }

    // Create new request using repository (using user_id)
    const newRequest = await DocumentRequestRepository.createRequest(
      userId, 
      documentId, 
      sanitizedPurpose, 
      sanitizedNotes,
      sanitizedDetails
    )

    // Log the request creation using repository (use integer status: 0 = pending)
    await DocumentRequestRepository.logAction(
      newRequest.id, 
      'Request created by resident', 
      null, 
      0,  // pending status as integer
      parseInt(userId)
    )

    logger.info(`Document request created: ID ${newRequest.id} by resident_id ${residentId} (user_id ${userId})`)

    return ApiResponse.success(res, {
      id: newRequest.id,
      status: 'pending',
      created_at: newRequest.created_at
    }, 'Document request submitted successfully')

  } catch (error) {
    logger.error('Error creating document request:', error)
    return ApiResponse.serverError(res, 'Failed to submit document request')
  }
})

// GET /api/document-requests/:id - Get specific document request details
router.get('/document-requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { role, userId } = req.user

    // For residents, ensure they can only see their own requests
    const residentId = role === USER_ROLES.RESIDENT ? userId : null

    // Get request details using repository
    const request = await DocumentRequestRepository.getRequestById(id, residentId)
    
    if (!request) {
      return ApiResponse.notFound(res, 'Document request not found')
    }

    // Get request timeline using repository
    const timeline = await DocumentRequestRepository.getRequestTimeline(id)

    return ApiResponse.success(res, {
      request: request,
      timeline: timeline
    }, 'Document request details retrieved successfully')

  } catch (error) {
    logger.error('Error fetching document request details:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document request details')
  }
})

// PUT /api/document-requests/:id/status - Update document request status (admin/staff only)
router.put('/document-requests/:id/status', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status, remarks } = req.body
    const { userId } = req.user

    // Validate status
    const validStatuses = ['processing', 'rejected', 'ready', 'claimed', 'completed']
    if (!validStatuses.includes(status)) {
      return ApiResponse.error(res, 'Invalid status', 400)
    }

    // If rejecting, remarks are required
    if (status === 'rejected' && !remarks?.trim()) {
      return ApiResponse.error(res, 'Remarks are required when rejecting a request', 400)
    }

    // Validate remarks length (max 255 characters)
    if (remarks && remarks.trim().length > 255) {
      return ApiResponse.error(res, 'Remarks cannot exceed 255 characters', 400)
    }

    // Map string status to numeric status for repository
    const statusMap = {
      'processing': 1,
      'rejected': 2,
      'ready': 3,
      'claimed': 4,
      'completed': 4 // Alias for claimed (status 4)
    }

    const statusValue = statusMap[status]

    // Get current status before updating (for logging)
    const currentRequest = await DocumentRequestRepository.getRequestById(id)
    if (!currentRequest) {
      return ApiResponse.notFound(res, 'Document request not found')
    }
    
    // Map old status text to numeric value
    const oldStatusText = currentRequest.status_text
    const reverseStatusMap = {
      'pending': 0,
      'processing': 1,
      'rejected': 2,
      'ready': 3,
      'claimed': 4,
      'completed': 4 // Alias for claimed
    }
    const oldStatusValue = reverseStatusMap[oldStatusText] || 0

    // Use repository method to update status
    const result = await DocumentRequestRepository.updateStatus(
      id, 
      statusValue, 
      userId, 
      remarks?.trim() || null
    )

    if (!result) {
      return ApiResponse.notFound(res, 'Document request not found or invalid status transition')
    }

    // Log the action to document_requests_logs
    const actionMap = {
      'processing': 'Marked as processing',
      'rejected': 'Request rejected',
      'ready': 'Marked as ready for pickup',
      'claimed': 'Marked as completed',
      'completed': 'Marked as completed'
    }

    await DocumentRequestRepository.logAction(
      id,
      actionMap[status],
      oldStatusValue,  // Use numeric value instead of string
      statusValue,     // Use numeric value instead of string
      userId
    )

    logger.info(`Document request ${id} status updated to ${status} by user ${userId}`)

    return ApiResponse.success(res, {
      id: result.id,
      status: status,
      processed_at: result.processed_at
    }, `Document request ${status} successfully`)

  } catch (error) {
    logger.error('Error updating document request status:', error)
    return ApiResponse.serverError(res, 'Failed to update document request status')
  }
})

// POST /api/document-requests/bulk-update - Bulk update multiple document requests (admin/staff only)
router.post('/document-requests/bulk-update', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { updates } = req.body
    const { userId } = req.user

    if (!Array.isArray(updates) || updates.length === 0) {
      return ApiResponse.error(res, 'Updates array is required and cannot be empty', 400)
    }

    if (updates.length > 50) {
      return ApiResponse.error(res, 'Maximum 50 updates allowed per request', 400)
    }

    const results = []
    const errors = []

    // Process updates in a transaction for data consistency
    await db.query('BEGIN')

    try {
      for (const update of updates) {
        const { id, status, remarks } = update

        if (!id || !status) {
          errors.push({ id, error: 'ID and status are required' })
          continue
        }

        // Validate status
        const validStatuses = ['processing', 'rejected', 'ready', 'claimed', 'completed']
        if (!validStatuses.includes(status)) {
          errors.push({ id, error: 'Invalid status' })
          continue
        }

        const statusMap = {
          'processing': 1,
          'rejected': 2,
          'ready': 3,
          'claimed': 4,
          'completed': 4 // Alias for claimed (status 4)
        }

        const statusValue = statusMap[status]

        // If rejecting, remarks are required
        if (status === 'rejected' && !remarks?.trim()) {
          errors.push({ id, error: 'Remarks are required when rejecting a request' })
          continue
        }

        // Validate remarks length (max 255 characters)
        if (remarks && remarks.trim().length > 255) {
          errors.push({ id, error: 'Remarks cannot exceed 255 characters' })
          continue
        }

        // Check if request exists and validate transition
        const requestCheck = await db.query(
          'SELECT id, status FROM document_requests WHERE id = $1',
          [id]
        )

        if (requestCheck.rows.length === 0) {
          errors.push({ id, error: 'Document request not found' })
          continue
        }

        const currentStatus = requestCheck.rows[0].status

        // Validate status transitions
        const validTransitions = {
          0: [1, 2], // pending -> processing, rejected
          1: [2, 3], // processing -> rejected, ready
          3: [4]     // ready -> claimed
        }

        if (!validTransitions[currentStatus]?.includes(statusValue)) {
          errors.push({ id, error: 'Invalid status transition' })
          continue
        }

        // Update request status
        await db.query(`
          UPDATE document_requests 
          SET status = $1, processed_by = $2, processed_at = CURRENT_TIMESTAMP, 
              remarks = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [statusValue, userId, remarks?.trim() || null, id])

        // Log the status change
        const actionMap = {
          'processing': 'Marked as processing',
          'rejected': 'Request rejected',
          'ready': 'Marked as ready for pickup',
          'claimed': 'Marked as claimed'
        }

        await db.query(`
          INSERT INTO document_requests_logs (
            request_id, action, old_status, new_status, action_by, created_at
          ) VALUES ($1, 'status_changed', $2, $3, $4, CURRENT_TIMESTAMP)
        `, [id, currentStatus, statusValue, userId])

        results.push({
          id: parseInt(id),
          status,
          success: true
        })
      }

      await db.query('COMMIT')

      logger.info(`Bulk update completed: ${results.length} successful, ${errors.length} errors by user ${userId}`)

      return ApiResponse.success(res, {
        successful: results,
        errors: errors,
        total_processed: updates.length,
        successful_count: results.length,
        error_count: errors.length
      }, `Bulk update completed: ${results.length} successful, ${errors.length} errors`)

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    logger.error('Error in bulk update document requests:', error)
    return ApiResponse.serverError(res, 'Failed to perform bulk update')
  }
})

// POST /api/document-requests/stats - Get document requests statistics with advanced filtering (admin/staff only)
router.post('/document-requests/stats', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { 
      date_range = '7days', 
      document_type = null,
      group_by = null,
      include_trends = false 
    } = req.body

    // Calculate date filter
    const now = new Date()
    let dateFilter
    if (date_range === '7days') {
      dateFilter = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
    } else if (date_range === '30days') {
      dateFilter = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    } else if (date_range === '90days') {
      dateFilter = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
    } else {
      // For 'all', use a very old date
      dateFilter = new Date('2020-01-01')
    }

    let whereConditions = ['dr.created_at >= $1']
    let queryParams = [dateFilter]
    let paramIndex = 2

    // Document type filtering
    if (document_type && document_type !== 'all') {
      whereConditions.push(`dc.title ILIKE $${paramIndex}`)
      queryParams.push(`%${document_type}%`)
      paramIndex++
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`

    // Basic statistics query
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE dr.status = 0) as pending,
        COUNT(*) FILTER (WHERE dr.status = 1) as processing,
        COUNT(*) FILTER (WHERE dr.status = 2) as rejected,
        COUNT(*) FILTER (WHERE dr.status = 3) as ready,
        COUNT(*) FILTER (WHERE dr.status = 4) as claimed,
        COUNT(*) as total,
        AVG(EXTRACT(EPOCH FROM (dr.processed_at - dr.created_at))/3600) FILTER (WHERE dr.processed_at IS NOT NULL) as avg_processing_hours,
        COUNT(*) FILTER (WHERE dr.created_at >= $${paramIndex}) as today_total
      FROM document_requests dr
      JOIN document_catalog dc ON dr.document_id = dc.id
      ${whereClause}
    `

    // Add today's date for today's stats
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    queryParams.push(todayStart)

    const result = await db.query(statsQuery, queryParams)
    const stats = result.rows[0]

    // Convert string numbers to integers and format avg_processing_hours
    Object.keys(stats).forEach(key => {
      if (key === 'avg_processing_hours') {
        stats[key] = parseFloat(stats[key]) || 0
      } else {
        stats[key] = parseInt(stats[key]) || 0
      }
    })

    let responseData = { basic: stats }

    // Group by statistics if requested
    if (group_by) {
      let groupQuery
      let groupParams = queryParams.slice(0, -1) // Remove today parameter

      if (group_by === 'document_type') {
        groupQuery = `
          SELECT 
            dc.title as label,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE dr.status = 0) as pending,
            COUNT(*) FILTER (WHERE dr.status = 1) as processing,
            COUNT(*) FILTER (WHERE dr.status = 2) as rejected,
            COUNT(*) FILTER (WHERE dr.status = 3) as ready,
            COUNT(*) FILTER (WHERE dr.status = 4) as claimed
          FROM document_requests dr
          JOIN document_catalog dc ON dr.document_id = dc.id
          ${whereClause}
          GROUP BY dc.title
          ORDER BY total DESC
        `
      } else if (group_by === 'status') {
        groupQuery = `
          SELECT 
            CASE 
              WHEN dr.status = 0 THEN 'pending'
              WHEN dr.status = 1 THEN 'processing'
              WHEN dr.status = 2 THEN 'rejected'
              WHEN dr.status = 3 THEN 'ready'
              WHEN dr.status = 4 THEN 'claimed'
              ELSE 'unknown'
            END as label,
            COUNT(*) as total
          FROM document_requests dr
          JOIN document_catalog dc ON dr.document_id = dc.id
          ${whereClause}
          GROUP BY dr.status
          ORDER BY dr.status
        `
      } else if (group_by === 'daily' && date_range !== 'all') {
        groupQuery = `
          SELECT 
            DATE(dr.created_at) as label,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE dr.status = 0) as pending,
            COUNT(*) FILTER (WHERE dr.status = 1) as processing,
            COUNT(*) FILTER (WHERE dr.status = 2) as rejected,
            COUNT(*) FILTER (WHERE dr.status = 3) as ready,
            COUNT(*) FILTER (WHERE dr.status = 4) as claimed
          FROM document_requests dr
          JOIN document_catalog dc ON dr.document_id = dc.id
          ${whereClause}
          GROUP BY DATE(dr.created_at)
          ORDER BY DATE(dr.created_at) DESC
          LIMIT 30
        `
      }

      if (groupQuery) {
        const groupResult = await db.query(groupQuery, groupParams)
        responseData.grouped = groupResult.rows
      }
    }

    // Trends data if requested
    if (include_trends && date_range !== 'all') {
      const trendsQuery = `
        SELECT 
          DATE(dr.created_at) as date,
          COUNT(*) as requests,
          COUNT(*) FILTER (WHERE dr.status = 4) as completed
        FROM document_requests dr
        JOIN document_catalog dc ON dr.document_id = dc.id
        ${whereClause}
        GROUP BY DATE(dr.created_at)
        ORDER BY DATE(dr.created_at) ASC
      `
      
      const trendsResult = await db.query(trendsQuery, queryParams.slice(0, -1))
      responseData.trends = trendsResult.rows
    }

    return ApiResponse.success(res, responseData, 'Document request statistics retrieved successfully')

  } catch (error) {
    logger.error('Error fetching document request statistics:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document request statistics')
  }
})

// GET /api/document-requests/stats - Simple GET for basic stats (deprecated - use POST)
router.get('/document-requests/stats', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    // Redirect to POST stats for better performance
    return ApiResponse.success(res, { 
      message: 'Please use POST /api/document-requests/stats for better performance and advanced filtering options',
      endpoint: '/api/document-requests/stats'
    }, 'Use POST stats endpoint for document request statistics')
  } catch (error) {
    logger.error('Error in GET document request stats:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document request statistics')
  }
})

// GET /api/document-requests/pending - Get pending requests for processing (admin/staff only)
router.get('/document-requests/pending', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, priority = 'oldest' } = req.query

    // Build ORDER BY clause based on priority
    let orderBy = 'dr.created_at ASC' // Default: oldest first
    if (priority === 'newest') {
      orderBy = 'dr.created_at DESC'
    } else if (priority === 'urgent') {
      // Urgent: older than 3 days, then by creation date
      orderBy = `
        CASE 
          WHEN dr.created_at < NOW() - INTERVAL '3 days' THEN 0 
          ELSE 1 
        END ASC, dr.created_at ASC
      `
    }

    const query = `
      SELECT 
        dr.id,
        dr.user_id,
        dr.document_id,
        dr.purpose,
        dr.remarks,
        dr.status,
        dr.created_at,
        dr.notes,
        CONCAT(r.first_name, ' ', r.last_name) as resident_name,
        r.mobile_number,
        r.email,
        dc.title as document_title,
        dc.fee,
        dc.description as document_description,
        EXTRACT(DAYS FROM NOW() - dr.created_at) as days_pending,
        CASE 
          WHEN dr.created_at < NOW() - INTERVAL '3 days' THEN true 
          ELSE false 
        END as is_urgent
      FROM document_requests dr
      JOIN residents r ON dr.user_id = r.user_id
      JOIN document_catalog dc ON dr.document_id = dc.id
      WHERE dr.status = 0
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM document_requests dr
      WHERE dr.status = 0
    `

    const [pendingResult, countResult] = await Promise.all([
      db.query(query, [limit, offset]),
      db.query(countQuery)
    ])

    const pending = pendingResult.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      resident_id: parseInt(row.resident_id),
      document_id: parseInt(row.document_id),
      status: parseInt(row.status),
      fee: parseFloat(row.fee || 0),
      days_pending: parseInt(row.days_pending || 0),
      is_urgent: row.is_urgent || false
    }))

    const total = parseInt(countResult.rows[0].total)

    logger.info(`Retrieved ${pending.length} pending document requests`)

    return ApiResponse.success(res, {
      pending,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      has_more: (parseInt(offset) + pending.length) < total
    }, 'Pending document requests retrieved successfully')

  } catch (error) {
    logger.error('Error retrieving pending document requests:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve pending document requests')
  }
})

// POST /api/document-requests/process - Process single pending request (admin/staff only)
router.post('/document-requests/process', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { id, action, remarks } = req.body
    const { userId } = req.user

    // Validate required fields
    if (!id || !action) {
      return ApiResponse.error(res, 'Request ID and action are required', 400)
    }

    // Validate action
    const validActions = ['process', 'reject', 'ready']
    if (!validActions.includes(action)) {
      return ApiResponse.error(res, 'Invalid action. Must be: process, reject, or ready', 400)
    }

    // Map actions to status values
    const actionStatusMap = {
      'process': 1,   // processing
      'reject': 2,    // rejected
      'ready': 3      // ready for pickup
    }

    const newStatus = actionStatusMap[action]

    // If rejecting, remarks are required
    if (action === 'reject' && !remarks?.trim()) {
      return ApiResponse.error(res, 'Remarks are required when rejecting a request', 400)
    }

    // Validate remarks length (max 255 characters)
    if (remarks && remarks.trim().length > 255) {
      return ApiResponse.error(res, 'Remarks cannot exceed 255 characters', 400)
    }

    // Check if request exists and is pending
    const requestCheck = await db.query(
      'SELECT id, status, resident_id FROM document_requests WHERE id = $1',
      [id]
    )

    if (requestCheck.rows.length === 0) {
      return ApiResponse.notFound(res, 'Document request not found')
    }

    const currentStatus = requestCheck.rows[0].status
    if (currentStatus !== 0) {
      return ApiResponse.error(res, 'Only pending requests can be processed', 400)
    }

    // Begin transaction
    await db.query('BEGIN')

    try {
      // Update request status
      await db.query(`
        UPDATE document_requests 
        SET 
          status = $1, 
          processed_by = $2, 
          processed_at = CURRENT_TIMESTAMP,
          remarks = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [newStatus, userId, remarks?.trim() || null, id])

      // Log the status change
      const actionMessages = {
        'process': 'Marked as processing',
        'reject': 'Request rejected',
        'ready': 'Marked as ready for pickup'
      }

      await db.query(`
        INSERT INTO document_requests_logs (
          request_id, action, old_status, new_status, action_by, created_at
        ) VALUES ($1, 'status_changed', 0, $2, $3, CURRENT_TIMESTAMP)
      `, [id, newStatus, userId])

      await db.query('COMMIT')

      const actionStatusText = {
        'process': 'processing',
        'reject': 'rejected', 
        'ready': 'ready'
      }

      logger.info(`Document request ${id} ${actionMessages[action].toLowerCase()} by user ${userId}`)

      return ApiResponse.success(res, {
        id: parseInt(id),
        status: actionStatusText[action],
        processed_by: userId,
        processed_at: new Date(),
        remarks: remarks?.trim() || null
      }, actionMessages[action])

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    logger.error('Error processing document request:', error)
    return ApiResponse.serverError(res, 'Failed to process document request')
  }
})

// POST /api/document-requests/batch-process - Process multiple pending requests (admin/staff only)
router.post('/document-requests/batch-process', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const { requests, default_action, default_remarks } = req.body
    const { userId } = req.user

    if (!Array.isArray(requests) || requests.length === 0) {
      return ApiResponse.error(res, 'Requests array is required and cannot be empty', 400)
    }

    if (requests.length > 20) {
      return ApiResponse.error(res, 'Maximum 20 requests allowed per batch', 400)
    }

    const validActions = ['process', 'reject', 'ready']
    if (default_action && !validActions.includes(default_action)) {
      return ApiResponse.error(res, 'Invalid default_action. Must be: process, reject, or ready', 400)
    }

    const results = []
    const errors = []

    // Begin transaction
    await db.query('BEGIN')

    try {
      for (const request of requests) {
        const { id, action, remarks } = request
        const finalAction = action || default_action
        const finalRemarks = remarks || default_remarks

        if (!id || !finalAction) {
          errors.push({ id, error: 'ID and action are required' })
          continue
        }

        if (!validActions.includes(finalAction)) {
          errors.push({ id, error: 'Invalid action' })
          continue
        }

        // Map action to status
        const actionStatusMap = {
          'process': 1,
          'reject': 2,
          'ready': 3
        }

        const newStatus = actionStatusMap[finalAction]

        // If rejecting, remarks are required
        if (finalAction === 'reject' && !finalRemarks?.trim()) {
          errors.push({ id, error: 'Remarks are required when rejecting a request' })
          continue
        }

        // Validate remarks length (max 255 characters)
        if (finalRemarks && finalRemarks.trim().length > 255) {
          errors.push({ id, error: 'Remarks cannot exceed 255 characters' })
          continue
        }

        // Check if request exists and is pending
        const requestCheck = await db.query(
          'SELECT id, status FROM document_requests WHERE id = $1',
          [id]
        )

        if (requestCheck.rows.length === 0) {
          errors.push({ id, error: 'Document request not found' })
          continue
        }

        if (requestCheck.rows[0].status !== 0) {
          errors.push({ id, error: 'Only pending requests can be processed' })
          continue
        }

        // Update request status
        await db.query(`
          UPDATE document_requests 
          SET 
            status = $1, 
            processed_by = $2, 
            processed_at = CURRENT_TIMESTAMP,
            remarks = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [newStatus, userId, finalRemarks?.trim() || null, id])

        // Log the status change
        await db.query(`
          INSERT INTO document_requests_logs (
            request_id, action, old_status, new_status, action_by, created_at
          ) VALUES ($1, 'status_changed', 0, $2, $3, CURRENT_TIMESTAMP)
        `, [id, newStatus, userId])

        const actionStatusText = {
          'process': 'processing',
          'reject': 'rejected',
          'ready': 'ready'
        }

        results.push({
          id: parseInt(id),
          status: actionStatusText[finalAction],
          action: finalAction,
          success: true
        })
      }

      await db.query('COMMIT')

      logger.info(`Batch processing completed: ${results.length} successful, ${errors.length} errors by user ${userId}`)

      return ApiResponse.success(res, {
        successful: results,
        errors: errors,
        total_processed: requests.length,
        successful_count: results.length,
        error_count: errors.length
      }, `Batch processing completed: ${results.length} successful, ${errors.length} errors`)

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    logger.error('Error in batch processing document requests:', error)
    return ApiResponse.serverError(res, 'Failed to perform batch processing')
  }
})

// GET /api/document-requests/processing-queue - Get processing queue summary (admin/staff only)
router.get('/document-requests/processing-queue', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN status = 0 THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 1 THEN 1 END) as processing_count,
        COUNT(CASE WHEN status = 3 THEN 1 END) as ready_count,
        COUNT(CASE WHEN status = 0 AND created_at < NOW() - INTERVAL '3 days' THEN 1 END) as urgent_count,
        COUNT(CASE WHEN status = 0 AND created_at::date = CURRENT_DATE THEN 1 END) as today_submissions,
        AVG(EXTRACT(DAYS FROM NOW() - created_at)) FILTER (WHERE status = 0) as avg_pending_days,
        MIN(created_at) FILTER (WHERE status = 0) as oldest_pending,
        COUNT(CASE WHEN status = 2 AND processed_at::date = CURRENT_DATE THEN 1 END) as today_rejections,
        COUNT(CASE WHEN status = 3 AND processed_at::date = CURRENT_DATE THEN 1 END) as today_ready
      FROM document_requests
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `

    const result = await db.query(query)
    const stats = result.rows[0]

    // Format the response
    const queueSummary = {
      pending_count: parseInt(stats.pending_count || 0),
      processing_count: parseInt(stats.processing_count || 0),
      ready_count: parseInt(stats.ready_count || 0),
      urgent_count: parseInt(stats.urgent_count || 0),
      today_submissions: parseInt(stats.today_submissions || 0),
      today_rejections: parseInt(stats.today_rejections || 0),
      today_ready: parseInt(stats.today_ready || 0),
      avg_pending_days: parseFloat(stats.avg_pending_days || 0).toFixed(1),
      oldest_pending: stats.oldest_pending
    }

    logger.info('Processing queue summary retrieved')

    return ApiResponse.success(res, queueSummary, 'Processing queue summary retrieved successfully')

  } catch (error) {
    logger.error('Error retrieving processing queue summary:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve processing queue summary')
  }
})

// ==========================================================================
// CHATBOT ROUTES
// ==========================================================================

const ChatbotController = require('./controllers/chatbotController')

// GET /api/chatbot/document-fees - Get current document fees (public)
router.get('/chatbot/document-fees', generalLimiter, async (req, res) => {
  try {
    const { document } = req.query
    
    if (document) {
      // Get specific document fee
      const docInfo = await ChatbotRepository.getDocumentFee(document)
      if (docInfo) {
        const feeText = parseFloat(docInfo.fee) === 0 ? 'FREE' : `₱${parseFloat(docInfo.fee).toFixed(2)}`
        return ApiResponse.success(res, {
          document: docInfo.title,
          fee: feeText,
          amount: parseFloat(docInfo.fee)
        }, 'Document fee retrieved successfully')
      } else {
        return ApiResponse.notFound(res, 'Document not found')
      }
    } else {
      // Get all document fees
      const feesList = await ChatbotRepository.getFormattedFeesList()
      return ApiResponse.success(res, feesList, 'All document fees retrieved successfully')
    }
  } catch (error) {
    logger.error('Error getting document fees for chatbot:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document fees')
  }
})

// GET /api/chatbot/document-catalog - Get formatted document catalog (public)
router.get('/chatbot/document-catalog', generalLimiter, async (req, res) => {
  try {
    const documentList = await ChatbotRepository.getFormattedDocumentList()
    return ApiResponse.success(res, documentList, 'Document catalog retrieved successfully')
  } catch (error) {
    logger.error('Error getting document catalog for chatbot:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve document catalog')
  }
})

// GET /api/chatbot/permits - Get formatted permits list (public)
router.get('/chatbot/permits', generalLimiter, async (req, res) => {
  try {
    const permitList = await ChatbotRepository.getFormattedPermitList()
    return ApiResponse.success(res, permitList, 'Permits list retrieved successfully')
  } catch (error) {
    logger.error('Error getting permits list for chatbot:', error)
    return ApiResponse.serverError(res, 'Failed to retrieve permits list')
  }
})

// GET /api/chatbot/test-dynamic - Test dynamic data processing (public)
router.get('/chatbot/test-dynamic', generalLimiter, async (req, res) => {
  try {
    const testAnswer = `Test dynamic processing:

**Document Catalog:**
{{DOCUMENT_CATALOG_LIST}}

**Barangay Clearance Fee:** {{BARANGAY_CLEARANCE_FEE}}

**All Fees:**
{{DOCUMENT_FEES_LIST}}

**Permits:**
{{PERMIT_CATALOG_LIST}}`

    const processedAnswer = await ChatbotRepository.processDynamicAnswer(testAnswer)
    return ApiResponse.success(res, {
      original: testAnswer,
      processed: processedAnswer
    }, 'Dynamic processing test completed')
  } catch (error) {
    logger.error('Error testing dynamic processing:', error)
    return ApiResponse.serverError(res, 'Failed to test dynamic processing')
  }
})

// GET /api/chatbot/categories - Get FAQ categories (public)
router.get('/chatbot/categories', generalLimiter, ChatbotController.getCategories)

// GET /api/chatbot/faqs - Get FAQs (public, optional categoryId filter)
router.get('/chatbot/faqs', generalLimiter, ChatbotController.getFAQs)

// GET /api/chatbot/faqs/:id - Get specific FAQ (public)
router.get('/chatbot/faqs/:id', generalLimiter, ChatbotController.getFAQById)

// GET /api/chatbot/search - Search FAQs (public)
router.get('/chatbot/search', generalLimiter, ChatbotController.searchFAQs)

// POST /api/chatbot/query - Process chatbot query (public/authenticated)
router.post('/chatbot/query', generalLimiter, ChatbotController.processQuery)

// POST /api/chatbot/faqs/:id/feedback - Submit FAQ feedback (public)
router.post('/chatbot/faqs/:id/feedback', generalLimiter, ChatbotController.submitFAQFeedback)

// GET /api/chatbot/conversations/:sessionId - Get conversation history (public/authenticated)
router.get('/chatbot/conversations/:sessionId', generalLimiter, ChatbotController.getConversationHistory)

// POST /api/chatbot/conversations/:sessionId/end - End conversation (public/authenticated)
router.post('/chatbot/conversations/:sessionId/end', generalLimiter, ChatbotController.endConversation)

// GET /api/chatbot/ai-status - Get AI service status (admin and staff)
router.get('/chatbot/ai-status', generalLimiter, authenticateToken, requireStaffOrAdmin, ChatbotController.getAIStatus)

module.exports = router
