import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '../../../lib/auth'
import { ROLE_TYPES, PASSWORD_STATUS, createErrorPageUrl } from '../../../lib/constants'
import logger from '../../../lib/logger'

export async function POST(request) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'User ID and token are required' },
        { status: 400 }
      )
    }

    // Verify admin token
    const verification = verifyToken(token)
    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (verification.payload.roleType !== ROLE_TYPES.ADMIN) {
      logger.securityEvent('Non-admin attempted password reset', { 
        username: verification.payload.username,
        userId: verification.payload.userId,
        ip: request.headers.get('x-forwarded-for') 
      })
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Read users from JSON file
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    
    // Find user to reset
    const userIndex = usersData.users.findIndex(u => u.id === parseInt(userId))
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const targetUser = usersData.users[userIndex]

    // Reset password status - forces user to change password on next login
    usersData.users[userIndex] = {
      ...targetUser,
      password_changed: PASSWORD_STATUS.NOT_CHANGED,
      // Clear password hash and salt to force default password check
      password_hash: null,
      salt: null
    }

    // Write back to file
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2))

    // Log admin action
    logger.adminAction(
      verification.payload.username, 
      'password_reset', 
      targetUser.username,
      { targetUserId: targetUser.id }
    )

    return NextResponse.json({
      message: `Password reset for ${targetUser.username}. User must change password on next login.`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        firstName: targetUser.first_name,
        lastName: targetUser.last_name,
        passwordChanged: false
      }
    })

  } catch (error) {
    logger.error('ADMIN', 'Password reset system error', { 
      userId, 
      error: error.message 
    })
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
