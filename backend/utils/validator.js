/**
 * Input Validation Utilities
 * Centralized validation functions for API inputs
 */

const logger = require('../config/logger')

class Validator {
  // Sanitize input to prevent XSS and injection attacks
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .slice(0, 100) // Limit length to prevent buffer overflow
  }

  // Validate username
  static validateUsername(username) {
    const errors = []
    
    if (!username) {
      errors.push('Username is required')
    } else if (username.length < 3) {
      errors.push('Username must be at least 3 characters')
    } else if (username.length > 50) {
      errors.push('Username must be less than 50 characters')
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, dots, dashes, and underscores')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate PIN (6 digits)
  static validatePin(pin) {
    const errors = []
    
    if (!pin) {
      errors.push('PIN is required')
    } else if (typeof pin !== 'string' && typeof pin !== 'number') {
      errors.push('PIN must be a string or number')
    } else {
      const pinStr = pin.toString()
      if (pinStr.length !== 6) {
        errors.push('PIN must be exactly 6 digits')
      } else if (!/^\d{6}$/.test(pinStr)) {
        errors.push('PIN must contain only numbers')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate resident data
  static validateResident(data) {
    const errors = []
    
    // Required fields
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required')
    } else if (data.firstName.trim().length > 50) {
      errors.push('First name must be less than 50 characters')
    }
    
    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required')
    } else if (data.lastName.trim().length > 50) {
      errors.push('Last name must be less than 50 characters')
    }
    
    // Optional but validated fields
    if (data.middleName && data.middleName.trim().length > 50) {
      errors.push('Middle name must be less than 50 characters')
    }
    
    if (data.email && data.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email format')
      }
    }
    
    if (data.contactNumber && data.contactNumber.trim().length > 0) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(data.contactNumber)) {
        errors.push('Invalid contact number format')
      }
    }
    
    if (data.address && data.address.trim().length > 200) {
      errors.push('Address must be less than 200 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate pagination parameters
  static validatePagination(page, limit) {
    const errors = []
    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 10
    
    if (pageNum < 1) {
      errors.push('Page must be a positive number')
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      page: pageNum,
      limit: limitNum
    }
  }

  // Log validation errors
  static logValidationError(req, validation, field) {
    if (!validation.isValid) {
      logger.warn(`Validation failed for ${field}`, {
        ip: req.ip,
        user: req.user?.username || 'anonymous',
        errors: validation.errors
      })
    }
  }
}

module.exports = Validator
