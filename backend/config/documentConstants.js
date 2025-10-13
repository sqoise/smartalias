/**
 * Document Type Constants for Backend
 * Centralized document type mappings and configurations
 */

/**
 * Document type mappings for internal keys to display names
 */
const DOCUMENT_TYPES = {
  'electrical_permit': 'Electrical Permit',
  'fence_permit': 'Fence Permit',
  'excavation_permit': 'Excavation Permit',
  'barangay_clearance': 'Barangay Clearance',
  'certificate_of_residency': 'Certificate of Residency',
  'certificate_of_good_moral': 'Certificate of Good Moral',
  'certificate_of_indigency_medical': 'Certificate of Indigency (Medical)',
  'certificate_of_indigency_financial': 'Certificate of Indigency (Financial)',
  'business_permit_clearance': 'Business Permit Clearance'
}

/**
 * Reverse mapping from display names to internal keys
 */
const DOCUMENT_TYPE_KEYS = {
  'Electrical Permit': 'electrical_permit',
  'Fence Permit': 'fence_permit',
  'Excavation Permit': 'excavation_permit',
  'Barangay Clearance': 'barangay_clearance',
  'Certificate of Residency': 'certificate_of_residency',
  'Certificate of Good Moral': 'certificate_of_good_moral',
  'Certificate of Indigency (Medical)': 'certificate_of_indigency_medical',
  'Certificate of Indigency (Financial)': 'certificate_of_indigency_financial',
  'Business Permit Clearance': 'business_permit_clearance'
}

/**
 * Format document type from internal key to display name
 * @param {string} type - Internal document type key
 * @returns {string} - Formatted display name
 */
const formatDocumentType = (type) => {
  return DOCUMENT_TYPES[type] || type
}

/**
 * Get document type key from display name
 * @param {string} displayName - Document type display name
 * @returns {string} - Internal document type key
 */
const getDocumentTypeKey = (displayName) => {
  return DOCUMENT_TYPE_KEYS[displayName] || displayName
}

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_KEYS,
  formatDocumentType,
  getDocumentTypeKey
}
