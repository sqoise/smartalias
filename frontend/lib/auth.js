// Frontend Authentication & API Service Layer
// This module is designed to work with both:
// 1. Mock data (current development mode)
// 2. Real API backend (future production mode)

// Demo: Using JSON files for development - will be replaced with real API
import usersData from '../data/users.json'
import residentsData from '../data/residents.json'

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================

// Environment configuration
const API_CONFIG = {
  // Demo: Switch between mock and real API
  USE_MOCK_DATA: true, // Set to false when backend is ready
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CHECK_USERNAME: '/auth/check-username',
    SET_PASSWORD: '/auth/set-password',
    GET_SESSION: '/auth/session',
    RESIDENTS: '/residents'
  }
}

// Role types (shared with backend)
export const ROLE_TYPES = {
  RESIDENT: 1,
  ADMIN: 2
}

export const ROLE_NAMES = {
  1: 'Resident',
  2: 'Admin'
}

export function getRoleName(roleType) {
  return ROLE_NAMES[roleType] || 'Unknown'
}

// Session storage utilities
const SESSION_STORAGE = {
  USER_SESSION: 'smartlias_user_session',
  USERS_DATA: 'smartlias_users_data' // Demo: Only used in mock mode
}

// =============================================================================
// API CLIENT - READY FOR REAL BACKEND
// =============================================================================

// HTTP Client utility for API calls
class ApiClient {
  static async request(endpoint, options = {}) {
    if (API_CONFIG.USE_MOCK_DATA) {
      // Return mock responses - this will be replaced with real API calls
      return MockApiService.handleRequest(endpoint, options)
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      }

      // Add auth token if available
      const session = JSON.parse(localStorage.getItem(SESSION_STORAGE.USER_SESSION) || 'null')
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`
      }

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// =============================================================================
// MOCK API SERVICE - TEMPORARY FOR DEVELOPMENT
// =============================================================================

class MockApiService {
  // Mock data utilities
  static initializeUsersData() {
    const stored = localStorage.getItem(SESSION_STORAGE.USERS_DATA)
    if (!stored) {
      localStorage.setItem(SESSION_STORAGE.USERS_DATA, JSON.stringify(usersData.users))
    }
    return JSON.parse(localStorage.getItem(SESSION_STORAGE.USERS_DATA))
  }

  static getUsersData() {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE.USERS_DATA) || '[]')
  }

  static updateUsersData(users) {
    localStorage.setItem(SESSION_STORAGE.USERS_DATA, JSON.stringify(users))
  }

  static findUserByUsername(username) {
    const users = this.getUsersData()
    return users.find(user => user.username === username)
  }

  static updateUser(updatedUser) {
    const users = this.getUsersData()
    const index = users.findIndex(user => user.id === updatedUser.id)
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser }
      this.updateUsersData(users)
      return users[index]
    }
    return null
  }

  // Demo: Password validation (mock)
  static validatePassword(plainPassword, hashedPassword) {
    // Demo: Hardcoded password mapping for development
    const demoPasswords = {
      '$2b$12$XyxGtsQ8368m9SqmA3A5Ie/X0t0Cptg/MPFIvdtpkw/GFTAsMyy32': 'password123',
      '$2b$12$KQPUfuuGHGb4X2uhfAlIKOQVKIys2laotmFRvWVY.8w8MIk83dYuy': 'password123',
      '$2b$12$V.ns/T6MHuZ1IG.Fh9f1FunbwPOySprB/aQxYpAlkaqNhVGJk3Rp.': 'newpassword123',
      '$2b$12$samplehash1234567890abcdef': 'password123',
      '$2b$12$samplehash2345678901bcdefg': 'password123',
      '$2b$12$samplehash3456789012cdefgh': 'password123'
    }
    return demoPasswords[hashedPassword] === plainPassword
  }

  // Account utilities
  static isAccountLocked(user) {
    if (!user.locked_until) return false
    return new Date(user.locked_until) > new Date()
  }

  static shouldLockAccount(attempts) {
    return attempts >= 3
  }

  // Generate mock JWT token
  static generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_type,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    return btoa(JSON.stringify(payload))
  }

  // Validate mock token
  static validateToken(token) {
    try {
      const payload = JSON.parse(atob(token))
      const currentTime = Math.floor(Date.now() / 1000)
      
      if (payload.exp && currentTime > payload.exp) {
        return { valid: false, error: 'Token expired' }
      }
      
      return { valid: true, payload }
    } catch (error) {
      return { valid: false, error: 'Invalid token' }
    }
  }

  // Handle mock API requests
  static async handleRequest(endpoint, options = {}) {
    // Initialize mock data
    this.initializeUsersData()
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))

    switch (endpoint) {
      case API_CONFIG.ENDPOINTS.LOGIN:
        return this.handleLogin(options.body ? JSON.parse(options.body) : {})
      
      case API_CONFIG.ENDPOINTS.CHECK_USERNAME:
        return this.handleCheckUsername(options.body ? JSON.parse(options.body) : {})
      
      case API_CONFIG.ENDPOINTS.SET_PASSWORD:
        return this.handleSetPassword(options.body ? JSON.parse(options.body) : {})
      
      case API_CONFIG.ENDPOINTS.GET_SESSION:
        return this.handleGetSession()
      
      case API_CONFIG.ENDPOINTS.RESIDENTS:
        return this.handleGetResidents()
      
      default:
        return { success: false, error: 'Endpoint not found' }
    }
  }

  // Demo: Mock API handlers
  static handleLogin({ username, password }) {
    // Demo: Easy testing mode - allow any password for frontend testing
    const EASY_TESTING = true; // Set to false for real validation
    
    if (!username || !password) {
      return {
        success: false,
        error: 'Username and password are required'
      }
    }

    if (EASY_TESTING) {
      // Demo: Allow any username/password for testing frontend design/UX
      const mockUser = {
        id: 999,
        username: username.trim(),
        first_name: 'Demo',
        last_name: 'User',
        role_type: ROLE_TYPES.RESIDENT,
        password_changed: 1 // Demo: Skip password change for testing
      }

      const token = this.generateToken(mockUser)
      const userData = {
        id: mockUser.id,
        username: mockUser.username,
        firstName: mockUser.first_name,
        lastName: mockUser.last_name,
        role: mockUser.role_type,
        passwordChanged: mockUser.password_changed
      }

      return {
        success: true,
        data: {
          token,
          user: userData,
          redirectTo: '/resident' // Demo: Always go to resident dashboard for testing
        }
      }
    }

    const user = this.findUserByUsername(username.trim())
    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password'
      }
    }

    if (this.isAccountLocked(user)) {
      return {
        success: false,
        error: 'Account is temporarily locked due to multiple failed attempts'
      }
    }

    const isValidPassword = this.validatePassword(password, user.password_hash)
    
    if (!isValidPassword) {
      const newAttempts = (user.failed_attempts || 0) + 1
      let updateData = {
        failed_attempts: newAttempts,
        last_attempt: new Date().toISOString()
      }

      if (this.shouldLockAccount(newAttempts)) {
        updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }

      this.updateUser({ ...user, ...updateData })

      return {
        success: false,
        error: 'Invalid username or password'
      }
    }

    // Reset failed attempts
    this.updateUser({
      ...user,
      failed_attempts: 0,
      locked_until: null,
      last_attempt: new Date().toISOString()
    })

    const token = this.generateToken(user)
    const userData = {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_type,
      passwordChanged: user.password_changed
    }

    // Determine redirect
    let redirectTo = '/'
    if (!user.password_changed) {
      const resetToken = this.generateToken({
        ...user,
        purpose: 'password_reset'
      })
      redirectTo = `/change-password?token=${resetToken}`
    } else if (user.role_type === ROLE_TYPES.ADMIN) {
      redirectTo = '/admin'
    } else {
      redirectTo = '/'
    }

    return {
      success: true,
      data: {
        token,
        user: userData,
        redirectTo
      }
    }
  }

  static handleCheckUsername({ username }) {
    // Demo: Easy testing mode - allow any username for frontend testing
    const EASY_TESTING = true; // Set to false for real validation
    
    if (!username || username.trim().length === 0) {
      return {
        success: false,
        error: 'Username is required'
      }
    }

    if (EASY_TESTING) {
      // Demo: Allow any username for testing frontend design/UX
      return {
        success: true,
        data: {
          username: username.trim(),
          firstName: 'Demo',
          lastName: 'User',
          role: ROLE_TYPES.RESIDENT
        }
      }
    }

    const user = this.findUserByUsername(username.trim())
    
    if (!user) {
      return {
        success: false,
        error: 'Username not found'
      }
    }

    return {
      success: true,
      data: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_type
      }
    }
  }

  static handleSetPassword({ token, newPassword }) {
    const tokenValidation = this.validateToken(token)
    
    if (!tokenValidation.valid) {
      return {
        success: false,
        error: 'Invalid or expired token'
      }
    }

    const { payload } = tokenValidation
    const user = this.findUserByUsername(payload.username)
    
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Validate password
    const passwordValidation = {
      length: newPassword?.length >= 8,
      number: /\d/.test(newPassword),
      special: /[!@#$%^&().?]/.test(newPassword)
    }

    if (!passwordValidation.length || !passwordValidation.number || !passwordValidation.special) {
      return {
        success: false,
        error: 'Password must be at least 8 characters with 1 number and 1 special character'
      }
    }

    const newHash = `$2b$12$demo_${btoa(newPassword)}_hash`
    const updatedUser = this.updateUser({
      ...user,
      password_hash: newHash,
      password_changed: 1
    })

    if (!updatedUser) {
      return {
        success: false,
        error: 'Failed to update password'
      }
    }

    const redirectTo = updatedUser.role_type === ROLE_TYPES.ADMIN ? '/admin' : '/'

    return {
      success: true,
      data: { redirectTo }
    }
  }

  static handleGetSession() {
    const session = localStorage.getItem(SESSION_STORAGE.USER_SESSION)
    if (!session) {
      return { success: false, error: 'No session found' }
    }

    try {
      const parsed = JSON.parse(session)
      const tokenValidation = this.validateToken(parsed.token)
      
      if (!tokenValidation.valid) {
        return { success: false, error: 'Invalid session' }
      }

      return {
        success: true,
        data: parsed
      }
    } catch (error) {
      return { success: false, error: 'Invalid session data' }
    }
  }

  static handleGetResidents() {
    return {
      success: true,
      data: residentsData || []
    }
  }
}

// =============================================================================
// PUBLIC AUTHENTICATION API - READY FOR BACKEND
// =============================================================================

export const auth = {
  // Login with username and password
  async login(username, password) {
    const result = await ApiClient.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })

    if (result.success) {
      // Store session locally
      const session = {
        token: result.data.token,
        user: result.data.user,
        loginTime: new Date().toISOString()
      }
      localStorage.setItem(SESSION_STORAGE.USER_SESSION, JSON.stringify(session))
      
      return {
        success: true,
        redirectTo: result.data.redirectTo,
        user: result.data.user
      }
    }

    return result
  },

  // Check if username exists
  async checkUsername(username) {
    const result = await ApiClient.request(API_CONFIG.ENDPOINTS.CHECK_USERNAME, {
      method: 'POST',
      body: JSON.stringify({ username })
    })

    if (result.success) {
      return {
        success: true,
        user: result.data
      }
    }

    return result
  },

  // Set new password
  async setPassword(token, newPassword) {
    const result = await ApiClient.request(API_CONFIG.ENDPOINTS.SET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    })

    return result.success ? {
      success: true,
      redirectTo: result.data.redirectTo
    } : result
  },

  // Logout user
  logout() {
    localStorage.removeItem(SESSION_STORAGE.USER_SESSION)
    
    // In production, also call API to invalidate server session
    if (!API_CONFIG.USE_MOCK_DATA) {
      ApiClient.request(API_CONFIG.ENDPOINTS.LOGOUT, { method: 'POST' })
    }
    
    return { success: true }
  },

  // Get current session
  getSession() {
    const session = localStorage.getItem(SESSION_STORAGE.USER_SESSION)
    if (!session) return null

    try {
      const parsed = JSON.parse(session)
      
      if (API_CONFIG.USE_MOCK_DATA) {
        const tokenValidation = MockApiService.validateToken(parsed.token)
        if (!tokenValidation.valid) {
          localStorage.removeItem(SESSION_STORAGE.USER_SESSION)
          return null
        }
      }

      return parsed
    } catch (error) {
      localStorage.removeItem(SESSION_STORAGE.USER_SESSION)
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return this.getSession() !== null
  }
}

// =============================================================================
// RESIDENTS API - READY FOR BACKEND
// =============================================================================

export const residents = {
  async getAll() {
    const result = await ApiClient.request(API_CONFIG.ENDPOINTS.RESIDENTS)
    return result.success ? result.data : []
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize mock data if in development mode
if (typeof window !== 'undefined' && API_CONFIG.USE_MOCK_DATA) {
  MockApiService.initializeUsersData()
}
