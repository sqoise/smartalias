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

  // Format text to proper Title Case (CamelCase for names and addresses)
  static formatTitleCase(input) {
    if (!input || typeof input !== 'string') return ''
    
    return input
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Handle common prefixes and particles that should remain lowercase
        const lowercaseWords = ['de', 'del', 'dela', 'delos', 'las', 'los', 'san', 'santa', 'ng', 'sa', 'na', 'at', 'ang', 'mga']
        const firstWord = word === input.trim().toLowerCase().split(' ')[0]
        
        if (!firstWord && lowercaseWords.includes(word)) {
          return word
        }
        
        // Capitalize first letter of each word
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim()
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
    
    // Required fields with format validation
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required')
    } else if (data.firstName.trim().length > 50) {
      errors.push('First name must be less than 50 characters')
    } else if (!/^[a-zA-Z\s]+$/.test(data.firstName.trim())) {
      errors.push('First name can only contain letters and spaces')
    }
    
    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required')
    } else if (data.lastName.trim().length > 50) {
      errors.push('Last name must be less than 50 characters')
    } else if (!/^[a-zA-Z\s]+$/.test(data.lastName.trim())) {
      errors.push('Last name can only contain letters and spaces')
    }
    
    // Middle name validation (optional but must be valid format if provided)
    if (data.middleName && data.middleName.trim().length > 0) {
      if (data.middleName.trim().length > 50) {
        errors.push('Middle name must be less than 50 characters')
      } else if (!/^[a-zA-Z\s]+$/.test(data.middleName.trim())) {
        errors.push('Middle name can only contain letters and spaces')
      }
    }
    
    // Birth date validation
    if (!data.birthDate) {
      errors.push('Birth date is required')
    } else {
      const birthDate = new Date(data.birthDate)
      const today = new Date()
      const minDate = new Date('1900-01-01')
      
      if (isNaN(birthDate.getTime())) {
        errors.push('Invalid birth date format')
      } else if (birthDate > today) {
        errors.push('Birth date cannot be in the future')
      } else if (birthDate < minDate) {
        errors.push('Birth date cannot be before 1900')
      }
    }
    
    // Gender validation
    if (!data.gender) {
      errors.push('Gender is required')
    } else {
      const gender = parseInt(data.gender)
      if (![1, 2].includes(gender)) {
        errors.push('Gender must be 1 (Male) or 2 (Female)')
      }
    }
    
    // Civil status validation
    if (!data.civilStatus) {
      errors.push('Civil status is required')
    } else {
      const validCivilStatuses = ['Single', 'Married', 'Widowed', 'Separated']
      if (!validCivilStatuses.includes(data.civilStatus)) {
        errors.push('Invalid civil status')
      }
    }
    
    // Address validation (required with minimum length)
    if (!data.address || data.address.trim().length === 0) {
      errors.push('Address is required')
    } else {
      const addressLength = data.address.trim().length
      if (addressLength < 20) {
        errors.push('Address must be at least 20 characters long')
      } else if (addressLength > 200) {
        errors.push('Address must be less than 200 characters')
      }
    }
    
    // Purok validation
    if (!data.purok) {
      errors.push('Purok is required')
    } else {
      const purok = parseInt(data.purok)
      if (![1, 2, 3, 4, 5, 6, 7].includes(purok)) {
        errors.push('Purok must be between 1 and 7')
      }
    }
    
    // Suffix validation (optional)
    if (data.suffix) {
      const suffix = parseInt(data.suffix)
      if (![1, 2, 3, 4, 5, 6].includes(suffix)) {
        errors.push('Invalid suffix option')
      }
    }
    
    // Email validation (optional)
    if (data.email && data.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push('Please enter a valid email address')
      }
    }
    
    // Mobile number validation (optional)
    if (data.mobileNumber && data.mobileNumber.trim().length > 0) {
      const cleanMobileNumber = data.mobileNumber.replace(/\s+/g, '')
      if (!/^09\d{9}$/.test(cleanMobileNumber)) {
        errors.push('Enter valid 11-digit mobile (e.g., 09XX XXX XXXX)')
      }
    }
    
    // Home number validation (optional)
    if (data.homeNumber && data.homeNumber.trim().length > 0) {
      const cleanHomeNumber = data.homeNumber.replace(/\s+/g, '')
      if (!/^\d{8}$/.test(cleanHomeNumber)) {
        errors.push('Enter valid 8-digit landline (e.g., 8000 0000)')
      }
    }
    
    // Religion validation (optional)
    if (data.religion) {
      const validReligions = ['ROMAN_CATHOLIC', 'PROTESTANT', 'IGLESIA_NI_CRISTO', 'ISLAM', 'BUDDHIST', 'OTHERS']
      if (!validReligions.includes(data.religion)) {
        errors.push('Invalid religion option')
      }
    }
    
    // Occupation validation (optional)
    if (data.occupation) {
      const validOccupations = ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'OTHERS']
      if (!validOccupations.includes(data.occupation)) {
        errors.push('Invalid occupation option')
      }
    }
    
    // Special category validation (optional)
    if (data.specialCategory) {
      const validCategories = ['PWD', 'SOLO_PARENT', 'INDIGENT', 'STUDENT']
      if (!validCategories.includes(data.specialCategory)) {
        errors.push('Invalid special category option')
      }
    }
    
    // Notes validation (optional)
    if (data.notes && data.notes.trim().length > 500) {
      errors.push('Notes must be less than 500 characters')
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
