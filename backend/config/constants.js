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

module.exports = {
  USER_ROLES,
  PASSWORD_STATUS,
  ACCOUNT_STATUS,
  LOGIN_SECURITY
}
