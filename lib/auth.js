import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.PASSWORD_SALT

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { valid: true, payload: decoded }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

export function generateToken(payload) {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
  return jwt.sign(tokenPayload, JWT_SECRET)
}

// Middleware-like function to check if user needs password change
export function requirePasswordChanged(token) {
  const verification = verifyToken(token)
  
  if (!verification.valid) {
    return { 
      allowed: false, 
      error: 'Invalid token',
      redirectTo: '/' 
    }
  }

  if (!verification.payload.passwordChanged) {
    return {
      allowed: false,
      error: 'Password change required',
      redirectTo: `/change-password?token=${token}`
    }
  }

  return {
    allowed: true,
    user: verification.payload
  }
}
