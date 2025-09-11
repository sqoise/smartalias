'use client'

/**
 * API Client - Frontend to Backend Connector
 * Handles all HTTP communication with the Express.js backend
 * Backend handles data source switching (mock vs real data)
 */

const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api',
  TIMEOUT: 10000, // 10 seconds
}

class ApiClient {
  /**
   * Generic HTTP request handler
   */
  static async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    }

    // Add JWT token if available
    const token = this.getStoredToken()
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = { message: await response.text() }
      }

      // Return consistent response format
      if (response.ok) {
        return {
          success: true,
          data: data.data || data,
          message: data.message || 'Success',
          ...data,
        }
      } else {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          status: response.status,
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout. Please try again.',
        }
      }
      
      return {
        success: false,
        error: error.message || 'Network error. Please check your connection.',
      }
    }
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================
  
  static getStoredToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  }

  static setStoredToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
  }

  static removeStoredToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
  }

  // ============================================
  // AUTHENTICATION ENDPOINTS
  // ============================================

  /**
   * User login
   */
  static async login(username, pin) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    })

    // Store token on successful login
    if (response.success && response.token) {
      this.setStoredToken(response.token)
    }

    return response
  }

  /**
   * User logout
   */
  static async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })

    // Always clear local token
    this.removeStoredToken()
    
    return response
  }

  /**
   * Get current user session
   */
  static async getSession() {
    const token = this.getStoredToken()
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      }
    }

    return await this.request('/auth/me')
  }

  /**
   * Change user password/PIN
   */
  static async changePin(currentPin, newPin) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPin, newPin }),
    })
  }

  /**
   * Check if username exists (for login flow)
   */
  static async checkUser(username) {
    return await this.request('/auth/check-user', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }

  // ============================================
  // RESIDENTS ENDPOINTS
  // ============================================

  /**
   * Get all residents (admin only)
   */
  static async getResidents() {
    return await this.request('/residents')
  }

  /**
   * Search residents (admin only)
   */
  static async searchResidents(query, statusFilter) {
    const params = new URLSearchParams()
    if (query) params.append('search', query)
    if (statusFilter) params.append('status', statusFilter)
    
    const queryString = params.toString()
    const endpoint = queryString ? `/residents?${queryString}` : '/residents'
    
    return await this.request(endpoint)
  }

  /**
   * Get resident by ID
   */
  static async getResident(id) {
    return await this.request(`/residents/${id}`)
  }

  /**
   * Create new resident (admin only)
   */
  static async createResident(residentData) {
    return await this.request('/residents', {
      method: 'POST',
      body: JSON.stringify(residentData),
    })
  }

  /**
   * Update resident (admin only)
   */
  static async updateResident(id, residentData) {
    return await this.request(`/residents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(residentData),
    })
  }

  /**
   * Delete resident (admin only)
   */
  static async deleteResident(id) {
    return await this.request(`/residents/${id}`, {
      method: 'DELETE',
    })
  }

  // ============================================
  // SERVICE REQUESTS ENDPOINTS (Future)
  // ============================================

  /**
   * Get service requests
   */
  static async getServiceRequests() {
    return await this.request('/requests')
  }

  /**
   * Create service request
   */
  static async createServiceRequest(requestData) {
    return await this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
  }

  // ============================================
  // ADMIN ENDPOINTS (Future)
  // ============================================

  /**
   * Get admin dashboard data
   */
  static async getAdminDashboard() {
    return await this.request('/admin/dashboard')
  }

  /**
   * Get account security status (admin only)
   */
  static async getAccountStatus(username) {
    return await this.request(`/admin/account-status?username=${encodeURIComponent(username)}`)
  }

  /**
   * Unlock user account (admin only)
   */
  static async unlockAccount(username) {
    return await this.request('/admin/unlock-account', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }
}

export default ApiClient
