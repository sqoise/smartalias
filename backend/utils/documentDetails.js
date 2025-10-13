/**
 * Simple Document Details Helper
 * Provides simple utilities for handling document-specific additional fields
 */

/**
 * Common detail fields for documents that require additional information
 * Only Business Permit and Barangay Clearance need extra details
 */
const COMMON_DETAILS_FIELDS = {
  'Business Permit Clearance': [
    'business_name',
    'business_address',
  ]
}

/**
 * Get expected detail fields for a document type
 * @param {string} documentType - Document type title
 * @returns {array} Array of field names
 */
const getDetailFields = (documentType) => {
  return COMMON_DETAILS_FIELDS[documentType] || []
}

/**
 * Parse details JSON string safely
 * @param {string} detailsString - JSON string from database
 * @returns {object} Parsed details object or empty object
 */
const parseDetails = (detailsString) => {
  if (!detailsString) return {}
  
  try {
    return JSON.parse(detailsString)
  } catch (error) {
    console.error('Error parsing details JSON:', error)
    return {}
  }
}

/**
 * Convert details object to JSON string safely
 * @param {object} detailsObject - Details object
 * @returns {string|null} JSON string or null
 */
const stringifyDetails = (detailsObject) => {
  if (!detailsObject || typeof detailsObject !== 'object' || Object.keys(detailsObject).length === 0) {
    return null
  }
  
  try {
    return JSON.stringify(detailsObject)
  } catch (error) {
    console.error('Error stringifying details:', error)
    return null
  }
}

/**
 * Simple validation for details object
 * @param {string} documentType - Document type title
 * @param {object} details - Details object to validate
 * @returns {object} Validation result
 */
const validateDetails = (documentType, details) => {
  const errors = []
  
  if (!details) {
    return { isValid: true, errors: [] }
  }
  
  // Business Permit Clearance requires business_name and business_address
  if (documentType === 'Business Permit Clearance') {
    if (!details.business_name || !details.business_name.trim()) {
      errors.push('Business name is required for Business Permit Clearance')
    }
    if (!details.business_address || !details.business_address.trim()) {
      errors.push('Business address is required for Business Permit Clearance')
    }
  }
  
  // Barangay Clearance no longer requires additional details
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate a specific field value
 * @param {string} fieldName - Field name to validate
 * @param {string} value - Value to validate
 * @returns {object} Validation result with isValid and message
 */
const validateDetailField = (fieldName, value) => {
  const Validator = require('./validator')
  
  switch (fieldName) {
    case 'business_name':
      const businessNameValidation = Validator.validateBusinessName(value)
      return {
        isValid: businessNameValidation.isValid,
        message: businessNameValidation.errors.join(', ')
      }
    
    case 'business_address':
      const addressValidation = Validator.validateAddress(value)
      return {
        isValid: addressValidation.isValid,
        message: addressValidation.errors.join(', ')
      }
    
    default:
      return { isValid: true, message: '' }
  }
}

/**
 * Clean and sanitize details object with field validation
 * @param {object} details - Raw details object
 * @returns {object} Cleaned details object with validation errors
 */
const sanitizeDetails = (details) => {
  if (!details || typeof details !== 'object') return { cleaned: null, validationErrors: [] }
  
  const cleaned = {}
  const validationErrors = []
  
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string' && value.trim()) {
      // Validate field format
      const validation = validateDetailField(key, value)
      if (!validation.isValid) {
        validationErrors.push(validation.message)
      }
      
      // Basic sanitization - remove potentially harmful characters
      cleaned[key] = value.trim().replace(/[<>'"&]/g, '')
    }
  }
  
  return {
    cleaned: Object.keys(cleaned).length > 0 ? cleaned : null,
    validationErrors
  }
}

module.exports = {
  COMMON_DETAILS_FIELDS,
  getDetailFields,
  parseDetails,
  stringifyDetails,
  validateDetails,
  validateDetailField,
  sanitizeDetails
}
