/**
 * SMS Service
 * Handles SMS notifications for announcements
 * Supports multiple SMS providers (Semaphore, Twilio, etc.)
 */

const db = require('../config/db')
const logger = require('../config/logger')
const config = require('../config/config')

class SMSService {
  /**
   * Get residents based on target groups
   * @param {Array} targetGroups - Array of target groups (e.g., ['all'], ['special_category:PWD'])
   * @returns {Array} Array of residents with phone numbers
   */
  static async getRecipients(targetGroups = ['all']) {
    try {
      let query
      let params = []

      if (targetGroups.includes('all')) {
        // Get all active residents with mobile numbers
        query = `
          SELECT 
            r.id,
            r.first_name,
            r.last_name,
            r.mobile_number,
            sc.category_name as special_category_name
          FROM residents r
          LEFT JOIN special_categories sc ON r.special_category_id = sc.id
          WHERE r.is_active = 1 
            AND r.mobile_number IS NOT NULL 
            AND r.mobile_number != ''
          ORDER BY r.last_name, r.first_name
        `
      } else {
        // Filter by specific target groups
        const categoryIds = []
        
        for (const group of targetGroups) {
          if (group.startsWith('special_category:')) {
            const categoryName = group.replace('special_category:', '')
            
            // Map category names to IDs
            const categoryMap = {
              'PWD': 1,
              'SENIOR_CITIZEN': 2,
              'SOLO_PARENT': 3,
              'INDIGENT': 4
            }
            
            const categoryId = categoryMap[categoryName]
            if (categoryId) {
              categoryIds.push(categoryId)
            }
          }
        }

        if (categoryIds.length > 0) {
          query = `
            SELECT 
              r.id,
              r.first_name,
              r.last_name,
              r.mobile_number,
              sc.category_name as special_category_name
            FROM residents r
            LEFT JOIN special_categories sc ON r.special_category_id = sc.id
            WHERE r.is_active = 1 
              AND r.mobile_number IS NOT NULL 
              AND r.mobile_number != ''
              AND r.special_category_id = ANY($1)
            ORDER BY r.last_name, r.first_name
          `
          params = [categoryIds]
        } else {
          // No valid categories, return empty array
          return []
        }
      }

      const result = await db.query(query, params)
      return result.rows
    } catch (error) {
      logger.error('Error getting SMS recipients', error)
      throw error
    }
  }

  /**
   * Send SMS to recipients
   * @param {Object} announcement - Announcement details
   * @param {Array} recipients - Array of recipient objects
   * @param {Array} targetGroups - Target groups for logging
   * @returns {Object} Send results
   */
  static async sendSMS(announcement, recipients, targetGroups = ['all']) {
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: []
    }

    // Format SMS message
    const message = this.formatSMSMessage(announcement)
    const providerResponses = []

    logger.info('Preparing to send SMS notifications', {
      announcementId: announcement.id,
      recipientCount: recipients.length,
      targetGroups
    })

    // Send SMS to each recipient
    for (const recipient of recipients) {
      try {
        // Validate phone number
        if (!this.validatePhoneNumber(recipient.mobile_number)) {
          logger.warn('Invalid phone number', {
            residentId: recipient.id,
            phone: recipient.mobile_number
          })
          results.failed++
          continue
        }

        // Send SMS via provider
        const sendResult = await this.sendViaSemaphore(
          recipient.mobile_number,
          message
        )

        // Collect provider response for batch logging
        providerResponses.push({
          phone: recipient.mobile_number,
          success: sendResult.success,
          messageId: sendResult.messageId,
          error: sendResult.error
        })

        if (sendResult.success) {
          results.sent++
        } else {
          results.failed++
          results.errors.push({
            recipient: `${recipient.first_name} ${recipient.last_name}`,
            error: sendResult.error
          })
        }
      } catch (error) {
        logger.error('Error sending SMS to recipient', {
          residentId: recipient.id,
          error: error.message
        })
        results.failed++
        results.errors.push({
          recipient: `${recipient.first_name} ${recipient.last_name}`,
          error: error.message
        })
      }
    }

    // Log SMS batch summary to database
    await this.logSMSBatch({
      announcementId: announcement.id,
      targetGroups,
      totalRecipients: results.total,
      successfulSends: results.sent,
      failedSends: results.failed,
      smsContent: message,
      providerResponses
    })

    logger.info('SMS sending completed', {
      announcementId: announcement.id,
      total: results.total,
      sent: results.sent,
      failed: results.failed,
      targetGroups
    })

    return results
  }

  /**
   * Format announcement as SMS message
   * @param {Object} announcement - Announcement object
   * @returns {String} Formatted SMS message
   */
  static formatSMSMessage(announcement) {
    const maxLength = 160 // Standard SMS length
    const prefix = '[BARANGAY ANNOUNCEMENT]\n'
    const suffix = '\n- Barangay Office'
    
    let message = `${prefix}${announcement.title}\n\n${announcement.content}${suffix}`
    
    // Truncate if too long
    if (message.length > maxLength) {
      const availableLength = maxLength - prefix.length - suffix.length - 3 // 3 for "..."
      const truncatedContent = announcement.content.substring(0, availableLength)
      message = `${prefix}${announcement.title}\n\n${truncatedContent}...${suffix}`
    }
    
    return message
  }

  /**
   * Validate Philippine mobile number format
   * @param {String} phone - Phone number to validate
   * @returns {Boolean} True if valid
   */
  static validatePhoneNumber(phone) {
    if (!phone) return false
    
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '')
    
    // Philippine mobile number patterns:
    // 09xxxxxxxxx (11 digits)
    // +639xxxxxxxxx (13 digits)
    // 639xxxxxxxxx (12 digits)
    const patterns = [
      /^09\d{9}$/,           // 09xxxxxxxxx
      /^\+639\d{9}$/,        // +639xxxxxxxxx
      /^639\d{9}$/           // 639xxxxxxxxx
    ]
    
    return patterns.some(pattern => pattern.test(cleaned))
  }

  /**
   * Normalize phone number to standard format (09xxxxxxxxx)
   * @param {String} phone - Phone number
   * @returns {String} Normalized phone number
   */
  static normalizePhoneNumber(phone) {
    if (!phone) return null
    
    const cleaned = phone.replace(/[\s-]/g, '')
    
    // Convert +639xxxxxxxxx to 09xxxxxxxxx
    if (cleaned.startsWith('+639')) {
      return '0' + cleaned.substring(3)
    }
    
    // Convert 639xxxxxxxxx to 09xxxxxxxxx
    if (cleaned.startsWith('639')) {
      return '0' + cleaned.substring(2)
    }
    
    // Already in 09xxxxxxxxx format
    if (cleaned.startsWith('09')) {
      return cleaned
    }
    
    return phone
  }

  /**
   * Send SMS via Semaphore API (Philippine SMS Provider)
   * @param {String} phone - Recipient phone number
   * @param {String} message - SMS message content
   * @returns {Object} Send result
   */
  static async sendViaSemaphore(phone, message) {
    try {
      const apiKey = config.SEMAPHORE_API_KEY
      
      // Check if API key is configured
      if (!apiKey || apiKey === 'your-semaphore-api-key-here') {
        // Development mode - simulate SMS sending
        if (config.isDevelopment) {
          logger.info('SMS simulation (development mode)', {
            phone: phone,
            message: message.substring(0, 50) + '...'
          })
          
          return {
            success: true,
            messageId: `SIM-${Date.now()}`,
            message: 'SMS simulated in development mode'
          }
        }
        
        // Production without API key - error
        return {
          success: false,
          error: 'Semaphore API key not configured'
        }
      }

      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phone)

      // Send actual SMS via Semaphore API
      const response = await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apikey: apiKey,
          number: normalizedPhone,
          message: message,
          sendername: config.SEMAPHORE_SENDER_NAME || 'BARANGAY LIAS'
        })
      })

      // Check content type before parsing
      const contentType = response.headers.get('content-type')
      let result
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
      } else {
        // Handle non-JSON responses (likely error messages)
        const textResponse = await response.text()
        logger.error('Semaphore API returned non-JSON response', { 
          status: response.status, 
          statusText: response.statusText,
          response: textResponse 
        })
        
        return {
          success: false,
          error: `API Error: ${textResponse || response.statusText || 'Unknown error'}`
        }
      }

      if (response.ok && result.message_id) {
        return {
          success: true,
          messageId: result.message_id,
          message: 'SMS sent successfully'
        }
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to send SMS'
        logger.error('Failed to send SMS via Semaphore', { 
          phone: normalizedPhone, 
          error: errorMessage,
          status: response.status,
          result 
        })
        
        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error) {
      logger.error('Error sending SMS via Semaphore', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Log SMS batch summary to database
   * @param {Object} batchData - SMS batch log data
   */
  static async logSMSBatch(batchData) {
    try {
      const query = `
        INSERT INTO announcement_sms_logs (
          announcement_id,
          target_groups,
          total_recipients,
          successful_sends,
          failed_sends,
          sms_content,
          provider_response,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id
      `
      
      const values = [
        batchData.announcementId,
        JSON.stringify(batchData.targetGroups),
        batchData.totalRecipients,
        batchData.successfulSends,
        batchData.failedSends,
        batchData.smsContent,
        batchData.providerResponses ? JSON.stringify(batchData.providerResponses) : null
      ]

      const result = await db.query(query, values)
      
      logger.info('SMS batch logged successfully', {
        logId: result.rows[0].id,
        announcementId: batchData.announcementId,
        totalRecipients: batchData.totalRecipients,
        successfulSends: batchData.successfulSends,
        failedSends: batchData.failedSends
      })
      
      return result.rows[0].id
    } catch (error) {
      logger.error('Error logging SMS batch', error)
      // Don't throw - logging failure shouldn't stop SMS sending
    }
  }
}

module.exports = SMSService
