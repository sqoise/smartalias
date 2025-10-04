/**
 * User Repository
 * Handles all user data access using PostgreSQL database only
 */

const db = require('../config/db')
const logger = require('../config/logger')
const IDUtils = require('../utils/idUtils')

class UserRepository {
  /**
   * Get user by username
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
        u.locked_until
      FROM users u 
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
   * Create a new user account
   * @param {Object} userData - User data to create
   * @param {string} userData.username - Username
   * @param {string} userData.passwordHash - Hashed password
   * @param {string} userData.role - User role ('admin', 'staff', 'resident')
   * @param {boolean} userData.passwordChanged - Whether password has been changed
   * @returns {Promise<Object>} Created user data
   */
  static async create(userData) {
    // Convert role string to integer
    const roleInt = userData.role === 'admin' ? 1 : userData.role === 'staff' ? 2 : 3
    
    const query = `
      INSERT INTO users (username, password, role, is_password_changed)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, role, is_password_changed, created_at
    `
    
    const values = [
      userData.username,
      userData.passwordHash,
      roleInt,
      userData.passwordChanged ? 1 : 0
    ]
    
    const result = await db.query(query, values)
    const newUser = result.rows[0]
    
    return {
      id: IDUtils.formatID(newUser.id),
      username: newUser.username,
      role: userData.role,
      passwordChanged: newUser.is_password_changed === 1,
      createdAt: newUser.created_at
    }
  }
}

module.exports = UserRepository
