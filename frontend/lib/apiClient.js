'use client'

import { APP_CONFIG } from './constants'

/**
 * API Client - Frontend to Backend Connector
 * Handles all HTTP communication with the Express.js backend
 * Backend handles data source switching (mock vs real data)
 */

const API_CONFIG = {
  BASE_URL: APP_CONFIG.API.BASE_URL,
  TIMEOUT: APP_CONFIG.API.TIMEOUT,
}

/**
 * API Client - Frontend to Backend Connector
 * Handles all HTTP communication with the Express.js backend
 * Backend handles data source switching (mock vs real data)
 */

class ApiClient {
  // Session expired callback - can be set by components
  static onSessionExpired = null

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
    const token = ApiClient.getStoredToken()
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

      // Check for authentication errors (401 Unauthorized or 403 Forbidden)
      // BUT: Don't treat login endpoint failures as session expiration
      if (response.status === 401 || response.status === 403) {
        // Special case: Login endpoint failures are NOT session expiration
        // They are just failed login attempts (wrong credentials)
        if (endpoint === '/auth/login') {
          return {
            success: false,
            error: data.message || 'Invalid credentials',
            status: response.status,
          }
        }
        
        // For all other endpoints: treat as session expiration
        // Clear token
        ApiClient.removeStoredToken()
        
        // Trigger session expired handler if set
        if (ApiClient.onSessionExpired) {
          // Call handler without redirecting immediately
          // Let the modal component handle the redirect
          ApiClient.onSessionExpired()
        } else {
          // If no handler, redirect to login directly
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        
        return {
          success: false,
          error: data.message || 'Session expired',
          status: response.status,
          sessionExpired: true,
        }
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
        error: error.message || 'Network error. Please check your API connection.',
      }
    }
  }

  /**
   * Simple GET request wrapper
   */
  static async get(endpoint) {
    return await ApiClient.request(endpoint, { method: 'GET' })
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

  /**
   * TEST METHOD: Simulate session expiration
   * This will trigger the session expired modal
   */
  static testSessionExpiration() {
    console.log('Testing session expiration...')
    if (ApiClient.onSessionExpired) {
      ApiClient.removeStoredToken()
      ApiClient.onSessionExpired()
    } else {
      console.warn('No session expired handler registered')
    }
  }

  // ============================================
  // AUTHENTICATION ENDPOINTS
  // ============================================

  /**
   * User login
   */
  static async login(username, pin) {
    const response = await ApiClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    })

    // Store token on successful login
    // Backend returns token in response.data.token
    if (response.success && response.data && response.data.token) {
      ApiClient.setStoredToken(response.data.token)
    }

    return response
  }

  /**
   * User logout
   */
  static async logout() {
    const response = await ApiClient.request('/auth/logout', {
      method: 'POST',
    })

    // Always clear local token
    ApiClient.removeStoredToken()
    
    return response
  }

  /**
   * Get current user session
   */
  static async getSession() {
    const token = ApiClient.getStoredToken()
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      }
    }

    return await ApiClient.request('/auth/me')
  }

  /**
   * Get current user info (for validating token and getting user details)
   */
  static async getCurrentUser() {
    const token = ApiClient.getStoredToken()
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      }
    }

    return await ApiClient.request('/auth/me')
  }

  /**
   * Change user PIN/password (requires current PIN)
   */
  static async changePassword(currentPin, newPin) {
    return await ApiClient.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPin,
        newPin,
      }),
    })
  }

  /**
   * Validate change password token
   * Used to verify token from URL parameter is valid and not expired
   */
  static async validateChangePasswordToken(token) {
    return await ApiClient.request('/auth/validate-change-token', {
      method: 'POST',
      body: JSON.stringify({
        token,
      }),
    })
  }

  /**
   * Change PIN for first-time users (no current PIN required)
   * Used when is_password_changed = 0
   * @param {string} token - JWT token from URL parameter
   * @param {string} newPin - New 6-digit PIN
   */
  static async changePasswordFirstTime(token, newPin) {
    return await ApiClient.request('/auth/change-password-first-time', {
      method: 'POST',
      body: JSON.stringify({
        token,
        newPin,
      }),
    })
  }

  /**
   * Register new resident (public endpoint)
   */
  static async register(registrationData) {
    return await ApiClient.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    })
  }

  /**
   * Check if username exists (for login flow)
   */
  static async checkUser(username) {
    return await ApiClient.request('/auth/check-user', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }

  // ============================================
  // RESIDENTS ENDPOINTS
  // ============================================

  /**
   * Get all residents (admin only)
   * Backend returns ALL residents, frontend filters by status
   */
  static async getResidents() {
    return await ApiClient.request('/residents')
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
    
    return await ApiClient.request(endpoint)
  }

  /**
   * Get special categories for dropdowns (authenticated users)
   */
  static async getSpecialCategories() {
    return await ApiClient.request('/residents/special-categories')
  }

  /**
   * Get special categories for registration (public endpoint)
   */
  static async getPublicSpecialCategories() {
    return await ApiClient.request('/public/special-categories')
  }  /**
   * Get resident by ID
   */
  static async getResident(id) {
    return await ApiClient.request(`/residents/${id}`)
  }

  /**
   * Create new resident (admin only)
   */
  static async createResident(residentData) {
    return await ApiClient.request('/residents', {
      method: 'POST',
      body: JSON.stringify(residentData),
    })
  }

  /**
   * Update resident (admin only)
   */
  static async updateResident(id, residentData) {
    return await ApiClient.request(`/residents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(residentData),
    })
  }

  /**
   * Update resident status (staff or admin)
   */
  static async updateResidentStatus(id, isActive) {
    // Parse ID to remove any leading zeros and ensure it's a valid number
    const numericId = parseInt(id, 10)
    
    if (isNaN(numericId)) {
      throw new Error(`Invalid resident ID: ${id}`)
    }
    
    return await ApiClient.request(`/residents/${numericId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    })
  }

  /**
   * Delete resident (admin only)
   */
  static async deleteResident(id) {
    return await ApiClient.request(`/residents/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Reset resident PIN (admin only)
   * Generates new temporary credentials
   */
  static async resetResidentPin(residentId) {
    return await ApiClient.request(`/residents/${residentId}/reset-pin`, {
      method: 'POST',
    })
  }

  // ============================================
  // SERVICE REQUESTS ENDPOINTS (Future)
  // ============================================

  /**
   * Get service requests
   */
  static async getServiceRequests() {
    return await ApiClient.request('/requests')
  }

  /**
   * Create service request
   */
  static async createServiceRequest(requestData) {
    return await ApiClient.request('/requests', {
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
    return await ApiClient.request('/admin/dashboard')
  }

  /**
   * Get account security status (admin only)
   */
  static async getAccountStatus(username) {
    return await ApiClient.request(`/admin/account-status?username=${encodeURIComponent(username)}`)
  }

  /**
   * Unlock user account (admin only)
   */
  static async unlockAccount(username) {
    return await ApiClient.request('/admin/unlock-account', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }

  // ============================================
  // ANNOUNCEMENTS ENDPOINTS
  // ============================================

  /**
   * Create announcement (admin only)
   */
  static async createAnnouncement(announcementData) {
    return await ApiClient.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    })
  }

  /**
   * Get all announcements (admin only)
   */
  static async getAnnouncements() {
    return await ApiClient.request('/announcements')
  }

  /**
   * Get published announcements with pagination support (public endpoint, no auth required)
   */
  static async getPublishedAnnouncements(limit = 5, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
    return await ApiClient.request(`/announcements/public?${params.toString()}`)
  }

  // ============================================
  // CHATBOT ENDPOINTS
  // ============================================

  /**
   * Get FAQ categories
   */
  static async getChatbotCategories() {
    return await ApiClient.request('/chatbot/categories')
  }

  /**
   * Get FAQs (optionally filtered by category)
   */
  static async getChatbotFAQs(categoryId = null) {
    const endpoint = categoryId ? `/chatbot/faqs?categoryId=${categoryId}` : '/chatbot/faqs'
    return await ApiClient.request(endpoint)
  }

  /**
   * Get specific FAQ by ID
   */
  static async getChatbotFAQ(faqId) {
    return await ApiClient.request(`/chatbot/faqs/${faqId}`)
  }

  /**
   * Search FAQs
   */
  static async searchChatbotFAQs(query) {
    return await ApiClient.request(`/chatbot/search?q=${encodeURIComponent(query)}`)
  }

  /**
   * Process chatbot query
   */
  static async processChatbotQuery(query, sessionId) {
    return await ApiClient.request('/chatbot/query', {
      method: 'POST',
      body: JSON.stringify({ query, sessionId }),
    })
  }

  /**
   * Submit FAQ feedback
   */
  static async submitFAQFeedback(faqId, helpful) {
    return await ApiClient.request(`/chatbot/faqs/${faqId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    })
  }

  /**
   * Get conversation history
   */
  static async getChatbotConversation(sessionId) {
    return await ApiClient.request(`/chatbot/conversations/${sessionId}`)
  }

  /**
   * End conversation
   */
  static async endChatbotConversation(sessionId) {
    return await ApiClient.request(`/chatbot/conversations/${sessionId}/end`, {
      method: 'POST',
    })
  }
}

// Expose ApiClient to window for testing
if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient
}

export default ApiClient
