/**
 * User Repository
 * Handles all user data access (database or JSON files)
 */

const fs = require('fs').promises
const path = require('path')
const config = require('../config/config')
const db = require('../config/db')
const logger = require('../config/logger')

class UserRepository {
  /**
   * Get user by username
   */
  static async findByUsername(username) {
    if (config.USE_MOCK_DATA) {
      return await this._findByUsernameJSON(username)
    } else {
      return await this._findByUsernameDB(username)
    }
  }

  /**
   * Update user login failure
   */
  static async updateLoginFailure(userId, username, failedAttempts, lockedUntil) {
    const lastFailedLogin = new Date().toISOString()
    
    if (config.USE_MOCK_DATA) {
      await this._updateLoginFailureJSON(username, failedAttempts, lockedUntil, lastFailedLogin)
    } else {
      await this._updateLoginFailureDB(userId, failedAttempts, lockedUntil, lastFailedLogin)
    }
  }

  /**
   * Update user successful login
   */
  static async updateLoginSuccess(userId, username) {
    const lastLogin = new Date().toISOString()
    
    if (config.USE_MOCK_DATA) {
      await this._updateLoginSuccessJSON(username, lastLogin)
    } else {
      await this._updateLoginSuccessDB(userId, lastLogin)
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(userId, username, hashedPassword) {
    if (config.USE_MOCK_DATA) {
      await this._updatePasswordJSON(username, hashedPassword)
    } else {
      await this._updatePasswordDB(userId, hashedPassword)
    }
  }

  /**
   * Create new user
   */
  static async create(userData) {
    if (config.USE_MOCK_DATA) {
      return await this._createJSON(userData)
    } else {
      return await this._createDB(userData)
    }
  }

  // ==========================================================================
  // DATABASE METHODS
  // ==========================================================================

  static async _findByUsernameDB(username) {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.password, 
        u.role, 
        u.is_password_changed, 
        u.failed_login_attempts, 
        u.locked_until, 
        u.last_login,
        r.first_name,
        r.last_name
      FROM users u
      LEFT JOIN residents r ON u.id = r.user_id
      WHERE u.username = $1
    `, [username])
    
    if (result.rows.length === 0) return null
    
    const dbUser = result.rows[0]
    return {
      id: dbUser.id,
      username: dbUser.username,
      passwordHash: dbUser.password,
      role: dbUser.role === 1 ? 'admin' : dbUser.role === 2 ? 'staff' : 'resident',
      passwordChanged: dbUser.is_password_changed === 1,
      failedLoginAttempts: dbUser.failed_login_attempts || 0,
      lockedUntil: dbUser.locked_until,
      lastLogin: dbUser.last_login,
      firstName: dbUser.first_name || 'User',
      lastName: dbUser.last_name || ''
    }
  }

  static async _updateLoginFailureDB(userId, failedAttempts, lockedUntil, lastFailedLogin) {
    await db.query(
      'UPDATE users SET failed_login_attempts = $1, locked_until = $2, last_failed_login = $3 WHERE id = $4',
      [failedAttempts, lockedUntil, lastFailedLogin, userId]
    )
  }

  static async _updateLoginSuccessDB(userId, lastLogin) {
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = $1 WHERE id = $2',
      [lastLogin, userId]
    )
  }

  static async _updatePasswordDB(userId, hashedPassword) {
    await db.query(
      'UPDATE users SET password = $1, is_password_changed = 1 WHERE id = $2',
      [hashedPassword, userId]
    )
  }

  // ==========================================================================
  // JSON FILE METHODS
  // ==========================================================================

  static async _findByUsernameJSON(username) {
    const users = await this._loadUsersJSON()
    return users.find(u => u.username === username)
  }

  static async _updateLoginFailureJSON(username, failedAttempts, lockedUntil, lastFailedLogin) {
    const users = await this._loadUsersJSON()
    const user = users.find(u => u.username === username)
    
    if (user) {
      user.failedLoginAttempts = failedAttempts
      user.lockedUntil = lockedUntil
      user.lastFailedLogin = lastFailedLogin
      await this._saveUsersJSON(users)
    }
  }

  static async _updateLoginSuccessJSON(username, lastLogin) {
    const users = await this._loadUsersJSON()
    const user = users.find(u => u.username === username)
    
    if (user) {
      user.failedLoginAttempts = 0
      user.lockedUntil = null
      user.lastLogin = lastLogin
      await this._saveUsersJSON(users)
    }
  }

  static async _updatePasswordJSON(username, hashedPassword) {
    const users = await this._loadUsersJSON()
    const user = users.find(u => u.username === username)
    
    if (user) {
      user.passwordHash = hashedPassword
      user.passwordChanged = true
      await this._saveUsersJSON(users)
    }
  }

  static async _loadUsersJSON() {
    try {
      const filePath = path.join(__dirname, '../data/users.json')
      const data = await fs.readFile(filePath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      logger.error('Failed to load users.json', error)
      return []
    }
  }

  static async _saveUsersJSON(users) {
    try {
      const filePath = path.join(__dirname, '../data/users.json')
      await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8')
      return true
    } catch (error) {
      logger.error('Failed to save users.json', error)
      return false
    }
  }

  static async _createJSON(userData) {
    try {
      const users = await this._loadUsersJSON()
      
      // Get next ID
      const maxId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) : 0
      const newId = maxId + 1
      
      // Create new user object
      const newUser = {
        id: newId,
        username: userData.username,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'resident',
        passwordChanged: userData.passwordChanged || false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: null,
        createdAt: new Date().toISOString()
      }
      
      users.push(newUser)
      await this._saveUsersJSON(users)
      
      logger.info(`User created: ${newUser.username}`, { userId: newId })
      return newUser
    } catch (error) {
      logger.error('Failed to create user in JSON', error)
      throw error
    }
  }

  static async _createDB(userData) {
    // Future database implementation
    const result = await db.query(`
      INSERT INTO users (username, password, first_name, last_name, role, is_password_changed)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, first_name, last_name, role, is_password_changed, created_at
    `, [
      userData.username,
      userData.passwordHash,
      userData.firstName,
      userData.lastName,
      userData.role === 'admin' ? 1 : userData.role === 'staff' ? 2 : 3,
      userData.passwordChanged ? 1 : 0
    ])
    
    const dbUser = result.rows[0]
    return {
      id: dbUser.id,
      username: dbUser.username,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      role: dbUser.role === 1 ? 'admin' : dbUser.role === 2 ? 'staff' : 'resident',
      passwordChanged: dbUser.is_password_changed === 1,
      createdAt: dbUser.created_at
    }
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
    if (config.USE_MOCK_DATA) {
      return await this._createJSON(userData)
    } else {
      return await this._createDB(userData)
    }
  }

  /**
   * Create user in JSON file (development mode)
   */
  static async _createJSON(userData) {
    const users = await this._loadUsers()
    
    // Generate new ID
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1
    
    // Convert role string to integer
    const roleInt = userData.role === 'admin' ? 1 : userData.role === 'staff' ? 2 : 3
    
    const newUser = {
      id: newId,
      username: userData.username,
      password: userData.passwordHash,
      role: roleInt,
      is_password_changed: userData.passwordChanged ? 1 : 0,
      failed_login_attempts: 0,
      locked_until: null,
      last_login: null,
      last_failed_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    users.push(newUser)
    await this._saveUsers(users)
    
    return {
      id: newUser.id,
      username: newUser.username,
      role: userData.role,
      passwordChanged: userData.passwordChanged,
      createdAt: newUser.created_at
    }
  }

  /**
   * Create user in database (production mode)
   */
  static async _createDB(userData) {
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
      id: newUser.id,
      username: newUser.username,
      role: userData.role,
      passwordChanged: newUser.is_password_changed === 1,
      createdAt: newUser.created_at
    }
  }
}

module.exports = UserRepository
