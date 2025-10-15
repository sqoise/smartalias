/**
 * DateTime Utility Class
 * Centralized datetime formatting for Manila timezone with 24-hour format
 * Follows DRY principle for consistent datetime handling
 */

class DateTime {
  /**
   * Get current datetime in Manila timezone with 24-hour format
   * Format: YYYY-MM-DD HH:mm:ss
   * @returns {string} Formatted datetime string
   */
  static now() {
    return new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 24-hour military time
    }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')
  }

  /**
   * Format any date to Manila timezone with 24-hour format
   * @param {Date} date - Date object to format
   * @returns {string} Formatted datetime string
   */
  static format(date = new Date()) {
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')
  }

  /**
   * Get database-compatible datetime string
   * Format: YYYY-MM-DD HH:mm:ss (MySQL/PostgreSQL DATETIME format)
   * @returns {string} Database-compatible datetime string
   */
  static forDatabase() {
    return DateTime.now()
  }

  /**
   * Get ISO string in Manila timezone (for API responses)
   * @returns {string} ISO-like string in Manila timezone
   */
  static toISO() {
    const manilaTime = DateTime.now()
    return `${manilaTime.replace(' ', 'T')}+08:00`
  }

  /**
   * Get timestamp for logging (same format but with timezone indicator)
   * @returns {string} Timestamp for logs
   */
  static forLogs() {
    return `${DateTime.now()} PHT`
  }

  /**
   * Parse database datetime string to Date object
   * @param {string} dateTimeString - Database datetime string
   * @returns {Date} Date object
   */
  static parseFromDatabase(dateTimeString) {
    return new Date(dateTimeString + ' GMT+0800')
  }
}

module.exports = DateTime
