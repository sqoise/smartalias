/**
 * ID Utility Functions
 * Handles ID formatting with leading zeros
 */

class IDUtils {
  /**
   * Format ID with leading zeros (5 digits)
   * @param {number|string} id - The ID to format
   * @returns {string} Formatted ID with leading zeros (e.g., "00001", "00042", "01234")
   */
  static formatID(id) {
    if (!id) return '00000'
    
    const numId = parseInt(id)
    if (isNaN(numId)) return '00000'
    
    // Ensure 5 digits with leading zeros
    return numId.toString().padStart(5, '0')
  }

  /**
   * Format multiple IDs
   * @param {Array} ids - Array of IDs to format
   * @returns {Array} Array of formatted IDs
   */
  static formatIDs(ids) {
    if (!Array.isArray(ids)) return []
    return ids.map(id => this.formatID(id))
  }

  /**
   * Parse formatted ID back to integer
   * @param {string} formattedId - Formatted ID string (e.g., "00001")
   * @returns {number} Integer ID
   */
  static parseID(formattedId) {
    if (!formattedId) return 0
    const parsed = parseInt(formattedId)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Validate ID format
   * @param {string} formattedId - ID to validate
   * @returns {boolean} True if valid 5-digit format
   */
  static isValidFormat(formattedId) {
    if (typeof formattedId !== 'string') return false
    return /^\d{5}$/.test(formattedId)
  }

  /**
   * Generate next formatted ID from array of existing IDs
   * @param {Array} existingIds - Array of existing formatted or numeric IDs
   * @returns {string} Next available formatted ID
   */
  static generateNextID(existingIds) {
    if (!Array.isArray(existingIds) || existingIds.length === 0) {
      return '00001'
    }

    // Convert all to numbers and find max
    const numericIds = existingIds
      .map(id => this.parseID(id))
      .filter(id => id > 0)

    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0
    return this.formatID(maxId + 1)
  }
}

module.exports = IDUtils
