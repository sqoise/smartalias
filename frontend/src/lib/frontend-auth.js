// Frontend-only data management and authentication utilities
import usersData from '../data/users.json'
import residentsData from '../data/residents.json'

// Simple password validation (replace bcrypt for demo)
function validatePassword(plainPassword, hashedPassword) {
  // For demo purposes, we'll use simple comparison
  // In real frontend-only apps, you'd typically handle this differently
  const demoPasswords = {
    '$2b$12$XyxGtsQ8368m9SqmA3A5Ie/X0t0Cptg/MPFIvdtpkw/GFTAsMyy32': 'password123',
    '$2b$12$KQPUfuuGHGb4X2uhfAlIKOQVKIys2laotmFRvWVY.8w8MIk83dYuy': 'password123',
    '$2b$12$V.ns/T6MHuZ1IG.Fh9f1FunbwPOySprB/aQxYpAlkaqNhVGJk3Rp.': 'newpassword123',
    '$2b$12$samplehash1234567890abcdef': 'password123',
    '$2b$12$samplehash2345678901bcdefg': 'password123',
    '$2b$12$samplehash3456789012cdefgh': 'password123'
  }
  return demoPasswords[hashedPassword] === plainPassword
}

// Role types
export const ROLE_TYPES = {
  RESIDENT: 1,
  ADMIN: 2
}

export const ROLE_NAMES = {
  1: 'Resident',
  2: 'Admin'
}

// Get role name
export function getRoleName(roleType) {
  return ROLE_NAMES[roleType] || 'Unknown'
}

// Account locking utilities
function isAccountLocked(user) {
  if (!user.locked_until) return false
  return new Date(user.locked_until) > new Date()
}

function shouldLockAccount(attempts) {
  return attempts >= 3
}

// Local storage keys
const STORAGE_KEYS = {
  USER_SESSION: 'smartlias_user_session',
  USERS_DATA: 'smartlias_users_data'
}

// Initialize users data in localStorage if not exists
function initializeUsersData() {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS_DATA)
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.USERS_DATA, JSON.stringify(usersData.users))
  }
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DATA))
}

// Get users data from localStorage
function getUsersData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DATA) || '[]')
}

// Update users data in localStorage
function updateUsersData(users) {
  localStorage.setItem(STORAGE_KEYS.USERS_DATA, JSON.stringify(users))
}

// Find user by username
function findUserByUsername(username) {
  const users = getUsersData()
  return users.find(user => user.username === username)
}

// Update user data
function updateUser(updatedUser) {
  const users = getUsersData()
  const index = users.findIndex(user => user.id === updatedUser.id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser }
    updateUsersData(users)
    return users[index]
  }
  return null
}

// Generate JWT-like token (frontend only - not secure for production)
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role_type,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
  // Simple base64 encoding for demo (not secure)
  return btoa(JSON.stringify(payload))
}

// Validate token
function validateToken(token) {
  try {
    const payload = JSON.parse(atob(token))
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (payload.exp && currentTime > payload.exp) {
      return { valid: false, error: 'Token expired' }
    }
    
    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: 'Invalid token' }
  }
}

// Authentication functions
export const auth = {
  // Login function
  login: async (username, password) => {
    // Initialize data if needed
    initializeUsersData()
    
    // Input validation
    if (!username || !password) {
      return {
        success: false,
        error: 'Username and password are required'
      }
    }

    // Find user
    const user = findUserByUsername(username.trim())
    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password'
      }
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      return {
        success: false,
        error: 'Account is temporarily locked due to multiple failed attempts'
      }
    }

    // Validate password
    const isValidPassword = validatePassword(password, user.password_hash)
    
    if (!isValidPassword) {
      // Update failed attempts
      const newAttempts = (user.failed_attempts || 0) + 1
      let updateData = {
        failed_attempts: newAttempts,
        last_attempt: new Date().toISOString()
      }

      // Lock account if too many attempts
      if (shouldLockAccount(newAttempts)) {
        updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }

      updateUser({ ...user, ...updateData })

      return {
        success: false,
        error: 'Invalid username or password'
      }
    }

    // Reset failed attempts on successful login
    updateUser({
      ...user,
      failed_attempts: 0,
      locked_until: null,
      last_attempt: new Date().toISOString()
    })

    // Generate token and create session
    const token = generateToken(user)
    const session = {
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_type,
        passwordChanged: user.password_changed
      },
      loginTime: new Date().toISOString()
    }

    // Store session
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session))

    // Determine redirect based on password status and role
    let redirectTo = '/'
    if (!user.password_changed) {
      // Generate password reset token
      const resetToken = generateToken({
        ...user,
        purpose: 'password_reset'
      })
      redirectTo = `/change-password?token=${resetToken}`
    } else if (user.role_type === ROLE_TYPES.ADMIN) {
      redirectTo = '/admin'
    } else {
      redirectTo = '/'
    }

    return {
      success: true,
      redirectTo,
      user: session.user
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION)
    return { success: true }
  },

  // Get current session
  getSession: () => {
    const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION)
    if (!session) return null

    try {
      const parsed = JSON.parse(session)
      const tokenValidation = validateToken(parsed.token)
      
      if (!tokenValidation.valid) {
        localStorage.removeItem(STORAGE_KEYS.USER_SESSION)
        return null
      }

      return parsed
    } catch (error) {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION)
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return auth.getSession() !== null
  },

  // Set new password
  setPassword: async (token, newPassword) => {
    const tokenValidation = validateToken(token)
    
    if (!tokenValidation.valid) {
      return {
        success: false,
        error: 'Invalid or expired token'
      }
    }

    const { payload } = tokenValidation
    const user = findUserByUsername(payload.username)
    
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Validate password requirements
    const passwordValidation = {
      length: newPassword?.length >= 8,
      number: /\d/.test(newPassword),
      special: /[!@#$%^&().?]/.test(newPassword)
    }

    if (!passwordValidation.length || !passwordValidation.number || !passwordValidation.special) {
      return {
        success: false,
        error: 'Password must be at least 8 characters with 1 number and 1 special character'
      }
    }

    // For demo, we'll store a simple hash (in real apps, you'd handle this differently)
    const newHash = `$2b$12$demo_${btoa(newPassword)}_hash`

    // Update user password
    const updatedUser = updateUser({
      ...user,
      password_hash: newHash,
      password_changed: 1
    })

    if (!updatedUser) {
      return {
        success: false,
        error: 'Failed to update password'
      }
    }

    // Determine redirect based on role
    const redirectTo = updatedUser.role_type === ROLE_TYPES.ADMIN ? '/admin' : '/'

    return {
      success: true,
      redirectTo
    }
  }
}

// Residents data management (demo)
export const residents = {
  getAll: () => {
    // Return demo residents data from JSON file
    return residentsData || []
  }
}

// Initialize data on module load
if (typeof window !== 'undefined') {
  initializeUsersData()
}
