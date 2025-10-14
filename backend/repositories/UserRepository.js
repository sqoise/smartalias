/**
 * User Repository - Enhanced with Document Verification
 * Handles all user data access using PostgreSQL database with residency approval workflow
 */

const db = require('../config/db')
const logger = require('../config/logger')
const fileUploadService = require('../services/fileUploadService')

class UserRepository {
  /**
   * Get user by ID with approval status
   */
  static async findById(userId) {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.password, 
        u.role,
        u.is_password_changed,
        u.failed_login_attempts,
        u.locked_until,
        u.is_active,
        u.attachment_image,
        u.approved_by,
        u.approved_at,
        approver.username as approved_by_username
      FROM users u 
      LEFT JOIN users approver ON u.approved_by = approver.id
      WHERE u.id = $1
    `, [userId])

    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Get user by username with approval status
   */
  static async findByUsername(username) {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.password, 
        u.role,
        u.is_password_changed,
        u.failed_login_attempts,
        u.locked_until,
        u.is_active,
        u.attachment_image,
        u.approved_by,
        u.approved_at,
        approver.username as approved_by_username
      FROM users u 
      LEFT JOIN users approver ON u.approved_by = approver.id
      WHERE u.username = $1
    `, [username])

    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Update user login failure
   */
  static async updateLoginFailure(userId, username, failedAttempts, lockedUntil) {
    const lastFailedLogin = new Date().toISOString()
    
    await db.query(`
      UPDATE users 
      SET 
        failed_login_attempts = $1,
        locked_until = $2,
        last_failed_login = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [failedAttempts, lockedUntil, lastFailedLogin, userId])

    logger.info('Updated login failure for user', { userId, username, failedAttempts })
  }

  /**
   * Update user successful login
   */
  static async updateLoginSuccess(userId, username) {
    const lastLogin = new Date().toISOString()
    
    await db.query(`
      UPDATE users 
      SET 
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [lastLogin, userId])

    logger.info('Updated successful login for user', { userId, username })
  }

  /**
   * Update user password
   */
  static async updatePassword(userId, username, hashedPassword) {
    await db.query(`
      UPDATE users 
      SET 
        password = $1,
        is_password_changed = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [hashedPassword, userId])

    logger.info('Password updated for user', { userId, username })
  }

  /**
   * Reset user password (admin function)
   * Sets is_password_changed to 0 to force password change on next login
   * @param {number} userId - User ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.passwordHash - New hashed password
   * @param {boolean} updateData.passwordChanged - Whether password has been changed (false for reset)
   */
  static async resetPassword(userId, updateData) {
    await db.query(`
      UPDATE users 
      SET 
        password = $1,
        is_password_changed = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [updateData.passwordHash, updateData.passwordChanged ? 1 : 0, userId])

    logger.info('Password reset for user', { userId })
  }

  /**
   * Create a new user account with document verification requirement
   * @param {Object} userData - User data to create
   * @param {string} userData.username - Username
   * @param {string} userData.passwordHash - Hashed password
   * @param {string} userData.role - User role ('admin', 'staff', 'resident')
   * @param {boolean} userData.passwordChanged - Whether password has been changed
   * @param {string} attachmentPath - Path to uploaded residency document
   * @returns {Promise<Object>} Created user data
   */
  static async create(userData, attachmentPath = null) {
    // Convert role string to integer
    const roleInt = userData.role === 'admin' ? 1 : userData.role === 'staff' ? 2 : 3
    
    const query = `
      INSERT INTO users (
        username, password, role, is_password_changed, 
        is_active, attachment_image
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, role, is_password_changed, is_active, attachment_image, created_at
    `
    
    // Use the isActive value from userData if provided, otherwise default based on role
    // Self-registration: explicitly set to 0 (inactive)
    // Admin creation: explicitly set to 1 (active)
    const isActive = userData.isActive !== undefined ? userData.isActive : (roleInt === 3 ? 0 : 1)
    
    const values = [
      userData.username,
      userData.passwordHash,
      roleInt,
      userData.passwordChanged ? 1 : 0,
      isActive,
      attachmentPath
    ]
    
    const result = await db.query(query, values)
    const newUser = result.rows[0]
    
    logger.info('User created with approval workflow', {
      userId: newUser.id,
      username: newUser.username,
      role: userData.role,
      needsApproval: roleInt === 3,
      hasAttachment: !!attachmentPath
    })
    
    return {
      id: newUser.id,
      username: newUser.username,
      role: userData.role,
      passwordChanged: newUser.is_password_changed === 1,
      isActive: newUser.is_active === 1,
      attachmentImage: newUser.attachment_image,
      createdAt: newUser.created_at
    }
  }

  /**
   * Get pending users for admin approval (inactive residents with documents)
   */
  static async getPendingUsers() {
    try {
      const query = `
        SELECT 
          u.id,
          u.username,
          u.attachment_image,
          u.created_at,
          r.first_name,
          r.last_name,
          r.middle_name,
          r.mobile_number,
          r.email,
          r.address
        FROM users u
        LEFT JOIN residents r ON u.id = r.user_id
        WHERE u.is_active = 0 AND u.role = 3
        ORDER BY u.created_at ASC
      `

      const result = await db.query(query)
      return result.rows

    } catch (error) {
      logger.error('Error fetching pending users', { error: error.message })
      throw error
    }
  }

  /**
   * Approve user account - activates both users and residents tables
   */
  static async approveUser(userId, adminId) {
    try {
      // Start transaction to update both tables
      await db.query('BEGIN')

      // Activate user account
      const userQuery = `
        UPDATE users 
        SET 
          is_active = 1,
          approved_by = $2,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, username, is_active, attachment_image
      `

      const userResult = await db.query(userQuery, [userId, adminId])
      
      if (userResult.rows.length === 0) {
        await db.query('ROLLBACK')
        throw new Error('User not found')
      }

      // Activate resident record
      const residentQuery = `
        UPDATE residents 
        SET 
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING id, first_name, last_name, mobile_number
      `

      const residentResult = await db.query(residentQuery, [userId])
      
      const user = userResult.rows[0]
      const resident = residentResult.rows[0]

      // Delete the attachment image after approval
      if (user.attachment_image) {
        try {
          fileUploadService.deleteFileByName(user.attachment_image)
          
          // Clear attachment_image from database
          await db.query(
            'UPDATE users SET attachment_image = NULL WHERE id = $1',
            [userId]
          )
          
          logger.info('Attachment deleted after approval', {
            userId: userId,
            filename: user.attachment_image
          })
        } catch (deleteError) {
          logger.warn('Failed to delete attachment after approval', {
            userId: userId,
            filename: user.attachment_image,
            error: deleteError.message
          })
        }
      }

      // Commit transaction
      await db.query('COMMIT')

      // TODO: Send SMS notification to user about approval
      // const smsMessage = `Welcome! Your SmartLias account has been approved. You can now access all services.`
      // await smsService.sendSMS(resident.mobile_number, smsMessage)

      logger.info('User approved successfully', {
        userId: userId,
        adminId: adminId,
        username: user.username,
        residentName: resident ? `${resident.first_name} ${resident.last_name}` : 'Unknown'
      })

      return {
        ...user,
        resident: resident
      }

    } catch (error) {
      await db.query('ROLLBACK')
      logger.error('Error approving user', { error: error.message, userId, adminId })
      throw error
    }
  }

  /**
   * Delete user account (instead of rejecting)
   */
  static async deleteUser(userId, adminId) {
    try {
      // Start transaction
      await db.query('BEGIN')

      // Get user info first for logging and cleanup
      const userQuery = `
        SELECT id, username, attachment_image 
        FROM users 
        WHERE id = $1
      `
      const userResult = await db.query(userQuery, [userId])
      
      if (userResult.rows.length === 0) {
        await db.query('ROLLBACK')
        throw new Error('User not found')
      }

      const user = userResult.rows[0]

      // Delete attachment image if exists
      if (user.attachment_image) {
        try {
          fileUploadService.deleteFileByName(user.attachment_image)
          logger.info('Attachment deleted during user deletion', {
            userId: userId,
            filename: user.attachment_image
          })
        } catch (deleteError) {
          logger.warn('Failed to delete attachment during user deletion', {
            userId: userId,
            filename: user.attachment_image,
            error: deleteError.message
          })
        }
      }

      // Delete resident record first (foreign key constraint)
      await db.query('DELETE FROM residents WHERE user_id = $1', [userId])
      
      // Delete user record
      await db.query('DELETE FROM users WHERE id = $1', [userId])

      // Commit transaction
      await db.query('COMMIT')

      logger.info('User deleted successfully', {
        userId: userId,
        adminId: adminId,
        username: user.username
      })

      return {
        id: user.id,
        username: user.username,
        deleted: true
      }

    } catch (error) {
      await db.query('ROLLBACK')
      logger.error('Error deleting user', { error: error.message, userId, adminId })
      throw error
    }
  }

  /**
   * Update user attachment image
   */
  static async updateAttachment(userId, attachmentPath) {
    try {
      // Clean up old files for this user
      fileUploadService.cleanupUserFiles(userId)

      const query = `
        UPDATE users 
        SET 
          attachment_image = $2,
          is_active = 0,
          approved_by = NULL,
          approved_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, username, attachment_image, is_active
      `

      const result = await db.query(query, [userId, attachmentPath])
      
      if (result.rows.length === 0) {
        throw new Error('User not found')
      }

      // Also set resident as inactive until approval
      await db.query(
        'UPDATE residents SET is_active = 0 WHERE user_id = $1',
        [userId]
      )

      logger.info('User attachment updated, reset to pending approval', {
        userId: userId,
        filename: attachmentPath
      })

      return result.rows[0]

    } catch (error) {
      logger.error('Error updating user attachment', { error: error.message, userId })
      throw error
    }
  }

  /**
   * Check if user can login (must be active in both users and residents tables)
   */
  static async canUserLogin(userId) {
    try {
      const query = `
        SELECT 
          u.id, u.username, u.is_active as user_active,
          r.is_active as resident_active
        FROM users u
        LEFT JOIN residents r ON u.id = r.user_id
        WHERE u.id = $1
      `
      
      const result = await db.query(query, [userId])
      const user = result.rows[0]
      
      if (!user) {
        return { canLogin: false, reason: 'User not found' }
      }

      if (user.user_active !== 1) {
        return { canLogin: false, reason: 'Account pending approval' }
      }

      if (user.resident_active !== 1) {
        return { canLogin: false, reason: 'Resident record not active' }
      }

      return { canLogin: true, user: user }

    } catch (error) {
      logger.error('Error checking user login eligibility', { error: error.message, userId })
      return { canLogin: false, reason: 'System error' }
    }
  }

  /**
   * Get approval statistics for admin dashboard
   */
  static async getApprovalStats() {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN is_active = 0 THEN 1 END) as pending,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as approved,
          COUNT(*) as total
        FROM users 
        WHERE role = 3
      `

      const result = await db.query(query)
      return result.rows[0]

    } catch (error) {
      logger.error('Error fetching approval stats', { error: error.message })
      throw error
    }
  }
}

module.exports = UserRepository
