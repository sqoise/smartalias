/**
 * API Response Utility
 * Standardized response patterns for consistent API responses
 * Follows DRY principle for uniform response structure
 */

const DateTime = require('./datetime')

class ApiResponse {
  /**
   * Success Response
   * @param {Object} res - Express response object
   * @param {any} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @returns {Object} JSON response
   */
  static success(res, data = null, message = 'Request successful', statusCode = 200) {
    const response = {
      success: true,
      code: statusCode,
      message,
      timestamp: DateTime.now(),
      ...(data && { data })
    }
    
    return res.status(statusCode).json(response)
  }

  /**
   * Error Response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 400)
   * @param {any} error - Additional error details
   * @returns {Object} JSON response
   */
  static error(res, message = 'Request failed', statusCode = 400, error = null) {
    const response = {
      success: false,
      code: statusCode,
      message,
      timestamp: DateTime.now(),
      ...(error && { error })
    }
    
    return res.status(statusCode).json(response)
  }

  /**
   * Validation Error Response
   * @param {Object} res - Express response object
   * @param {Object} errors - Validation errors object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static validationError(res, errors = {}, message = 'Validation failed') {
    return ApiResponse.error(res, message, 422, { validation: errors })
  }

  /**
   * Unauthorized Response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return ApiResponse.error(res, message, 401)
  }

  /**
   * Forbidden Response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static forbidden(res, message = 'Access forbidden') {
    return ApiResponse.error(res, message, 403)
  }

  /**
   * Not Found Response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404)
  }

  /**
   * Server Error Response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {any} error - Error details
   * @returns {Object} JSON response
   */
  static serverError(res, message = 'Internal server error', error = null) {
    return ApiResponse.error(res, message, 500, error)
  }

  /**
   * Health Check Response
   * @param {Object} res - Express response object
   * @param {boolean} isHealthy - Health status
   * @param {Object} additionalData - Additional health data
   * @returns {Object} JSON response
   */
  static health(res, isHealthy = true, additionalData = {}) {
    const response = {
      success: isHealthy,
      code: isHealthy ? 200 : 500,
      message: isHealthy ? 'SMARTLIAS API is running' : 'SMARTLIAS API health check failed',
      timestamp: DateTime.now(),
      version: '1.0.0',
      ...additionalData
    }
    
    return res.status(response.code).json(response)
  }

  /**
   * Paginated Response
   * @param {Object} res - Express response object
   * @param {Array} data - Response data array
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   * @returns {Object} JSON response
   */
  static paginated(res, data = [], pagination = {}, message = 'Request successful') {
    const response = {
      success: true,
      code: 200,
      message,
      timestamp: DateTime.now(),
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
      }
    }
    
    return res.status(200).json(response)
  }
}

module.exports = ApiResponse
