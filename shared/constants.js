/**
 * SMARTLIAS - Shared Constants
 * Used by both frontend (Next.js) and backend (Express.js)
 * 
 * Contains all application constants including messages, roles, configuration, etc.
 * Single source of truth for consistent behavior across the entire application
 */

// ==========================================================================
// ROLE CONSTANTS
// ==========================================================================

const ROLE_TYPES = {
  RESIDENT: 1,
  ADMIN: 2
}

// Role names for display and database mapping
const ROLE_NAMES = {
  [ROLE_TYPES.RESIDENT]: 'Resident',
  [ROLE_TYPES.ADMIN]: 'Admin'
}

// Role mapping for backend compatibility
const ROLE_STRINGS = {
  [ROLE_TYPES.RESIDENT]: 'resident',
  [ROLE_TYPES.ADMIN]: 'admin'
}

// Reverse mapping from string to numeric ID
const STRING_TO_ROLE = {
  'resident': ROLE_TYPES.RESIDENT,
  'admin': ROLE_TYPES.ADMIN
}

// ==========================================================================
// AUTHENTICATION CONSTANTS
// ==========================================================================

const PASSWORD_STATUS = {
  NOT_CHANGED: 0,
  CHANGED: 1
}

// Login attempt protection constants
const LOGIN_ATTEMPTS = {
  MAX_ATTEMPTS: 5,          // Max failed attempts before lockout
  LOCKOUT_DURATION: 15,     // Lockout duration in minutes
  ATTEMPT_WINDOW: 15        // Time window in minutes to reset attempts
}

// ==========================================================================
// MESSAGE CONSTANTS
// ==========================================================================

const AUTH_MESSAGES = {
  // Username validation
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_SHORT: 'Username must be at least 8 characters',
  USERNAME_TOO_LONG: 'Username must be at most 32 characters',
  USERNAME_NOT_FOUND: 'Username is not registered. Please visit Barangay Office.',
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

const FIELD_ERRORS = {
  // Boolean flags for field error states (red styling)
  USERNAME_ERROR: 'username_error',
  PIN_ERROR: 'pin_error',
  CONNECTION_ERROR: 'connection_error'
}

const HTTP_STATUS_MESSAGES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden', 
  404: 'Not Found',
  422: 'Validation Failed',
  500: 'Internal Server Error'
}

// ==========================================================================
// TIMEZONE CONSTANTS
// ==========================================================================

const TIMEZONE = {
  MANILA: 'Asia/Manila'
}

// ==========================================================================
// APPLICATION CONFIGURATION
// ==========================================================================

const APP_CONFIG = {
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
    'http://0.0.0.0:3000',        // Docker/network access
    'http://192.168.1.3:3000',  // Local network (adjust IP as needed)
    'http://10.0.0.100:3000',     // Alternative local network
  ],

  // Production Origins - allowed domains for production
  ALLOWED_PROD_ORIGINS: [
    'https://smartlias.vercel.app',
    'https://smartlias.netlify.app', 
    'https://yourdomain.com',
    // Add your production domains here
  ],

  // Environment Detection
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Feature Flags
  FEATURES: {
    USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
    ENABLE_LOGGING: process.env.NODE_ENV === 'development',
    ENABLE_DEBUG: process.env.NEXT_PUBLIC_DEBUG === 'true',
  },
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

// Username generation functions
function generateUsernameFromName(firstName, lastName, existingUsers = []) {
  // Clean and format names
  const cleanFirstName = cleanNameForUsername(firstName)
  const cleanLastName = cleanNameForUsername(lastName)
  
  // Create base username
  const baseUsername = `${cleanFirstName}.${cleanLastName}`.toLowerCase()
  
  // Check for duplicates and add increment if needed
  return findAvailableUsername(baseUsername, existingUsers)
}

// Clean name by removing special characters and spaces
function cleanNameForUsername(name) {
  if (!name) return ''
  
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z]/g, '') // Keep only letters
    .substring(0, 20) // Limit length
}

// Find available username with increment if needed
function findAvailableUsername(baseUsername, existingUsers = []) {
  const existingUsernames = existingUsers.map(user => user.username?.toLowerCase())
  
  // If base username is available, use it
  if (!existingUsernames.includes(baseUsername)) {
    return baseUsername
  }
  
  // Find next available increment
  let increment = 2
  let newUsername = `${baseUsername}${increment}`
  
  while (existingUsernames.includes(newUsername)) {
    increment++
    newUsername = `${baseUsername}${increment}`
  }
  
  return newUsername
}

// Validate username format
function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false
  
  // Allow letters, numbers, dots, and hyphens
  const pattern = /^[a-z0-9.-]+$/
  return pattern.test(username) && username.length >= 3 && username.length <= 50
}

// Manila timezone utility functions
function getManilaTime() {
  return new Date(new Date().toLocaleString("en-US", {timeZone: TIMEZONE.MANILA}))
}

function getManilaTimeString() {
  return getManilaTime().toISOString()
}

function formatManilaTime(date = null) {
  const targetDate = date ? new Date(date) : new Date()
  return targetDate.toLocaleString("en-US", {
    timeZone: TIMEZONE.MANILA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// Helper functions
function getRoleName(roleType) {
  return ROLE_NAMES[roleType] || 'Unknown'
}

function getRoleType(roleName) {
  return Object.keys(ROLE_NAMES).find(key => ROLE_NAMES[key] === roleName) || null
}

function isAdmin(roleType) {
  return roleType === ROLE_TYPES.ADMIN
}

function isUser(roleType) {
  return roleType === ROLE_TYPES.USER
}

// Generate default password from birthdate (YYYY-MM-DD -> MMDDYY)
function generateDefaultPassword(birthdate) {
  if (!birthdate) return null
  
  // Convert YYYY-MM-DD to MMDDYY
  const date = new Date(birthdate)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  
  return `${month}${day}${year}`
}

// Check if user account is locked due to failed attempts
function isAccountLocked(user) {
  if (!user.locked_until) return false
  return getManilaTime() < new Date(user.locked_until)
}

// Check if user should be locked after failed attempt
function shouldLockAccount(user) {
  return user.failed_attempts >= LOGIN_ATTEMPTS.MAX_ATTEMPTS
}

// Calculate lockout end time using Manila timezone
function getLockoutEndTime() {
  const lockoutEnd = getManilaTime()
  lockoutEnd.setMinutes(lockoutEnd.getMinutes() + LOGIN_ATTEMPTS.LOCKOUT_DURATION)
  return lockoutEnd.toISOString()
}

// Check if failed attempts should be reset (outside time window)
function shouldResetAttempts(user) {
  if (!user.last_attempt) return false
  const lastAttempt = new Date(user.last_attempt)
  const now = getManilaTime()
  const timeDiff = (now - lastAttempt) / (1000 * 60) // minutes
  return timeDiff > LOGIN_ATTEMPTS.ATTEMPT_WINDOW
}

// Generate error page URL with custom message
function createErrorPageUrl() {
  return '/' // Just redirect to login page
}

// Get allowed origins based on environment
function getAllowedOrigins() {
  if (APP_CONFIG.IS_DEVELOPMENT) {
    return APP_CONFIG.ALLOWED_DEV_ORIGINS
  }
  return APP_CONFIG.ALLOWED_PROD_ORIGINS
}

// Check if current origin is allowed (frontend only)
function isOriginAllowed(origin) {
  if (typeof window === 'undefined') return true // Server-side always allowed
  const currentOrigin = origin || window?.location?.origin
  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(currentOrigin)
}

// Get current environment
function getEnvironment() {
  return {
    isDevelopment: APP_CONFIG.IS_DEVELOPMENT,
    isProduction: APP_CONFIG.IS_PRODUCTION,
    nodeEnv: process.env.NODE_ENV,
  }
}

// Log allowed origins for debugging (frontend only)
function logAllowedOrigins() {
  if (typeof window !== 'undefined' && APP_CONFIG.FEATURES.ENABLE_LOGGING) {
    console.log('🌐 Allowed Origins:', getAllowedOrigins())
    console.log('📍 Current Origin:', window?.location?.origin)
    console.log('✅ Origin Allowed:', isOriginAllowed())
  }
}

// ==========================================================================
// EXPORTS (Both CommonJS and ES6 compatible)
// ==========================================================================

const constants = {
  // Role constants
  ROLE_TYPES,
  ROLE_NAMES,
  ROLE_STRINGS,
  STRING_TO_ROLE,
  
  // Authentication constants
  PASSWORD_STATUS,
  LOGIN_ATTEMPTS,
  
  // Message constants
  AUTH_MESSAGES,
  FIELD_ERRORS,
  HTTP_STATUS_MESSAGES,
  
  // Timezone constants
  TIMEZONE,
  
  // Application configuration
  APP_CONFIG,
  
  // Utility functions
  generateUsernameFromName,
  cleanNameForUsername,
  findAvailableUsername,
  isValidUsername,
  getManilaTime,
  getManilaTimeString,
  formatManilaTime,
  getRoleName,
  getRoleType,
  isAdmin,
  isUser,
  generateDefaultPassword,
  isAccountLocked,
  shouldLockAccount,
  getLockoutEndTime,
  shouldResetAttempts,
  createErrorPageUrl,
  getAllowedOrigins,
  isOriginAllowed,
  getEnvironment,
  logAllowedOrigins
}

// Export for both CommonJS (Node.js/Backend) and ES6 (Frontend)
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS export for Node.js (Backend)
  module.exports = constants
} else {
  // ES6 export for Frontend (will be converted by bundler)
  if (typeof window !== 'undefined') {
    window.SMARTLIAS_CONSTANTS = constants
  }
}

// ES6 export (for modern bundlers)
export default constants

// Named exports for convenience
export {
  ROLE_TYPES,
  ROLE_NAMES,
  ROLE_STRINGS,
  STRING_TO_ROLE,
  PASSWORD_STATUS,
  LOGIN_ATTEMPTS,
  AUTH_MESSAGES,
  FIELD_ERRORS,
  HTTP_STATUS_MESSAGES,
  TIMEZONE,
  APP_CONFIG,
  generateUsernameFromName,
  cleanNameForUsername,
  findAvailableUsername,
  isValidUsername,
  getManilaTime,
  getManilaTimeString,
  formatManilaTime,
  getRoleName,
  getRoleType,
  isAdmin,
  isUser,
  generateDefaultPassword,
  isAccountLocked,
  shouldLockAccount,
  getLockoutEndTime,
  shouldResetAttempts,
  createErrorPageUrl,
  getAllowedOrigins,
  isOriginAllowed,
  getEnvironment,
  logAllowedOrigins
}
