// =============================================================================
// AUTHENTICATION MOCK SERVICE - Demo Data for Development
// =============================================================================

import usersData from '../../../data/users.json'

/**
 * Mock Authentication Service for development and testing
 * Uses JSON data instead of real backend API calls
 */
class AuthMock {
  
  // Mock configuration
  static config = {
    NETWORK_DELAY: 100, // Simulate network latency
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    MAX_FAILED_ATTEMPTS: 5, // Maximum failed attempts before lockout
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes lockout duration
    ATTEMPT_WINDOW: 15 * 60 * 1000 // 15 minutes window for failed attempts
  }

  // ==========================================================================
  // DATA ACCESS METHODS
  // ==========================================================================
  
  /**
   * Get users directly from JSON data (simple approach)
   */
  static getUsers() {
    return usersData.users
  }

  /**
   * Find user by username
   */
  static findUser(username) {
    return this.getUsers().find(user => 
      user.username.toLowerCase() === username.toLowerCase()
    )
  }

  // ==========================================================================
  // VALIDATION UTILITIES
  // ==========================================================================

  /**
   * Check if account is currently locked
   */
  static isAccountLocked(user) {
    if (!user.locked_until) return false
    
    const now = new Date()
    const lockUntil = new Date(user.locked_until)
    
    return now < lockUntil
  }

  /**
   * Check if failed attempts should be reset (outside the attempt window)
   */
  static shouldResetFailedAttempts(user) {
    if (!user.last_attempt) return true
    
    const now = new Date()
    const lastAttempt = new Date(user.last_attempt)
    const timeSinceLastAttempt = now - lastAttempt
    
    return timeSinceLastAttempt > this.config.ATTEMPT_WINDOW
  }

  /**
   * Update user account after failed login attempt
   */
  static updateFailedAttempt(user) {
    const now = new Date().toISOString()
    
    // Reset failed attempts if outside the attempt window
    if (this.shouldResetFailedAttempts(user)) {
      user.failed_attempts = 1
    } else {
      user.failed_attempts = (user.failed_attempts || 0) + 1
    }
    
    user.last_attempt = now
    
    // Lock account if max attempts reached
    if (user.failed_attempts >= this.config.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date()
      lockUntil.setTime(lockUntil.getTime() + this.config.LOCKOUT_DURATION)
      user.locked_until = lockUntil.toISOString()
    }
    
    return user
  }

  /**
   * Reset failed attempts after successful login
   */
  static resetFailedAttempts(user) {
    user.failed_attempts = 0
    user.locked_until = null
    user.last_attempt = new Date().toISOString()
    return user
  }

  /**
   * Get remaining lockout time in minutes
   */
  static getRemainingLockoutTime(user) {
    if (!user.locked_until) return 0
    
    const now = new Date()
    const lockUntil = new Date(user.locked_until)
    const remainingMs = lockUntil - now
    
    return Math.max(0, Math.ceil(remainingMs / (60 * 1000)))
  }

  /**
   * Validate MPIN against demo user data
   */
  static validateMPIN(user, mpin) {
    // Demo MPIN mappings for testing
    const demoMPINs = {
      'juan.delacruz': '031590',
      'maria.santos': '120885', 
      'admin.staff': '010180',
      'jose.garcia': '067520',
      'ana.reyes': '091285'
    }
    
    return demoMPINs[user.username] === mpin
  }

  /**
   * Generate mock JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_type,
      exp: Date.now() + this.config.TOKEN_EXPIRY
    }
    return btoa(JSON.stringify(payload))
  }

  // ==========================================================================
  // MOCK NETWORK SIMULATION
  // ==========================================================================

  /**
   * Simulate network delay for realistic testing
   */
  static async simulateNetwork() {
    await new Promise(resolve => 
      setTimeout(resolve, this.config.NETWORK_DELAY)
    )
  }

  // ==========================================================================
  // AUTHENTICATION METHODS
  // ==========================================================================

  /**
   * Mock login - validates against JSON data with account lockout
   */
  static async login(username, password) {
    console.log('AuthMock.login called with:', { username, password })
    await this.simulateNetwork()

    // Input validation
    if (!username?.trim() || !password?.trim()) {
      return {
        success: false,
        error: 'Username and MPIN are required'
      }
    }

    // Find user
    const user = this.findUser(username.trim())
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      }
    }

    // Check if account is locked
    if (this.isAccountLocked(user)) {
      const remainingMinutes = this.getRemainingLockoutTime(user)
      return {
        success: false,
        error: `Account is locked due to multiple failed attempts. Please try again in ${remainingMinutes} minutes.`,
        lockoutInfo: {
          isLocked: true,
          remainingMinutes,
          unlockTime: user.locked_until
        }
      }
    }

    // Validate MPIN
    const isValidMPIN = this.validateMPIN(user, password)
    
    if (!isValidMPIN) {
      // Update failed attempt counter
      this.updateFailedAttempt(user)
      
      // Prepare error message based on failed attempts
      const attemptsLeft = this.config.MAX_FAILED_ATTEMPTS - user.failed_attempts
      let errorMessage = 'Invalid credentials'
      
      if (user.failed_attempts >= this.config.MAX_FAILED_ATTEMPTS) {
        const lockoutMinutes = Math.ceil(this.config.LOCKOUT_DURATION / (60 * 1000))
        errorMessage = `Account locked due to ${this.config.MAX_FAILED_ATTEMPTS} failed attempts. Please try again in ${lockoutMinutes} minutes.`
      } else if (attemptsLeft <= 2) {
        errorMessage = `Invalid credentials. ${attemptsLeft} attempts remaining before account lockout.`
      }
      
      return {
        success: false,
        error: errorMessage,
        securityInfo: {
          failedAttempts: user.failed_attempts,
          attemptsLeft: Math.max(0, attemptsLeft),
          isLocked: user.failed_attempts >= this.config.MAX_FAILED_ATTEMPTS,
          lockoutDuration: this.config.LOCKOUT_DURATION
        }
      }
    }

    // Successful login - reset failed attempts
    this.resetFailedAttempts(user)

    // Generate mock token
    const token = this.generateToken(user)

    // Store session
    const sessionData = {
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_type,
        passwordChanged: user.password_changed === 1
      }
    }
    localStorage.setItem('smartlias_user_session', JSON.stringify(sessionData))

    // Determine redirect based on password change requirement
    let redirectTo
    if (user.password_changed === 0) {
      // User needs to change password - redirect to change MPIN page
      redirectTo = '/change-pin?token=qwe123' // Demo token - replace with real token generation
    } else {
      // Normal redirect based on role
      redirectTo = user.role_type === 2 ? '/admin' : '/resident'
    }

    return {
      success: true,
      user: sessionData.user,
      redirectTo
    }
  }

  /**
   * Mock username check
   */
  static async checkUsername(username) {
    await this.simulateNetwork()

    if (!username?.trim()) {
      return {
        success: false,
        error: 'Username is required'
      }
    }

    // Validate format
    const sanitized = username.trim()
    if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
      return {
        success: false,
        error: 'Username contains invalid characters.'
      }
    }

    if (sanitized.length > 64) {
      return {
        success: false,
        error: 'Username must not exceed maximum length.'
      }
    }

    // Check if user exists
    const user = this.findUser(sanitized)
    if (!user) {
      return {
        success: false,
        error: 'Username does not exist. Please visit the Barangay office to register.'
      }
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_type
        }
      }
    }
  }

  /**
   * Mock change password/MPIN - Simple demo version
   */
  static async changePassword(token, newPin) {
    await this.simulateNetwork()

    // Validate inputs
    if (!token || !newPin) {
      return {
        success: false,
        error: 'Token and new PIN are required'
      }
    }

    // Validate PIN format
    if (!/^\d{6}$/.test(newPin)) {
      return {
        success: false,
        error: 'PIN must be exactly 6 digits'
      }
    }

    // Demo: Simple token validation - replace with real token validation
    if (token !== 'qwe123') {
      return {
        success: false,
        error: 'Invalid or expired token'
      }
    }

    try {
      // Get current session to identify user
      const session = JSON.parse(localStorage.getItem('smartlias_user_session') || 'null')
      if (!session?.user?.username) {
        return {
          success: false,
          error: 'No active session'
        }
      }

      // Demo: For demo purposes, we'll just simulate success
      // In real app, this would update the database
      console.log('Demo: Password change simulated for user:', session.user.username)
      console.log('Demo: New PIN would be:', newPin)

      // Clear current session to force re-login with new password
      localStorage.removeItem('smartlias_user_session')

      return {
        success: true,
        message: 'Password changed successfully'
      }
    } catch (error) {
      console.error('Change password error:', error)
      return {
        success: false,
        error: 'Failed to change password'
      }
    }
  }

  /**
   * Mock logout
   */
  static async logout() {
    await this.simulateNetwork()
    
    // Clear session
    localStorage.removeItem('smartlias_user_session')
    
    return { success: true }
  }

  /**
   * Mock get session
   */
  static async getSession() {
    await this.simulateNetwork()
    
    const session = JSON.parse(localStorage.getItem('smartlias_user_session') || 'null')
    
    if (!session) {
      return { success: false, error: 'No active session' }
    }

    return {
      success: true,
      user: session.user
    }
  }

  /**
   * Get account security status (useful for admin or debugging)
   */
  static async getAccountStatus(username) {
    await this.simulateNetwork()
    
    const user = this.findUser(username)
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    return {
      success: true,
      accountStatus: {
        username: user.username,
        isLocked: this.isAccountLocked(user),
        failedAttempts: user.failed_attempts || 0,
        lockedUntil: user.locked_until,
        lastAttempt: user.last_attempt,
        remainingLockoutMinutes: this.getRemainingLockoutTime(user),
        passwordChanged: user.password_changed === 1
      }
    }
  }

  /**
   * Unlock account (admin function)
   */
  static async unlockAccount(username) {
    await this.simulateNetwork()
    
    const user = this.findUser(username)
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Reset lockout status
    user.failed_attempts = 0
    user.locked_until = null
    
    return {
      success: true,
      message: `Account ${username} has been unlocked`
    }
  }
}

export default AuthMock
