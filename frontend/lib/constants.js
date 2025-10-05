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
