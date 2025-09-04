import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import { verifyToken, generateToken } from '../../../../lib/auth'
import { ROLE_TYPES, PASSWORD_STATUS, getRoleName, createErrorPageUrl } from '../../../../lib/constants'
import logger from '../../../../lib/logger'

export async function POST(request) {
  let username = 'unknown'
  
  try {
    const { newPassword, token } = await request.json()

    if (!newPassword || !token) {
      return NextResponse.json(
        { error: 'Password and token are required' },
        { status: 400 }
      )
    }

    // Verify token
    const verification = verifyToken(token)
    if (!verification.valid) {
      logger.securityEvent('Invalid token used for password change', { 
        ip: request.headers.get('x-forwarded-for')
      })
      return NextResponse.json(
        { 
          error: 'Invalid or expired token',
          redirectTo: createErrorPageUrl()
        },
        { status: 401 }
      )
    }

    const userPayload = verification.payload
    username = userPayload.username

    // Read users from JSON file
    const usersPath = `${process.cwd()}/data/users.json`
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    
    // Find user
    const userIndex = usersData.users.findIndex(u => u.id === userPayload.userId)
    
    if (userIndex === -1) {
      logger.error('PASSWORD', 'User not found during password change', { 
        username, 
        userId: userPayload.userId 
      })
      return NextResponse.json(
        { 
          error: 'User not found',
          redirectTo: createErrorPageUrl()
        },
        { status: 404 }
      )
    }

    const user = usersData.users[userIndex]

    // Generate new salt and hash password
    const saltRounds = 12
    const newSalt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(newPassword, newSalt)

    // Update user data
    usersData.users[userIndex] = {
      ...user,
      password_hash: hashedPassword,
      salt: newSalt,
      password_changed: PASSWORD_STATUS.CHANGED
    }

    // Write back to file
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2))

    // Log successful password change
    logger.info('PASSWORD', 'Password changed successfully', { 
      username, 
      userId: user.id
    })

    // Generate new token with updated password status
    const newTokenPayload = {
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: getRoleName(user.role_type),
      roleType: user.role_type,
      passwordChanged: true
    }

    const newToken = generateToken(newTokenPayload)
    const redirectTo = user.role_type === ROLE_TYPES.ADMIN ? '/admin' : '/resident'

    return NextResponse.json({
      message: 'Password updated successfully',
      token: newToken,
      redirectTo: redirectTo,
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

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
