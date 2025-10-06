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
   * Change user PIN/password
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
   * Delete resident (admin only)
   */
  static async deleteResident(id) {
    return await ApiClient.request(`/residents/${id}`, {
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
}

export default ApiClient
