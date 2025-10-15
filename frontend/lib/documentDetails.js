/**
 * Frontend Document Details Helper
 * Simple utilities for handling document-specific fields in the frontend
 */

/**
 * Field labels and types for documents that require additional details
 * Only Business Permit Clearance and Barangay Clearance need extra fields
 */
export const DOCUMENT_DETAIL_FIELDS = {
  'Business Permit Clearance': {
    business_name: { label: 'Business Name', type: 'text', placeholder: 'Official business name', required: true },
    business_address: { label: 'Business Address', type: 'text', placeholder: 'Complete business address', required: true },
  }
}

/**
 * Get detail fields configuration for a document type
 * @param {string} documentType - Document type title
 * @returns {object} Fields configuration object
 */
export const getDetailFields = (documentType) => {
  return DOCUMENT_DETAIL_FIELDS[documentType] || {}
}

/**
 * Validate a specific field value
 * @param {string} fieldName - Field name to validate
 * @param {string} value - Value to validate
 * @returns {object} Validation result with isValid and message
 */
export const validateDetailField = (fieldName, value) => {
  if (!value || typeof value !== 'string') {
    return { isValid: true, message: '' } // Empty values are handled by required field validation
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { isValid: true, message: '' }
  }

  switch (fieldName) {
    case 'business_name':
      // Allow alphanumeric characters, spaces, and basic punctuation (similar to notes)
      const businessNameRegex = /^[a-zA-Z0-9\s.,!?()-]+$/
      if (!businessNameRegex.test(trimmed)) {
        return {
          isValid: false,
          message: 'Business name can only contain letters, numbers, spaces, and basic punctuation (.,!?()-)'
        }
      }
      if (trimmed.length > 200) {
        return {
          isValid: false,
          message: 'Business name must not exceed 200 characters'
        }
      }
      break
    
    case 'business_address':
      // Allow alphanumeric, spaces, and common address characters
      const addressRegex = /^[a-zA-Z0-9\s.,'\-\/#():]+$/
      if (!addressRegex.test(trimmed)) {
        return {
          isValid: false,
          message: 'Address can only contain letters, numbers, spaces, and common address characters (.,\'\\-/#():)'
        }
      }
      if (trimmed.length > 300) {
        return {
          isValid: false,
          message: 'Address must not exceed 300 characters'
        }
      }
      break
    
    default:
      return { isValid: true, message: '' }
  }
  
  return { isValid: true, message: '' }
}

/**
 * Validate notes field
 * @param {string} value - Notes value to validate
 * @returns {object} Validation result with isValid and message
 */
export const validateNotesField = (value) => {
  // Allow alphanumeric characters, spaces, and basic punctuation
  const allowedCharsRegex = /^[a-zA-Z0-9\s.,!?()-]*$/
  if (!allowedCharsRegex.test(value)) {
    return {
      isValid: false,
      message: 'Notes can only contain letters, numbers, spaces, and basic punctuation (.,!?()-)'
    }
  }
  
  return { isValid: true, message: '' }
}

/**
 * Check if document type has additional detail fields
 * @param {string} documentType - Document type title
 * @returns {boolean} True if has additional fields
 */
export const hasDetailFields = (documentType) => {
  const fields = getDetailFields(documentType)
  return Object.keys(fields).length > 0
}

/**
 * Get required field names for a document type
 * @param {string} documentType - Document type title
 * @returns {array} Array of required field names
 */
export const getRequiredFields = (documentType) => {
  const fields = getDetailFields(documentType)
  return Object.entries(fields)
    .filter(([_, config]) => config.required)
    .map(([fieldName, _]) => fieldName)
}

/**
 * Validate details object for frontend
 * @param {string} documentType - Document type title
 * @param {object} details - Details object
 * @returns {object} Validation result with errors by field
 */
export const validateDetails = (documentType, details) => {
  const errors = {}
  const fields = getDetailFields(documentType)
  
  // Check required fields and validate format
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (fieldConfig.required) {
      if (!details[fieldName] || !details[fieldName].toString().trim()) {
        errors[fieldName] = `${fieldConfig.label} is required`
        continue
      }
    }
    
    // Validate field format if value exists
    if (details[fieldName] && details[fieldName].toString().trim()) {
      const fieldValidation = validateDetailField(fieldName, details[fieldName])
      if (!fieldValidation.isValid) {
        errors[fieldName] = fieldValidation.message
      }
    }
    
    // Check numeric fields
    if (details[fieldName] && fieldConfig.type === 'number') {
      const value = parseFloat(details[fieldName])
      if (isNaN(value) || value < 0) {
        errors[fieldName] = `${fieldConfig.label} must be a valid positive number`
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Format details object for display
 * @param {string} documentType - Document type title  
 * @param {object} details - Details object
 * @returns {array} Array of formatted field displays
 */
export const formatDetailsForDisplay = (documentType, details) => {
  if (!details) return []
  
  const fields = getDetailFields(documentType)
  const formatted = []
  
  for (const [fieldName, value] of Object.entries(details)) {
    const fieldConfig = fields[fieldName]
    if (fieldConfig && value) {
      formatted.push({
        label: fieldConfig.label,
        value: value.toString()
      })
    }
  }
  
  return formatted
}

export default {
  DOCUMENT_DETAIL_FIELDS,
  getDetailFields,
  hasDetailFields,
  getRequiredFields,
  validateDetails,
  validateDetailField,
  validateNotesField,
  formatDetailsForDisplay
}
