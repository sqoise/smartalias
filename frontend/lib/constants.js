// Role constants - Using numeric IDs for faster comparison
export const ROLE_TYPES = {
  RESIDENT: 1,
  ADMIN: 2
}

// Role names for display and database mapping
export const ROLE_NAMES = {
  [ROLE_TYPES.RESIDENT]: 'Resident',
  [ROLE_TYPES.ADMIN]: 'Admin'
}

// Role mapping for backend compatibility (if needed)
export const ROLE_STRINGS = {
  [ROLE_TYPES.RESIDENT]: 'resident',
  [ROLE_TYPES.ADMIN]: 'admin'
}

// Reverse mapping from string to numeric ID
export const STRING_TO_ROLE = {
  'resident': ROLE_TYPES.RESIDENT,
  'admin': ROLE_TYPES.ADMIN
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

// Timezone constants
export const TIMEZONE = {
  MANILA: 'Asia/Manila'
}

// Username generation functions
export function generateUsernameFromName(firstName, lastName, existingUsers = []) {
  // Clean and format names
  const cleanFirstName = cleanNameForUsername(firstName)
  const cleanLastName = cleanNameForUsername(lastName)
  
  // Create base username
  const baseUsername = `${cleanFirstName}.${cleanLastName}`.toLowerCase()
  
  // Check for duplicates and add increment if needed
  return findAvailableUsername(baseUsername, existingUsers)
}

// Clean name by removing special characters and spaces
export function cleanNameForUsername(name) {
  if (!name) return ''
  
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z]/g, '') // Keep only letters
    .substring(0, 20) // Limit length
}

// Find available username with increment if needed
export function findAvailableUsername(baseUsername, existingUsers = []) {
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
export function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false
  
  // Allow letters, numbers, dots, and hyphens
  const pattern = /^[a-z0-9.-]+$/
  return pattern.test(username) && username.length >= 3 && username.length <= 50
}

// Manila timezone utility functions
export function getManilaTime() {
  return new Date(new Date().toLocaleString("en-US", {timeZone: TIMEZONE.MANILA}))
}

export function getManilaTimeString() {
  return getManilaTime().toISOString()
}

export function formatManilaTime(date = null) {
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
  return getManilaTime() < new Date(user.locked_until)
}

// Check if user should be locked after failed attempt
export function shouldLockAccount(user) {
  return user.failed_attempts >= LOGIN_ATTEMPTS.MAX_ATTEMPTS
}

// Calculate lockout end time using Manila timezone
export function getLockoutEndTime() {
  const lockoutEnd = getManilaTime()
  lockoutEnd.setMinutes(lockoutEnd.getMinutes() + LOGIN_ATTEMPTS.LOCKOUT_DURATION)
  return lockoutEnd.toISOString()
}

// Check if failed attempts should be reset (outside time window)
export function shouldResetAttempts(user) {
  if (!user.last_attempt) return false
  const lastAttempt = new Date(user.last_attempt)
  const now = getManilaTime()
  const timeDiff = (now - lastAttempt) / (1000 * 60) // minutes
  return timeDiff > LOGIN_ATTEMPTS.ATTEMPT_WINDOW
}

// Generate error page URL with custom message
// Helper function to redirect to login on errors
export const createErrorPageUrl = () => {
  return '/' // Just redirect to login page
}
