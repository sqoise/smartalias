/**
 * Resident Model
 * Handles resident business logic and validation
 */

const logger = require('../config/logger')

class Resident {
  constructor(data) {
    this.id = data.id
    this.userId = data.user_id || data.userId
    this.firstName = data.first_name || data.firstName
    this.lastName = data.last_name || data.lastName
    this.middleName = data.middle_name || data.middleName
    this.suffix = data.suffix
    this.birthDate = data.birth_date || data.birthDate
    this.gender = data.gender
    this.civilStatus = data.civil_status || data.civilStatus
    this.homeNumber = data.home_number || data.homeNumber
    this.mobileNumber = data.mobile_number || data.mobileNumber
    this.email = data.email
    this.address = data.address
    this.purok = data.purok
    this.familyGroupId = data.family_group_id || data.familyGroupId
    this.familyRole = data.family_role || data.familyRole
    this.religion = data.religion
    this.occupation = data.occupation
    this.specialCategoryId = data.special_category_id || data.specialCategoryId
    this.specialCategoryName = data.special_category_name || data.specialCategoryName
    this.notes = data.notes
    this.isActive = data.is_active || data.isActive
    this.createdAt = data.created_at || data.createdAt
    this.updatedAt = data.updated_at || data.updatedAt
    this.age = data.age
  }

  /**
   * Calculate age from birth date
   * @returns {number|null} Age in years or null if no birth date
   */
  calculateAge() {
    if (!this.birthDate) return null
    
    const today = new Date()
    const birth = new Date(this.birthDate)
    
    if (isNaN(birth.getTime())) return null
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age >= 0 ? age : null
  }

  /**
   * Get full name
   * @param {boolean} includeMiddle - Include middle name
   * @param {boolean} includeSuffix - Include suffix
   * @returns {string} Full name
   */
  getFullName(includeMiddle = true, includeSuffix = true) {
    let name = `${this.firstName} ${this.lastName}`
    
    if (includeMiddle && this.middleName) {
      name = `${this.firstName} ${this.middleName} ${this.lastName}`
    }
    
    if (includeSuffix && this.suffix) {
      name += ` ${this.suffix}`
    }
    
    return name
  }

  /**
   * Get display name (Last, First Middle)
   * @returns {string} Display name
   */
  getDisplayName() {
    let name = `${this.lastName}, ${this.firstName}`
    if (this.middleName) {
      name += ` ${this.middleName}`
    }
    if (this.suffix) {
      name += ` ${this.suffix}`
    }
    return name
  }

  /**
   * Get gender display
   * @returns {string} Gender display name
   */
  getGenderDisplay() {
    switch(this.gender) {
      case 1: return 'Male'
      case 2: return 'Female'
      default: return 'Not specified'
    }
  }

  /**
   * Get special category display
   * @returns {string} Special category display name or 'Regular'
   */
  getSpecialCategoryDisplay() {
    return this.specialCategoryName || 'Regular'
  }

  /**
   * Get family role display
   * @returns {string} Family role display name
   */
  getFamilyRoleDisplay() {
    switch(this.familyRole) {
      case 1: return 'Parent'
      case 2: return 'Child'
      default: return 'Not specified'
    }
  }

  /**
   * Check if resident is active
   * @returns {boolean}
   */
  isActiveResident() {
    return this.isActive === 1
  }

  /**
   * Validate first name
   * @param {string} firstName - First name to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validateFirstName(firstName) {
    if (!firstName || typeof firstName !== 'string') {
      return { isValid: false, error: 'First name is required' }
    }

    const trimmed = firstName.trim()
    if (trimmed.length < 2) {
      return { isValid: false, error: 'First name must be at least 2 characters' }
    }

    if (trimmed.length > 50) {
      return { isValid: false, error: 'First name must be less than 50 characters' }
    }

    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
      return { isValid: false, error: 'First name can only contain letters, spaces, apostrophes, and hyphens' }
    }

    return { isValid: true }
  }

  /**
   * Validate last name
   * @param {string} lastName - Last name to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validateLastName(lastName) {
    if (!lastName || typeof lastName !== 'string') {
      return { isValid: false, error: 'Last name is required' }
    }

    const trimmed = lastName.trim()
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Last name must be at least 2 characters' }
    }

    if (trimmed.length > 50) {
      return { isValid: false, error: 'Last name must be less than 50 characters' }
    }

    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
      return { isValid: false, error: 'Last name can only contain letters, spaces, apostrophes, and hyphens' }
    }

    return { isValid: true }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validateEmail(email) {
    if (!email) {
      return { isValid: true } // Email is optional
    }

    if (typeof email !== 'string') {
      return { isValid: false, error: 'Email must be a valid string' }
    }

    const trimmed = email.trim()
    if (trimmed.length === 0) {
      return { isValid: true } // Empty email is OK
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, error: 'Please enter a valid email address' }
    }

    if (trimmed.length > 100) {
      return { isValid: false, error: 'Email must be less than 100 characters' }
    }

    return { isValid: true }
  }

  /**
   * Validate address
   * @param {string} address - Address to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Address is required' }
    }

    const trimmed = address.trim()
    if (trimmed.length < 20) {
      return { isValid: false, error: 'Address must be at least 20 characters including spaces' }
    }

    if (trimmed.length > 500) {
      return { isValid: false, error: 'Address must be less than 500 characters' }
    }

    return { isValid: true }
  }

  /**
   * Validate mobile number
   * @param {string} mobileNumber - Mobile number to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validateMobileNumber(mobileNumber) {
    if (!mobileNumber) {
      return { isValid: true } // Mobile number is optional
    }

    if (typeof mobileNumber !== 'string') {
      return { isValid: false, error: 'Mobile number must be a valid string' }
    }

    const trimmed = mobileNumber.trim()
    if (trimmed.length === 0) {
      return { isValid: true } // Empty mobile number is OK
    }

    // Philippine mobile number format: 09xxxxxxxxx (11 digits)
    if (!/^09[0-9]{9}$/.test(trimmed)) {
      return { isValid: false, error: 'Mobile number must be in format 09xxxxxxxxx (11 digits)' }
    }

    return { isValid: true }
  }

  /**
   * Validate birth date
   * @param {string|Date} birthDate - Birth date to validate
   * @returns {Object} {isValid: boolean, error?: string}
   */
  static validateBirthDate(birthDate) {
    if (!birthDate) {
      return { isValid: true } // Birth date is optional
    }

    const date = new Date(birthDate)
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Please enter a valid birth date' }
    }

    const today = new Date()
    const minDate = new Date()
    minDate.setFullYear(today.getFullYear() - 120) // Maximum 120 years old

    if (date > today) {
      return { isValid: false, error: 'Birth date cannot be in the future' }
    }

    if (date < minDate) {
      return { isValid: false, error: 'Birth date cannot be more than 120 years ago' }
    }

    return { isValid: true }
  }

  /**
   * Validate complete resident data for creation
   * @param {Object} residentData - Resident data to validate
   * @returns {Object} {isValid: boolean, errors: string[]}
   */
  static validateCreateData(residentData) {
    const errors = []

    // Required fields validation
    const firstNameValidation = this.validateFirstName(residentData.firstName)
    if (!firstNameValidation.isValid) {
      errors.push(firstNameValidation.error)
    }

    const lastNameValidation = this.validateLastName(residentData.lastName)
    if (!lastNameValidation.isValid) {
      errors.push(lastNameValidation.error)
    }

    const addressValidation = this.validateAddress(residentData.address)
    if (!addressValidation.isValid) {
      errors.push(addressValidation.error)
    }

    // Optional fields validation
    const emailValidation = this.validateEmail(residentData.email)
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error)
    }

    const mobileValidation = this.validateMobileNumber(residentData.mobileNumber)
    if (!mobileValidation.isValid) {
      errors.push(mobileValidation.error)
    }

    const birthDateValidation = this.validateBirthDate(residentData.birthDate)
    if (!birthDateValidation.isValid) {
      errors.push(birthDateValidation.error)
    }

    // Validate gender if provided
    if (residentData.gender && ![1, 2].includes(parseInt(residentData.gender))) {
      errors.push('Gender must be 1 (Male) or 2 (Female)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Convert to database format
   * @returns {Object} Database-formatted object
   */
  toDatabaseFormat() {
    return {
      user_id: this.userId,
      first_name: this.firstName,
      last_name: this.lastName,
      middle_name: this.middleName,
      suffix: this.suffix,
      birth_date: this.birthDate,
      gender: this.gender,
      civil_status: this.civilStatus,
      home_number: this.homeNumber,
      mobile_number: this.mobileNumber,
      email: this.email,
      address: this.address,
      purok: this.purok,
      family_group_id: this.familyGroupId,
      family_role: this.familyRole,
      religion: this.religion,
      occupation: this.occupation,
      special_category_id: this.specialCategoryId,
      notes: this.notes,
      is_active: this.isActive
    }
  }

  /**
   * Convert to API response format (keeping database field names for frontend compatibility)
   * @returns {Object} API-formatted object
   */
  toApiFormat() {
    return {
      id: this.id,
      user_id: this.userId,
      first_name: this.firstName,
      last_name: this.lastName,
      middle_name: this.middleName,
      suffix: this.suffix,
      fullName: this.getFullName(),
      displayName: this.getDisplayName(),
      birth_date: this.birthDate,
      age: this.calculateAge(),
      gender: this.gender,
      genderDisplay: this.getGenderDisplay(),
      civil_status: this.civilStatus,
      home_number: this.homeNumber,
      mobile_number: this.mobileNumber,
      email: this.email,
      address: this.address,
      purok: this.purok,
      family_group_id: this.familyGroupId,
      family_role: this.familyRole,
      familyRoleDisplay: this.getFamilyRoleDisplay(),
      religion: this.religion,
      occupation: this.occupation,
      special_category_id: this.specialCategoryId,
      special_category_name: this.specialCategoryName,
      specialCategoryDisplay: this.getSpecialCategoryDisplay(),
      notes: this.notes,
      is_active: this.isActive,
      isActiveResident: this.isActiveResident(),
      created_at: this.createdAt,
      updated_at: this.updatedAt
    }
  }

  /**
   * Batch process residents with special categories (static method)
   * @param {Array} residentsData - Raw resident data from database
   * @param {Object} db - Database connection
   * @returns {Array} - Array of Resident instances with special categories
   */
  static async batchProcessWithSpecialCategories(residentsData, db) {
    if (!residentsData || residentsData.length === 0) {
      return []
    }

    // Get all special category IDs from residents
    const categoryIds = [...new Set(
      residentsData
        .map(r => r.special_category_id)
        .filter(id => id !== null && id !== undefined)
    )]

    let categoryMap = {}
    
    if (categoryIds.length > 0) {
      // Fetch special categories in one query
      const categoriesQuery = `
        SELECT id, category_name 
        FROM special_categories 
        WHERE id = ANY($1)
      `
      const categoriesResult = await db.query(categoriesQuery, [categoryIds])
      
      // Create a lookup map for fast access
      categoriesResult.rows.forEach(cat => {
        categoryMap[cat.id] = cat.category_name
      })
    }

    // Create Resident instances with enriched data
    return residentsData.map(residentData => {
      const enrichedData = {
        ...residentData,
        special_category_name: residentData.special_category_id ? categoryMap[residentData.special_category_id] || null : null
      }
      return new Resident(enrichedData)
    })
  }

  /**
   * Process single resident with special category (static method)
   * @param {Object} residentData - Raw resident data from database
   * @param {Object} db - Database connection
   * @returns {Resident} - Resident instance with special category
   */
  static async processWithSpecialCategory(residentData, db) {
    if (!residentData) return null

    if (residentData.special_category_id) {
      // Fetch special category name
      const categoryQuery = `
        SELECT category_name 
        FROM special_categories 
        WHERE id = $1
      `
      const categoryResult = await db.query(categoryQuery, [residentData.special_category_id])
      
      if (categoryResult.rows.length > 0) {
        residentData.special_category_name = categoryResult.rows[0].category_name
      }
    }

    return new Resident(residentData)
  }
}

module.exports = Resident
