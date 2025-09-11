// =============================================================================
// API CLIENT - The "Waiter" (Main Communication Layer)
// =============================================================================

import AuthService from './services/auth/auth.service.js'
import AuthMock from './services/auth/auth.mock.js'

/**
 * Main API Client that routes requests to appropriate services
 * Acts as a "waiter" between frontend components and backend services
 * 
 * Easy to defend: "This is our main API class that routes requests 
 * to either real services or mock services for development"
 */
class ApiClient {
  
  // Configuration - controls which services to use
  static config = {
    USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || false
  }

  // ==========================================================================
  // AUTHENTICATION API METHODS
  // ==========================================================================

  /**
   * Login user - routes to appropriate auth service
   */
  static async login(username, password) {
    console.log('ApiClient.login - USE_MOCK_DATA:', this.config.USE_MOCK_DATA)
    console.log('ApiClient.login - Environment variable:', process.env.NEXT_PUBLIC_USE_MOCK_DATA)
    
    if (this.config.USE_MOCK_DATA) {
      console.log('Using AuthMock.login')
      return AuthMock.login(username, password)
    } else {
      console.log('Using AuthService.login')
      return AuthService.login(username, password)
    }
  }

  /**
   * Check username - routes to appropriate auth service
   */
  static async checkUsername(username) {
    if (this.config.USE_MOCK_DATA) {
      return AuthMock.checkUsername(username)
    } else {
      return AuthService.checkUsername(username)
    }
  }

  /**
   * Logout user - routes to appropriate auth service
   */
  static async logout() {
    if (this.config.USE_MOCK_DATA) {
      return AuthMock.logout()
    } else {
      return AuthService.logout()
    }
  }

  /**
   * Change password - routes to appropriate auth service
   */
  static async changePassword(token, newPin) {
    if (this.config.USE_MOCK_DATA) {
      return AuthMock.changePassword(token, newPin)
    } else {
      return AuthService.changePassword(token, newPin)
    }
  }

  /**
   * Get current session - routes to appropriate auth service
   */
  static async getSession() {
    if (this.config.USE_MOCK_DATA) {
      return AuthMock.getSession()
    } else {
      return AuthService.getSession()
    }
  }

  /**
   * Get account security status - routes to appropriate auth service
   */
  static async getAccountStatus(username) {
    if (this.config.USE_MOCK_DATA) {
      return AuthMock.getAccountStatus(username)
    } else {
      return AuthService.getAccountStatus(username)
    }
  }

  /**
   * Unlock account - routes to appropriate auth service
   */
  static async unlockAccount(username) {
    if (this.config.USE_MOCK_DATA) {
      return AuthMock.unlockAccount(username)
    } else {
      return AuthService.unlockAccount(username)
    }
  }

  // ==========================================================================
  // FUTURE: OTHER SERVICE METHODS
  // ==========================================================================
  // 
  // When you add more services, add them here:
  //
  // static async getResidents() {
  //   if (this.config.USE_MOCK_DATA) {
  //     return ResidentsMock.getAll()
  //   } else {
  //     return ResidentsService.getAll()
  //   }
  // }
  //
  // static async createResident(data) {
  //   if (this.config.USE_MOCK_DATA) {
  //     return ResidentsMock.create(data)
  //   } else {
  //     return ResidentsService.create(data)
  //   }
  // }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Check if currently using mock data
   */
  static isUsingMockData() {
    return this.config.USE_MOCK_DATA
  }

  /**
   * Get current environment info (useful for debugging)
   */
  static getEnvironmentInfo() {
    return {
      usingMockData: this.config.USE_MOCK_DATA,
      nodeEnv: process.env.NODE_ENV,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    }
  }
}

export default ApiClient
