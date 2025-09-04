import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import { ROLE_TYPES, ROLE_NAMES, PASSWORD_STATUS, LOGIN_ATTEMPTS, getRoleName, generateDefaultPassword, isAccountLocked, shouldLockAccount, getLockoutEndTime, shouldResetAttempts, createErrorPageUrl, getManilaTimeString, getManilaTime } from '../../../../lib/constants'
import logger from '../../../../lib/logger'

const JWT_SECRET = process.env.PASSWORD_SALT || 'demo-secret-key'

export async function POST(request) {
  let username = 'unknown'
  
  try {
    const { username: reqUsername, password } = await request.json()
    username = reqUsername

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Read users from JSON file
    const usersPath = `${process.cwd()}/data/users.json`
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    
    // Find user
    const user = usersData.users.find(u => u.username === username.toLowerCase())
    
    if (!user) {
      logger.securityEvent('Login failed - invalid username', { username, ip: request.headers.get('x-forwarded-for') })
      return NextResponse.json(
        { 
          error: 'Invalid username or password',
          redirectTo: createErrorPageUrl()
        },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const lockoutEnd = new Date(user.locked_until)
      const remainingMinutes = Math.ceil((lockoutEnd - getManilaTime()) / (1000 * 60))
      
      logger.securityEvent('Login attempt on locked account', { 
        username, 
        ip: request.headers.get('x-forwarded-for'),
        remainingLockoutMinutes: remainingMinutes 
      })
      
      return NextResponse.json(
        { 
          error: `Account temporarily locked. Please try again later.`,
          redirectTo: createErrorPageUrl()
        },
        { status: 423 } // 423 Locked
      )
    }

    // Reset failed attempts if outside time window
    if (shouldResetAttempts(user)) {
      user.failed_attempts = 0
      user.last_attempt = null
    }

    // For testing: check against default password if password not changed
    let isValidPassword = false
    let authMethod = ''
    
    if (user.password_changed === PASSWORD_STATUS.NOT_CHANGED) {
      // Check against default password (birthdate in mmddyy format)
      const defaultPassword = generateDefaultPassword(user.birthdate)
      authMethod = 'default_password'
      isValidPassword = password === defaultPassword
    } else {
      // Check against hashed password
      authMethod = 'bcrypt_hash'
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    }

    if (!isValidPassword) {
      // Update failed attempts
      const userIndex = usersData.users.findIndex(u => u.id === user.id)
      user.failed_attempts = (user.failed_attempts || 0) + 1
      user.last_attempt = getManilaTimeString()
      
      // Lock account if max attempts reached
      if (shouldLockAccount(user)) {
        user.locked_until = getLockoutEndTime()
        
        logger.securityEvent('Account locked due to failed attempts', { 
          username, 
          failedAttempts: user.failed_attempts,
          lockedUntil: user.locked_until,
          ip: request.headers.get('x-forwarded-for') 
        })
      } else {
        logger.securityEvent('Login failed - invalid password', { 
          username, 
          authMethod,
          failedAttempts: user.failed_attempts,
          attemptsRemaining: LOGIN_ATTEMPTS.MAX_ATTEMPTS - user.failed_attempts,
          ip: request.headers.get('x-forwarded-for') 
        })
      }
      
      // Update user data
      usersData.users[userIndex] = user
      fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2))
      
      const attemptsRemaining = LOGIN_ATTEMPTS.MAX_ATTEMPTS - user.failed_attempts
      const errorMessage = shouldLockAccount(user) 
        ? `Account temporarily locked due to multiple failed attempts. Please try again later.`
        : `Invalid username or password. Please try again.`
      
      const redirectUrl = shouldLockAccount(user)
        ? createErrorPageUrl()
        : createErrorPageUrl()
      
      return NextResponse.json(
        { 
          error: errorMessage,
          redirectTo: redirectUrl
        },
        { status: 401 }
      )
    }

    // Reset failed attempts on successful login
    const userIndex = usersData.users.findIndex(u => u.id === user.id)
    user.failed_attempts = 0
    user.locked_until = null
    user.last_attempt = null
    usersData.users[userIndex] = user
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2))

    // Log successful authentication
    logger.info('AUTH', 'Login successful', { 
      username, 
      userId: user.id, 
      role: getRoleName(user.role_type),
      authMethod
    })

    // Create JWT token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: getRoleName(user.role_type),
      roleType: user.role_type,
      passwordChanged: user.password_changed === PASSWORD_STATUS.CHANGED,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET)

    // Return response based on password change status
    if (user.password_changed === PASSWORD_STATUS.NOT_CHANGED) {
      return NextResponse.json({
        message: 'Password change required',
        token,
        redirectTo: `/change-password?token=${token}`,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: getRoleName(user.role_type),
          roleType: user.role_type,
          passwordChanged: false
        }
      })
    } else {
      const dashboardUrl = user.role_type === ROLE_TYPES.ADMIN ? '/admin' : '/resident'
      return NextResponse.json({
        message: 'Login successful',
        token,
        redirectTo: dashboardUrl,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: getRoleName(user.role_type),
          roleType: user.role_type,
          passwordChanged: true
        }
      })
    }

  } catch (error) {
    logger.error('AUTH', 'Login system error', { 
      username, 
      error: error.message
    })
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
