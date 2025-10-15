/**
 * Backend Constants
 * Backend-specific constants for SMARTLIAS API
 */

// User role constants (numeric values stored in database)
const USER_ROLES = {
  ADMIN: 1,
  STAFF: 2,
  RESIDENT: 3
}

// Password change status
const PASSWORD_STATUS = {
  NOT_CHANGED: 0,
  CHANGED: 1
}

// Account status
const ACCOUNT_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1
}

// Login security constants
const LOGIN_SECURITY = {
  MAX_ATTEMPTS: 10,
  LOCKOUT_TIME_MS: 15 * 60 * 1000, // 15 minutes
  JWT_EXPIRES_IN: '24h'
}

// Announcement type constants (numeric values stored in database)
const ANNOUNCEMENT_TYPES = {
  GENERAL: 1,      // Regular announcements
  HEALTH: 2,       // Medical services, health programs
  ACTIVITIES: 3,   // Events, sports, workshops
  ASSISTANCE: 4,   // Financial aid, PWD support, social services
  ADVISORY: 5      // Important notices, alerts, warnings
}

// Announcement type names for display
const ANNOUNCEMENT_TYPE_NAMES = {
  [ANNOUNCEMENT_TYPES.GENERAL]: 'General',
  [ANNOUNCEMENT_TYPES.HEALTH]: 'Health',
  [ANNOUNCEMENT_TYPES.ACTIVITIES]: 'Activities',
  [ANNOUNCEMENT_TYPES.ASSISTANCE]: 'Assistance',
  [ANNOUNCEMENT_TYPES.ADVISORY]: 'Advisory'
}

// Reverse mapping from name to numeric ID
const ANNOUNCEMENT_NAME_TO_TYPE = {
  'general': ANNOUNCEMENT_TYPES.GENERAL,
  'health': ANNOUNCEMENT_TYPES.HEALTH,
  'activities': ANNOUNCEMENT_TYPES.ACTIVITIES,
  'assistance': ANNOUNCEMENT_TYPES.ASSISTANCE,
  'advisory': ANNOUNCEMENT_TYPES.ADVISORY
}

// Helper function to get announcement type name
const getAnnouncementTypeName = (typeId) => {
  return ANNOUNCEMENT_TYPE_NAMES[typeId] || 'Unknown'
}

// Helper function to get announcement type ID from name
const getAnnouncementTypeId = (typeName) => {
  return ANNOUNCEMENT_NAME_TO_TYPE[typeName?.toLowerCase()] || ANNOUNCEMENT_TYPES.GENERAL
}

// ==========================================================================
// MESSAGE CONSTANTS
// ==========================================================================

const AUTH_MESSAGES = {
  // Username validation
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_SHORT: 'Username must be at least 8 characters',
  USERNAME_TOO_LONG: 'Username must be at most 32 characters',
  USERNAME_NOT_FOUND: 'Username is not registered',
  USERNAME_INVALID_FORMAT: 'Username can only contain letters, numbers, dots, and underscores',
  
  // PIN validation
  PIN_REQUIRED: 'PIN is required',
  PIN_INVALID_LENGTH: 'PIN must be exactly 6 digits',
  PIN_INVALID_FORMAT: 'PIN must contain only numbers',
  PIN_CURRENT_INCORRECT: 'Current PIN is incorrect',

  // Login process
  LOGIN_FAILED: 'Login failed. Invalid credentials.',
  LOGIN_SUCCESS: 'Login successful',
  
  // Change PIN process
  PIN_CHANGE_SUCCESS: 'PIN changed successfully',
  PIN_CHANGE_FAILED: 'Failed to change PIN',

  // Authentication errors
  UNAUTHORIZED: 'Access denied. Authentication required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  TOKEN_INVALID: 'Invalid authentication token',
  TOKEN_EXPIRED: 'Authentication token has expired',
  
  // User management
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid username or PIN',
  ACCOUNT_LOCKED: 'Account is locked due to too many failed attempts',
  
  // General validation
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  VALIDATION_FAILED: 'Validation failed'
}

const HTTP_STATUS_MESSAGES = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden', 
  404: 'Not Found',
  422: 'Validation Failed',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
}

module.exports = {
  USER_ROLES,
  PASSWORD_STATUS,
  ACCOUNT_STATUS,
  LOGIN_SECURITY,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_TYPE_NAMES,
  ANNOUNCEMENT_NAME_TO_TYPE,
  AUTH_MESSAGES,
  HTTP_STATUS_MESSAGES,
  getAnnouncementTypeName,
  getAnnouncementTypeId
}
