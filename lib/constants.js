// Role constants for database storage
export const ROLE_TYPES = {
  USER: 1,
  ADMIN: 2
}

// Role names for display and logic
export const ROLE_NAMES = {
  [ROLE_TYPES.USER]: 'User',
  [ROLE_TYPES.ADMIN]: 'Admin'
}

// Password change status constants
export const PASSWORD_STATUS = {
  NOT_CHANGED: 0,
  CHANGED: 1
}

// Login attempt protection constants
export const LOGIN_ATTEMPTS = {
  MAX_ATTEMPTS: 5,          // Max failed attempts before lockout
  LOCKOUT_DURATION: 15,     // Lockout duration in minutes
  ATTEMPT_WINDOW: 15        // Time window in minutes to reset attempts
}

// Helper functions
export function getRoleName(roleType) {
  return ROLE_NAMES[roleType] || 'Unknown'
}

export function getRoleType(roleName) {
  return Object.keys(ROLE_NAMES).find(key => ROLE_NAMES[key] === roleName) || null
}

export function isAdmin(roleType) {
  return roleType === ROLE_TYPES.ADMIN
}

export function isUser(roleType) {
  return roleType === ROLE_TYPES.USER
}

// Generate default password from birthdate (YYYY-MM-DD -> MMDDYY)
export function generateDefaultPassword(birthdate) {
  if (!birthdate) return null
  
  // Convert YYYY-MM-DD to MMDDYY
  const date = new Date(birthdate)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  
  return `${month}${day}${year}`
}

// Check if user account is locked due to failed attempts
export function isAccountLocked(user) {
  if (!user.locked_until) return false
  return new Date() < new Date(user.locked_until)
}

// Check if user should be locked after failed attempt
export function shouldLockAccount(user) {
  return user.failed_attempts >= LOGIN_ATTEMPTS.MAX_ATTEMPTS
}

// Calculate lockout end time
export function getLockoutEndTime() {
  const lockoutEnd = new Date()
  lockoutEnd.setMinutes(lockoutEnd.getMinutes() + LOGIN_ATTEMPTS.LOCKOUT_DURATION)
  return lockoutEnd.toISOString()
}

// Check if failed attempts should be reset (outside time window)
export function shouldResetAttempts(user) {
  if (!user.last_attempt) return false
  const lastAttempt = new Date(user.last_attempt)
  const now = new Date()
  const timeDiff = (now - lastAttempt) / (1000 * 60) // minutes
  return timeDiff > LOGIN_ATTEMPTS.ATTEMPT_WINDOW
}

// Generate error page URL with custom message
// Helper function to redirect to login on errors
export const createErrorPageUrl = () => {
  return '/' // Just redirect to login page
}
