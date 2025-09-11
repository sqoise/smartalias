// =============================================================================
// AUTHENTICATION SERVICE - Real Backend Communication
// =============================================================================

/**
 * Real Authentication Service that communicates with Express.js backend
 * Handles all HTTP requests for authentication operations
 */
class AuthService {
  
  // Configuration for real backend
  static config = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api',
    ENDPOINTS: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      CHECK_USERNAME: '/auth/check-username',
      GET_SESSION: '/auth/session',
      CHANGE_PASSWORD: '/auth/change-password',
      ACCOUNT_STATUS: '/auth/account-status',
      UNLOCK_ACCOUNT: '/auth/unlock-account'
    }
  }

  // ==========================================================================
  // HTTP REQUEST UTILITY
  // ==========================================================================
  
  /**
   * Make HTTP request to backend with authentication headers
   */
  static async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.config.BASE_URL}${endpoint}`
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      }

      // Add JWT token if user is logged in
      const session = JSON.parse(localStorage.getItem('smartlias_user_session') || 'null')
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`
      }

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed')
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================================================
  // AUTHENTICATION METHODS
  // ==========================================================================

  /**
   * Login user with username and password
   */
  static async login(username, password) {
    try {
      const result = await this.makeRequest(this.config.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })

      if (result.success) {
        // Store session in localStorage
        const sessionData = {
          token: result.data.token,
          user: result.data.user
        }
        localStorage.setItem('smartlias_user_session', JSON.stringify(sessionData))
        
        return {
          success: true,
          user: result.data.user,
          redirectTo: result.data.redirectTo
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: 'Login failed. Please try again.'
      }
    }
  }

  /**
   * Check if username exists
   */
  static async checkUsername(username) {
    try {
      const result = await this.makeRequest(this.config.ENDPOINTS.CHECK_USERNAME, {
        method: 'POST',
        body: JSON.stringify({ username })
      })

      return result
    } catch (error) {
      return {
        success: false,
        error: 'Unable to verify username. Please try again.'
      }
    }
  }

  /**
   * Logout current user
   */
  static async logout() {
    try {
      // Call backend logout endpoint
      await this.makeRequest(this.config.ENDPOINTS.LOGOUT, {
        method: 'POST'
      })

      // Clear local session
      localStorage.removeItem('smartlias_user_session')
      
      return { success: true }
    } catch (error) {
      // Even if backend call fails, clear local session
      localStorage.removeItem('smartlias_user_session')
      return { success: true }
    }
  }

  /**
   * Change user password/MPIN
   */
  static async changePassword(token, newPin) {
    try {
      const result = await this.makeRequest(this.config.ENDPOINTS.CHANGE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ token, newPin })
      })

      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to change password. Please try again.'
      }
    }
  }

  /**
   * Get current user session
   */
  static async getSession() {
    try {
      const session = JSON.parse(localStorage.getItem('smartlias_user_session') || 'null')
      
      if (!session) {
        return { success: false, error: 'No active session' }
      }

      // Validate session with backend
      const result = await this.makeRequest(this.config.ENDPOINTS.GET_SESSION)
      
      if (!result.success) {
        localStorage.removeItem('smartlias_user_session')
      }
      
      return result
    } catch (error) {
      localStorage.removeItem('smartlias_user_session')
      return {
        success: false,
        error: 'Session validation failed'
      }
    }
  }

  /**
   * Get account security status
   */
  static async getAccountStatus(username) {
    try {
      return await this.makeRequest(`${this.config.ENDPOINTS.ACCOUNT_STATUS}?username=${encodeURIComponent(username)}`)
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get account status'
      }
    }
  }

  /**
   * Unlock user account (admin function)
   */
  static async unlockAccount(username) {
    try {
      return await this.makeRequest(this.config.ENDPOINTS.UNLOCK_ACCOUNT, {
        method: 'POST',
        body: JSON.stringify({ username })
      })
    } catch (error) {
      return {
        success: false,
        error: 'Failed to unlock account'
      }
    }
  }
}

export default AuthService
