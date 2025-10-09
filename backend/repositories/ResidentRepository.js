/**
 * Resident Repository
 * Handles all resident data access (database or JSON files)
 */

const fs = require('fs').promises
const path = require('path')
const config = require('../config/config')
const db = require('../config/db')
const logger = require('../config/logger')
const Resident = require('../models/Resident')

class ResidentRepository {
  /**
   * Calculate age from birth_date
   * @param {Date|string} birthDate - Birth date
   * @returns {number|null} - Age in years or null if invalid
   */
  static calculateAge(birthDate) {
    if (!birthDate) return null
    
    const today = new Date()
    const birth = new Date(birthDate)
    
    if (isNaN(birth.getTime())) return null
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age >= 0 ? age : null
  }

  /**
   * Add calculated age to resident object
   * @param {Object} resident - Resident object
   * @returns {Object} - Resident with age field
   */
  static enrichWithAge(resident) {
    if (!resident) return resident
    
    return {
      ...resident,
      id: resident.id, // Use clean integer ID
      age: this.calculateAge(resident.birth_date)
    }
  }

  /**
   * Get all residents with optional search and pagination
   */
  static async findAll(searchQuery = '', page = 1, limit = 50) {
    if (config.USE_MOCK_DATA) {
      return await this._findAllJSON(searchQuery, page, limit)
    } else {
      return await this._findAllDB(searchQuery, page, limit)
    }
  }

  /**
   * Get resident by ID
   */
  static async findById(id) {
    if (config.USE_MOCK_DATA) {
      return await this._findByIdJSON(id)
    } else {
      return await this._findByIdDB(id)
    }
  }

  /**
   * Find resident by user_id
   */
  static async findByUserId(userId) {
    if (config.USE_MOCK_DATA) {
      return await this._findByUserIdJSON(userId)
    } else {
      return await this._findByUserIdDB(userId)
    }
  }

  /**
   * Create new resident
   */
  static async create(residentData) {
    if (config.USE_MOCK_DATA) {
      return await this._createJSON(residentData)
    } else {
      return await this._createDB(residentData)
    }
  }

  /**
   * Update resident by ID with validation
   * MANDATORY: Use same validation pipeline as create method
   */
  static async updateById(id, data) {
    // CRITICAL: Use identical validation as create method
    const Validator = require('../utils/validator')
    const validation = Validator.validateResident(data)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Apply formatTitleCase() to names and addresses (consistency)
    const processedData = {
      ...data,
      firstName: Validator.formatTitleCase(data.firstName),
      lastName: Validator.formatTitleCase(data.lastName),
      middleName: Validator.formatTitleCase(data.middleName || ''),
      address: Validator.formatTitleCase(data.address)
    }

    if (config.USE_MOCK_DATA) {
      return await this._updateByIdJSON(id, processedData)
    } else {
      return await this._updateByIdDB(id, processedData)
    }
  }

  /**
   * Update resident status only (quick toggle without full validation)
   */
  static async updateStatus(id, isActive) {
    if (config.USE_MOCK_DATA) {
      return await this._updateStatusJSON(id, isActive)
    } else {
      return await this._updateStatusDB(id, isActive)
    }
  }



  /**
   * Delete resident (hard delete - permanently remove)
   */
  static async delete(id) {
    if (config.USE_MOCK_DATA) {
      return await this._deleteJSON(id)
    } else {
      return await this._deleteDB(id)
    }
  }

  /**
   * Get resident statistics
   */
  static async getStats() {
    if (config.USE_MOCK_DATA) {
      return await this._getStatsJSON()
    } else {
      return await this._getStatsDB()
    }
  }

  // ==========================================================================
  // DATABASE METHODS
  // ==========================================================================

  static async _findAllDB(searchQuery, page, limit) {
    const offset = (page - 1) * limit
    
    // Fetch ALL residents - let frontend filter by status
    let query = `
      SELECT * FROM residents 
      WHERE 1=1
    `
    const params = []

    if (searchQuery) {
      query += ` AND (
        LOWER(first_name) LIKE LOWER($1) OR 
        LOWER(last_name) LIKE LOWER($1) OR
        LOWER(address) LIKE LOWER($1)
      )`
      params.push(`%${searchQuery}%`)
    }

    query += ` ORDER BY last_name, first_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)
    
    // Count ALL residents
    const countResult = await db.query('SELECT COUNT(*) as total FROM residents WHERE 1=1')
    
    // Debug: Log resident status distribution
    const activeCount = result.rows.filter(r => r.is_active === 1).length
    const inactiveCount = result.rows.filter(r => r.is_active === 0).length
    
    // Use Resident model's batch processing with special categories
    const processedResidents = await Resident.batchProcessWithSpecialCategories(result.rows, db)
    
    // Convert to API format and add calculated age (no ID formatting - use clean integers)
    const residentsForApi = processedResidents.map(resident => {
      const apiData = resident.toApiFormat()
      return {
        ...apiData,
        id: resident.id, // Use clean integer ID
        age: resident.calculateAge() // Ensure age is calculated
      }
    })
    
    return {
      residents: residentsForApi,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    }
  }

  static async _findByIdDB(id) {
    // Get the resident
    const residentQuery = `SELECT * FROM residents WHERE id = $1`
    const residentResult = await db.query(residentQuery, [id])
    
    if (residentResult.rows.length === 0) {
      return null
    }
    
    const residentData = residentResult.rows[0]
    
    // Use Resident model's single processing with special category
    const resident = await Resident.processWithSpecialCategory(residentData, db)
    
    // If resident has a user_id, fetch user credentials for lazy loading
    if (resident.userId) {
      try {
        const userQuery = `SELECT username, is_password_changed, created_at FROM users WHERE id = $1`
        const userResult = await db.query(userQuery, [resident.userId])
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0]
          // Add user info to resident API data
          const apiData = resident.toApiFormat()
          apiData.username = user.username
          apiData.is_password_changed = user.is_password_changed
          apiData.user_created_at = user.created_at
          
          // Note: Temporary PIN cannot be retrieved after creation (it's hashed)
          // Credentials are only shown once during account creation in AddResidentsView
          
          return {
            ...apiData,
            id: resident.id, // Use clean integer ID
            age: resident.calculateAge() // Ensure age is calculated
          }
        }
      } catch (error) {
        // Continue without user data if there's an error
      }
    }
    
    // Return resident API data with age
    const apiData = resident.toApiFormat()
    return {
      ...apiData,
      id: resident.id, // Use clean integer ID
      age: resident.calculateAge() // Ensure age is calculated
    }
  }

  static async _findByUserIdDB(userId) {
    // Get the resident by user_id
    const residentQuery = `SELECT * FROM residents WHERE user_id = $1`
    const residentResult = await db.query(residentQuery, [userId])
    
    if (residentResult.rows.length === 0) {
      return null
    }
    
    const residentData = residentResult.rows[0]
    
    // Use Resident model's single processing with special category
    const resident = await Resident.processWithSpecialCategory(residentData, db)
    
    // Return basic resident data (no need for full user info since we're checking from user context)
    const apiData = resident.toApiFormat()
    return {
      ...apiData,
      id: resident.id, // Use clean integer ID
      age: resident.calculateAge() // Ensure age is calculated
    }
  }

  static async _findByUserIdJSON(userId) {
    // JSON mock data doesn't support this feature yet
    // For now, return null (will only work with database)
    return null
  }

  static async _createDB(data) {
    // Transform data for database compatibility
    const dbData = this._transformForDB(data)
    
    const result = await db.query(`
      INSERT INTO residents (
        user_id, last_name, first_name, middle_name, suffix, birth_date, gender,
        civil_status, home_number, mobile_number, email, address, purok,
        religion, occupation, special_category_id, notes, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      dbData.userId, dbData.lastName, dbData.firstName, dbData.middleName, dbData.suffix,
      dbData.birthDate, dbData.gender, dbData.civilStatus, dbData.homeNumber, dbData.mobileNumber,
      dbData.email, dbData.address, dbData.purok, dbData.religion, dbData.occupation,
      dbData.specialCategoryId, dbData.notes
    ])
    return this.enrichWithAge(result.rows[0])
  }

  /**
   * Transform data for database compatibility
   * Converts string values to appropriate database types
   */
  static _transformForDB(data) {
    const transformed = { ...data }

    // Convert gender string to integer
    if (data.gender) {
      const genderStr = data.gender.toString().toLowerCase()
      if (genderStr === 'male' || genderStr === '1') {
        transformed.gender = 1
      } else if (genderStr === 'female' || genderStr === '2') {
        transformed.gender = 2
      } else {
        transformed.gender = parseInt(data.gender) || null
      }
    } else {
      transformed.gender = null
    }

    // Convert purok to integer
    if (data.purok) {
      transformed.purok = parseInt(data.purok) || null
    } else {
      transformed.purok = null
    }

    // Convert special_category_id to integer or null (support multiple field name formats)
    if (data.special_category_id || data.specialCategory || data.specialCategoryId) {
      const categoryId = parseInt(data.special_category_id || data.specialCategory || data.specialCategoryId)
      transformed.specialCategoryId = isNaN(categoryId) ? null : categoryId
    } else {
      transformed.specialCategoryId = null
    }

    // Ensure userId is integer
    if (data.userId) {
      transformed.userId = parseInt(data.userId)
    }

    // Handle birth date
    if (data.birthDate && data.birthDate !== '') {
      transformed.birthDate = data.birthDate
    } else {
      transformed.birthDate = null
    }

    // Clean up empty strings to null for optional fields
    const optionalFields = ['middleName', 'email', 'homeNumber', 'mobileNumber', 
                           'religion', 'occupation', 'civilStatus', 'suffix', 'notes']
    
    optionalFields.forEach(field => {
      if (transformed[field] === '' || transformed[field] === undefined) {
        transformed[field] = null
      }
    })

    return transformed
  }

  /**
   * Update resident in database with complete field support
   */
  static async _updateByIdDB(id, data) {
    try {
      // Transform data for database compatibility
      const dbData = this._transformForDB(data)
      
      // Log important field transformations for debugging
      logger.info('Updating resident in database', { 
        id, 
        occupation: dbData.occupation,
        religion: dbData.religion,
        specialCategoryId: dbData.specialCategoryId 
      })
      
      // Debug: Log all SQL parameters to identify special category issue
      const sqlParams = [
        dbData.firstName, dbData.lastName, dbData.middleName, dbData.suffix,
        dbData.birthDate, dbData.gender, dbData.civilStatus,
        dbData.homeNumber, dbData.mobileNumber, dbData.email,
        dbData.address, dbData.purok, dbData.religion, dbData.occupation,
        dbData.specialCategoryId, dbData.notes, dbData.isActive, 
        id
      ]
      
      // Update query with all fields including occupation, religion, and special_category_id
      const result = await db.query(`
        UPDATE residents SET
          first_name = $1, last_name = $2, middle_name = $3, suffix = $4,
          birth_date = $5, gender = $6, civil_status = $7,
          home_number = $8, mobile_number = $9, email = $10,
          address = $11, purok = $12, religion = $13, occupation = $14,
          special_category_id = $15, notes = $16, is_active = $17,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $18
        RETURNING *
      `, sqlParams)

      if (result.rows.length === 0) {
        return null // Resident not found
      }

      // Process with special category to include category name
      const updatedResident = await Resident.processWithSpecialCategory(result.rows[0], db)
      
      // Return enriched resident data with formatted ID and calculated age
      return {
        ...updatedResident.toApiFormat(),
        id: updatedResident.id,
        age: updatedResident.calculateAge()
      }
    } catch (error) {
      logger.error('Error updating resident in database', { id, error: error.message })
      throw error
    }
  }

  /**
   * Update resident in JSON file with complete field support
   */
  static async _updateByIdJSON(id, data) {
    try {
      const residents = await this._loadResidentsJSON()
      const index = residents.findIndex(r => r.id === parseInt(id))
      
      if (index === -1) return null
      
      // Update resident with all provided fields
      residents[index] = {
        ...residents[index],
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName || '',
        suffix: data.suffix || '',
        birth_date: data.birthDate,
        gender: data.gender,
        civil_status: data.civilStatus,
        home_number: data.homeNumber || '',
        mobile_number: data.mobileNumber || '',
        email: data.email || '',
        address: data.address,
        purok: data.purok,
        religion: data.religion || '',
        occupation: data.occupation || '',
        special_category: data.specialCategory || '',
        notes: data.notes || '',
        is_active: data.isActive !== undefined ? data.isActive : residents[index].is_active,
        updated_at: new Date().toISOString()
      }
      
      await this._saveResidentsJSON(residents)
      
      // Return enriched resident data with formatted ID and calculated age
      return this.enrichWithAge(residents[index])
    } catch (error) {
      logger.error('Error updating resident in JSON file', { id, error: error.message })
      throw error
    }
  }

  /**
   * Update resident status in database (quick toggle)
   */
  static async _updateStatusDB(id, isActive) {
    try {
      const result = await db.query(`
        UPDATE residents SET
          is_active = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [isActive, id])

      if (result.rows.length === 0) {
        return null // Resident not found
      }

      // Return enriched resident data with formatted ID and calculated age
      return this.enrichWithAge(result.rows[0])
    } catch (error) {
      logger.error('Error updating resident status in database', { id, isActive, error: error.message })
      throw error
    }
  }

  /**
   * Update resident status in JSON file (quick toggle)
   */
  static async _updateStatusJSON(id, isActive) {
    try {
      const residents = await this._loadResidentsJSON()
      const index = residents.findIndex(r => r.id === parseInt(id))
      
      if (index === -1) return null
      
      // Update only the status field
      residents[index] = {
        ...residents[index],
        is_active: isActive,
        updated_at: new Date().toISOString()
      }
      
      await this._saveResidentsJSON(residents)
      
      // Return enriched resident data with formatted ID and calculated age
      return this.enrichWithAge(residents[index])
    } catch (error) {
      logger.error('Error updating resident status in JSON file', { id, isActive, error: error.message })
      throw error
    }
  }



  static async _deleteDB(id) {
    try {
      const result = await db.query('DELETE FROM residents WHERE id = $1 RETURNING id', [id])
      return result.rows.length > 0
    } catch (error) {
      logger.error('Error deleting resident from database', { id, error: error.message })
      throw error
    }
  }

  static async _getStatsDB() {
    // Get total residents
    const totalResult = await db.query('SELECT COUNT(*) as count FROM residents WHERE is_active = 1')
    
    // Get recent registrations (last 30 days)
    const recentResult = await db.query(`
      SELECT COUNT(*) as count FROM residents 
      WHERE is_active = 1 AND created_at >= NOW() - INTERVAL '30 days'
    `)
    
    // Get special categories breakdown
    const categoriesResult = await db.query(`
      SELECT 
        sc.category_name,
        COUNT(r.id) as count
      FROM special_categories sc
      LEFT JOIN residents r ON sc.id = r.special_category_id AND r.is_active = 1
      GROUP BY sc.id, sc.category_name
      ORDER BY sc.id
    `)
    
    // Get regular residents (no special category)
    const regularResult = await db.query(`
      SELECT COUNT(*) as count FROM residents 
      WHERE is_active = 1 AND (special_category_id IS NULL OR special_category_id = 0)
    `)
    
    // Format categories data
    const categories = {
      regular: parseInt(regularResult.rows[0]?.count || 0)
    }
    
    // Add special categories
    categoriesResult.rows.forEach(row => {
      const categoryKey = row.category_name.toLowerCase().replace(' ', '_')
      categories[categoryKey] = parseInt(row.count || 0)
    })
    
    return {
      total: parseInt(totalResult.rows[0].count),
      recentCount: parseInt(recentResult.rows[0].count),
      categories
    }
  }

  // ==========================================================================
  // JSON FILE METHODS
  // ==========================================================================

  static async _findAllJSON(searchQuery, page, limit) {
    const residents = await this._loadResidentsJSON()
    
    // Fetch ALL residents - let frontend filter by status
    let filtered = residents

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.first_name?.toLowerCase().includes(query) ||
        r.last_name?.toLowerCase().includes(query) ||
        r.address?.toLowerCase().includes(query)
      )
    }

    const offset = (page - 1) * limit
    const paginated = filtered.slice(offset, offset + limit)

    // Add calculated age to each resident
    const residentsWithAge = paginated.map(resident => this.enrichWithAge(resident))

    return {
      residents: residentsWithAge,
      total: filtered.length,
      page,
      limit
    }
  }

  static async _findByIdJSON(id) {
    const residents = await this._loadResidentsJSON()
    const resident = residents.find(r => r.id === parseInt(id))
    return this.enrichWithAge(resident)
  }

  static async _createJSON(data) {
    const residents = await this._loadResidentsJSON()
    const newId = Math.max(...residents.map(r => r.id), 0) + 1
    
    const newResident = {
      id: newId,
      ...data,
      is_active: 1,
      created_at: new Date().toISOString()
    }
    
    residents.push(newResident)
    await this._saveResidentsJSON(residents)
    return this.enrichWithAge(newResident)
  }

  static async _updateJSON(id, data) {
    const residents = await this._loadResidentsJSON()
    const index = residents.findIndex(r => r.id === parseInt(id))
    
    if (index === -1) return null
    
    residents[index] = {
      ...residents[index],
      ...data,
      updated_at: new Date().toISOString()
    }
    
    await this._saveResidentsJSON(residents)
    return this.enrichWithAge(residents[index])
  }

  static async _deleteJSON(id) {
    try {
      const residents = await this._loadResidentsJSON()
      const index = residents.findIndex(r => r.id === parseInt(id))
      
      if (index === -1) {
        return false
      }
      
      // Remove resident from array (hard delete)
      residents.splice(index, 1)
      await this._saveResidentsJSON(residents)
      
      return true
    } catch (error) {
      logger.error('Error deleting resident from JSON file', { id, error: error.message })
      throw error
    }
  }

  static async _getStatsJSON() {
    const residents = await this._loadResidentsJSON()
    const active = residents.filter(r => r.is_active !== 0)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recent = active.filter(r => {
      const created = new Date(r.created_at || r.createdAt)
      return created > thirtyDaysAgo
    })

    return {
      total: active.length,
      recentCount: recent.length
    }
  }

  static async _loadResidentsJSON() {
    try {
      const filePath = path.join(__dirname, '../data/residents.json')
      const data = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(data)
      // Skip the first element if it's metadata
      return Array.isArray(parsed) && parsed[0]?._comment ? parsed.slice(1) : parsed
    } catch (error) {
      logger.error('Failed to load residents.json', error)
      return []
    }
  }

  static async _saveResidentsJSON(residents) {
    try {
      const filePath = path.join(__dirname, '../data/residents.json')
      await fs.writeFile(filePath, JSON.stringify(residents, null, 2), 'utf8')
      return true
    } catch (error) {
      logger.error('Failed to save residents.json', error)
      return false
    }
  }
}

module.exports = ResidentRepository
