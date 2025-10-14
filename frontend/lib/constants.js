/**
 * Suffix name constants
 * Used for displaying and storing suffix values
 */
export const SUFFIX_OPTIONS = [
  { value: '', label: 'None' },
  { value: 1, label: 'Jr.' },
  { value: 2, label: 'Sr.' },
  { value: 3, label: 'II' },
  { value: 4, label: 'III' },
  { value: 5, label: 'IV' },
  { value: 6, label: 'V' }
]

/**
 * Get suffix label from numeric value
 * @param {number} value - Numeric suffix value
 * @returns {string} - Suffix label (e.g., 'Jr.', 'Sr.')
 */
export const getSuffixLabel = (value) => {
  const suffix = SUFFIX_OPTIONS.find(opt => opt.value === value)
  return suffix ? suffix.label : ''
}

/**
 * Get suffix value from label
 * @param {string} label - Suffix label
 * @returns {number} - Numeric suffix value
 */
export const getSuffixValue = (label) => {
  const suffix = SUFFIX_OPTIONS.find(opt => opt.label === label)
  return suffix ? suffix.value : ''
}

/**
 * User role constants
 * Used for role-based access control
 */
export const USER_ROLES = {
  ADMIN: 1,
  STAFF: 2,
  RESIDENT: 3
}

/**
 * Get role name from numeric value
 * @param {number} roleId - Numeric role ID
 * @returns {string} - Role name (e.g., 'admin', 'staff', 'resident')
 */
export const getRoleName = (roleId) => {
  const roleMap = {
    [USER_ROLES.ADMIN]: 'admin',
    [USER_ROLES.STAFF]: 'staff',
    [USER_ROLES.RESIDENT]: 'resident'
  }
  return roleMap[roleId] || 'unknown'
}

/**
 * Check if user has admin privileges
 * @param {number} roleId - Numeric role ID
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (roleId) => roleId === USER_ROLES.ADMIN

/**
 * Check if user has staff privileges (staff or admin)
 * @param {number} roleId - Numeric role ID
 * @returns {boolean} - True if user is staff or admin
 */
export const isStaff = (roleId) => roleId === USER_ROLES.STAFF || roleId === USER_ROLES.ADMIN

// ==========================================================================
// AUTHENTICATION MESSAGES
// ==========================================================================

export const AUTH_MESSAGES = {
  // Username validation
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_SHORT: 'Username must be at least 8 characters',
  USERNAME_TOO_LONG: 'Username must be at most 32 characters',
  USERNAME_NOT_FOUND: 'Username is not registered. Please register or visit barangay office.',
  USERNAME_INVALID_FORMAT: 'Username can only contain letters, numbers, dots, and underscores',
  USERNAME_CONNECTION_ERROR: 'Unable to connect to server. Please check your connection.',
  USERNAME_VALIDATION_FAILED: 'Username validation failed',

  // PIN validation
  PIN_REQUIRED: 'PIN is required',
  PIN_INVALID_LENGTH: 'PIN must be exactly 6 digits',
  PIN_INVALID_FORMAT: 'PIN must contain only numbers',
  PIN_CURRENT_INCORRECT: 'Current PIN is incorrect',

  // Login process
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  LOGIN_SUCCESS: 'Welcome! Redirecting...',
  PIN_CHANGE_REQUIRED: 'PIN change required. Redirecting...',

  // Change PIN process
  PIN_CHANGE_INVALID: 'PIN must be exactly 6 digits',
  PIN_MISMATCH: 'PINs do not match',
  PIN_CHANGE_SUCCESS: 'PIN changed successfully! Redirecting to login...',
  PIN_CHANGE_FAILED: 'Failed to change PIN. Please try again.',

  // Network/Server errors
  SERVER_ERROR: 'Server error occurred. Please try again.',
  CONNECTION_ERROR: 'Unable to connect to server. Please check your connection.',
  VALIDATION_RETRY: 'Unable to validate. Please try again.',
  NETWORK_ERROR: 'Network error. Please try again.',
  
  // Authentication errors
  UNAUTHORIZED: 'Access denied. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // User management
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid username or PIN',
  
  // General validation
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELDS: 'Missing required fields'
}

// ==========================================================================
// APPLICATION CONFIGURATION
// ==========================================================================

export const APP_CONFIG = {
  // Application Information
  NAME: 'Smart LIAS',
  VERSION: '1.0.0',
  DESCRIPTION: 'Digital Barangay Management System',
  
  // API Configuration
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api',
    UPLOADS_URL: process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:9000/uploads',
    TIMEOUT: 10000, // 10 seconds
  },

  // Development Origins - allowed domains for development
  ALLOWED_DEV_ORIGINS: [
    'http://localhost:3000',      // Next.js dev server
    'http://127.0.0.1:3000',      // Alternative localhost
    'http://localhost:9000',      // Backend dev server
    'http://127.0.0.1:9000',      // Alternative localhost
  ],

  // Production Origins - allowed domains for production
  ALLOWED_PROD_ORIGINS: [
    'https://smartlias.com',      // Production domain (example)
    'https://www.smartlias.com',  // www subdomain
  ]
}

// ==========================================================================
// ANNOUNCEMENT TYPE CONSTANTS (for display mapping)
// ==========================================================================

export const ANNOUNCEMENT_TYPE_NAMES = {
  1: 'General',
  2: 'Health',
  3: 'Activities',
  4: 'Assistance',
  5: 'Advisory'
}

// ==========================================================================
// DOCUMENT TYPE CONSTANTS
// ==========================================================================

/**
 * Document type mappings for internal keys to display names
 * Used across the application for consistent document type handling
 */
export const DOCUMENT_TYPES = {
  'electrical_permit': 'Electrical Permit',
  'fence_permit': 'Fence Permit',
  'excavation_permit': 'Excavation Permit',
  'barangay_clearance': 'Barangay Clearance',
  'indigency_medical': 'Certificate of Indigency (Medical)',
  'indigency_financial': 'Certificate of Indigency (Financial)',
  'business_permit': 'Business Permit'
}

/**
 * Reverse mapping from display names to internal keys
 * Used for converting form inputs back to database format
 */
export const DOCUMENT_TYPE_KEYS = {
  'Electrical Permit': 'electrical_permit',
  'Fence Permit': 'fence_permit',
  'Excavation Permit': 'excavation_permit',
  'Barangay Clearance': 'barangay_clearance',
  'Certificate of Indigency (Medical)': 'indigency_medical',
  'Certificate of Indigency (Financial)': 'indigency_financial',
  'Business Permit Clearance': 'business_permit'
}

/**
 * Available templates for DOCX generation
 * Documents that have actual template files available
 */
export const AVAILABLE_TEMPLATES = [
  'electrical_permit',
  'fence_permit',
  'excavation_permit',
  'indigency_medical',
  'indigency_financial',
  'business_permit',
  'barangay_clearance',
]

/**
 * Document type options for dropdowns/filters
 * Format: [{ value, label }] for form components
 * Values match database document_catalog.title format (display names)
 */
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'Electrical Permit', label: 'Electrical Permit' },
  { value: 'Fence Permit', label: 'Fence Permit' },
  { value: 'Excavation Permit', label: 'Excavation Permit' },
  { value: 'Barangay Clearance', label: 'Barangay Clearance' },
  { value: 'Certificate of Indigency (Medical)', label: 'Certificate of Indigency (Medical)' },
  { value: 'Certificate of Indigency (Financial)', label: 'Certificate of Indigency (Financial)' },
  { value: 'Business Permit Clearance', label: 'Business Permit Clearance' }
]

/**
 * Format document type from internal key to display name
 * @param {string} type - Internal document type key
 * @returns {string} - Formatted display name
 */
export const formatDocumentType = (type) => {
  return DOCUMENT_TYPES[type] || type
}

/**
 * Get document type key from display name
 * @param {string} displayName - Document type display name
 * @returns {string} - Internal document type key
 */
export const getDocumentTypeKey = (displayName) => {
  return DOCUMENT_TYPE_KEYS[displayName] || displayName
}

/**
 * Check if a document type has an available DOCX template
 * This now checks if the document has a filename field in the database
 * @param {string} documentType - Document type title (e.g., 'Electrical Permit')
 * @returns {boolean} - True if template filename exists
 * 
 * Note: This function now relies on the document data fetched from the API
 * which includes the filename field from the database. If you have the full
 * document object, check: document.filename !== null && document.filename !== ''
 */
export const checkDocxTemplate = (documentType) => {
  // For backward compatibility, check against known templates
  // In the future, this should be replaced with API call or prop-based check
  const normalizedType = DOCUMENT_TYPE_KEYS[documentType] || documentType
  return AVAILABLE_TEMPLATES.includes(normalizedType)
  
  // TODO: Replace with API-based check or pass filename as prop
  // return filename !== null && filename !== '' && filename !== undefined
}

/**
 * Purpose options based on document type
 * Used in document request forms
 */
export const DOCUMENT_PURPOSE_OPTIONS = {
  'Electrical Permit': [
    'Home renovation',
    'New electrical installation',
    'Electrical repair',
    'Business establishment'
  ],
  'Fence Permit': [
    'Property boundary',
    'Security purposes',
    'Privacy fence',
    'Property development'
  ],
  'Excavation Permit': [
    'Foundation construction',
    'Utility installation',
    'Landscaping project',
    'Property development'
  ],
  'Barangay Clearance': [
    'Employment requirement',
    'Travel abroad',
    'Bank loan application',
    'Business permit',
    'School enrollment',
    'Government transaction'
  ],
  'Certificate of Indigency (Medical)': [
    'Medical assistance',
    'Hospital bills',
    'Medicine assistance',
    'Health services'
  ],
  'Certificate of Indigency (Financial)': [
    'Financial assistance',
    'Educational support',
    'Emergency aid',
    'Social services'
  ],
  'Business Permit Clearance': [
    'New business',
    'Business renewal',
    'Business expansion',
    'Franchise application'
  ]
}

/**
 * Get purpose options for a specific document type
 * @param {string} documentType - Document type (display name)
 * @returns {Array} - Array of purpose options with value and label
 */
export const getPurposeOptions = (documentType) => {
  const purposeList = DOCUMENT_PURPOSE_OPTIONS[documentType] || ['General purpose']
  
  // Convert to options format for form components
  const options = purposeList.map(purpose => ({
    value: purpose,
    label: purpose
  }))
  
  // Add "Other" option
  options.push({
    value: 'Other',
    label: 'Other (specify in notes)'
  })
  
  return options
}
