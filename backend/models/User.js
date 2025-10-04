/**
 * User Model
 * Handles user business logic and validation
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config/config')
const logger = require('../config/logger')

class User {
  constructor(data) {
    this.id = data.id
    this.username = data.username
    this.role = data.role
    this.passwordChanged = data.passwordChanged
    this.failedLoginAttempts = data.failedLoginAttempts || 0
    this.lockedUntil = data.lockedUntil
    this.lastLogin = data.lastLogin
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  /**
   * Generate JWT token for user
   * @returns {string} JWT token
   */
  generateToken() {
    const payload = {
      userId: this.id,
      username: this.username,
      role: this.getRoleId()
    }

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    })
  }

  /**
   * Get numeric role ID
   * @returns {number} Role ID (1=admin, 2=staff, 3=resident)
   */
  getRoleId() {
    switch(this.role) {
      case 'admin': return 1
      case 'staff': return 2
      case 'resident': return 3
      default: return 3
    }
  }

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === 'admin'
  }

  /**
   * Check if user is staff or admin
   * @returns {boolean}
   */
  isStaff() {
    return this.role === 'staff' || this.role === 'admin'
  }

  /**
   * Check if account is locked
   * @returns {boolean}
   */
  isLocked() {
    if (!this.lockedUntil) return false
    return new Date() < new Date(this.lockedUntil)
  }

  /**
   * Check if user must change password
   * @returns {boolean}
   */
  mustChangePassword() {
    return !this.passwordChanged
  }

  /**
   * Validate PIN format
   * @param {string} pin - PIN to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validatePIN(pin) {
    if (!pin) {
      return { isValid: false, error: 'PIN is required' }
    }

    if (typeof pin !== 'string') {
      return { isValid: false, error: 'PIN must be a string' }
    }

    if (pin.length !== 6) {
      return { isValid: false, error: 'PIN must be exactly 6 digits' }
    }

    if (!/^[0-9]{6}$/.test(pin)) {
      return { isValid: false, error: 'PIN must contain only numbers' }
    }

    return { isValid: true }
  }

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validateUsername(username) {
    if (!username) {
      return { isValid: false, error: 'Username is required' }
    }

    if (typeof username !== 'string') {
      return { isValid: false, error: 'Username must be a string' }
    }

    if (username.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters' }
    }

    if (username.length > 50) {
      return { isValid: false, error: 'Username must be less than 50 characters' }
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, dots, underscores, and hyphens' }
    }

    return { isValid: true }
  }

  /**
   * Hash password with bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS)
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Match result
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Generate username for admin-created residents
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {string} Generated username
   */
  static generateUsername(firstName, lastName) {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '')
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '')
    const timestamp = Date.now().toString().slice(-4)
    
    return `${cleanFirst}.${cleanLast}${timestamp}`
  }

  /**
   * Generate random 6-digit PIN
   * @returns {string} Random PIN
   */
  static generatePIN() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Validate user creation data
   * @param {Object} userData - User data to validate
   * @returns {Object} {isValid: boolean, errors: string[]}
   */
  static validateCreateData(userData) {
    const errors = []

    // Validate username
    const usernameValidation = this.validateUsername(userData.username)
    if (!usernameValidation.isValid) {
      errors.push(usernameValidation.error)
    }

    // Validate role
    if (!userData.role || !['admin', 'staff', 'resident'].includes(userData.role)) {
      errors.push('Valid role is required (admin, staff, or resident)')
    }

    // Validate passwordHash exists
    if (!userData.passwordHash || typeof userData.passwordHash !== 'string') {
      errors.push('Password hash is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate account lockout time
   * @param {number} failedAttempts - Number of failed attempts
   * @returns {Date|null} Lockout expiry time or null if no lockout
   */
  static calculateLockoutTime(failedAttempts) {
    if (failedAttempts >= config.MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = new Date()
      lockoutTime.setTime(lockoutTime.getTime() + config.LOCKOUT_TIME)
      return lockoutTime
    }
    return null
  }

  /**
   * Get user display name
   * @returns {string} Display name
   */
  getDisplayName() {
    return this.username
  }

  /**
   * Get role display name
   * @returns {string} Role display name
   */
  getRoleDisplayName() {
    switch(this.role) {
      case 'admin': return 'Administrator'
      case 'staff': return 'Staff Member'
      case 'resident': return 'Resident'
      default: return 'User'
    }
  }

  /**
   * Convert to safe object (no sensitive data)
   * @returns {Object} Safe user object
   */
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      roleDisplayName: this.getRoleDisplayName(),
      passwordChanged: this.passwordChanged,
      isLocked: this.isLocked(),
      lastLogin: this.lastLogin,
      createdAt: this.createdAt
    }
  }
}

module.exports = User
