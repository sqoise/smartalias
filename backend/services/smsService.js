/**
 * SMS Service
 * Handles SMS notifications for announcements
 * Supports multiple SMS providers (IProg SMS API, Twilio, etc.)
 */

const db = require('../config/db')
const logger = require('../config/logger')
const config = require('../config/config')

class SMSService {
  /**
   * Send account activation SMS to resident
   * @param {Object} resident - Resident data containing phone number and name
   * @returns {Promise} Result of SMS sending
   */
  static async sendActivationSMS(resident) {
    try {
      const { mobile_number, first_name, username } = resident
      
      if (!mobile_number) {
        throw new Error('No mobile number provided for SMS notification')
      }

      // Template for activation message
      const message = `[SMARTLIAS]\n\nHi ${first_name}, your SmartLIAS account (@${username}) has been activated! You can now login to access barangay services.\n\nPlease visit: ${config.FRONTEND_URL}/login`

      // Use the actual SMS sending method
      const result = await this.sendBulkSMS(mobile_number, message)
      
      if (result.success) {
        return {
          success: true,
          message: 'SMS notification sent successfully',
          messageId: result.messageId
        }
      } else {
        throw new Error(result.error || 'Failed to send SMS')
      }

    } catch (error) {
      logger.error('SMS Service Error:', { 
        error: error.message,
        type: 'activation_sms'
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get residents based on target groups
   * @param {Array} targetGroups - Array of target groups (e.g., ['all'], ['special_category:PWD'])
   * @returns {Array} Array of residents with phone numbers
   */
  static async getRecipients(targetGroups = ['all']) {
    logger.info('Getting SMS recipients', { targetGroups })
    
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
        const specialConditions = []
        let paramIndex = 1
        
        for (const group of targetGroups) {
          if (group.startsWith('special_category:')) {
            const categoryName = group.replace('special_category:', '')
            
            if (categoryName === 'SENIOR_CITIZEN') {
              // Senior citizen is age-based, not category-based
              // Assuming 60+ years old qualifies as senior citizen
              specialConditions.push(`(EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.birth_date)) >= 60)`)
            } else {
              // Map other category names to IDs (faster numeric lookup)
              const categoryMap = {
                'PWD': 2,
                'SOLO_PARENT': 3,
                'INDIGENT': 4
              }
              
              const categoryId = categoryMap[categoryName]
              if (categoryId) {
                categoryIds.push(categoryId)
              }
            }
          }
        }

        // Build WHERE conditions
        const whereConditions = []
        
        // Add category ID conditions
        if (categoryIds.length > 0) {
          whereConditions.push(`r.special_category_id = ANY($${paramIndex})`)
          params.push(categoryIds)
          paramIndex++
        }
        
        // Add special conditions (like age-based senior citizen)
        if (specialConditions.length > 0) {
          whereConditions.push(...specialConditions)
        }

        if (whereConditions.length > 0) {
          query = `
            SELECT 
              r.id,
              r.first_name,
              r.last_name,
              r.mobile_number,
              r.birth_date,
              EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.birth_date)) as age,
              sc.category_name as special_category_name,
              CASE 
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.birth_date)) >= 60 THEN 'SENIOR_CITIZEN'
                ELSE sc.category_name
              END as effective_category
            FROM residents r
            LEFT JOIN special_categories sc ON r.special_category_id = sc.id
            WHERE r.is_active = 1 
              AND r.mobile_number IS NOT NULL 
              AND r.mobile_number != ''
              AND (${whereConditions.join(' OR ')})
            ORDER BY r.last_name, r.first_name
          `
        } else {
          // No valid categories, return empty array
          return []
        }
      }

      const result = await db.query(query, params)
      
      logger.info('SMS recipients query result', {
        targetGroups,
        recipientCount: result.rows.length
      })
      
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
    logger.info('SMS sendSMS called', {
      announcementId: announcement?.id,
      recipientCount: recipients?.length,
      targetGroups,
      hasRecipients: recipients && recipients.length > 0
    })
    
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: []
    }

    if (!recipients || recipients.length === 0) {
      logger.warn('No recipients provided for SMS sending', { announcementId: announcement?.id })
      return results
    }

    // Format SMS message
    const message = this.formatSMSMessage(announcement)

    logger.info('Preparing to send SMS notifications via bulk API', {
      announcementId: announcement.id,
      recipientCount: recipients.length,
      targetGroups,
      messageLength: message?.length || 0
    })

    // Filter and normalize valid phone numbers
    const validRecipients = []
    for (const recipient of recipients) {
      if (this.validatePhoneNumber(recipient.mobile_number)) {
        const normalizedPhone = this.normalizePhoneNumber(recipient.mobile_number)
        if (normalizedPhone) {
          validRecipients.push({
            ...recipient,
            normalizedPhone
          })
        } else {
          logger.warn('Phone normalization failed', {
            residentId: recipient.id,
            phone: recipient.mobile_number
          })
          results.failed++
        }
      } else {
        logger.warn('Invalid phone number', {
          residentId: recipient.id,
          phone: recipient.mobile_number
        })
        results.failed++
      }
    }

    // Remove duplicate phone numbers
    const seenPhones = new Set()
    const uniqueRecipients = []
    const duplicateInfo = []

    validRecipients.forEach(recipient => {
      if (seenPhones.has(recipient.normalizedPhone)) {
        duplicateInfo.push({
          name: `${recipient.first_name} ${recipient.last_name}`,
          phone: recipient.normalizedPhone,
          reason: 'Duplicate phone number'
        })
      } else {
        seenPhones.add(recipient.normalizedPhone)
        uniqueRecipients.push(recipient)
      }
    })

    // Send in batches of 1000 (provider limit)
    const BATCH_SIZE = 1000
    const batches = []
    for (let i = 0; i < uniqueRecipients.length; i += BATCH_SIZE) {
      batches.push(uniqueRecipients.slice(i, i + BATCH_SIZE))
    }

    logger.info('Sending SMS in batches', {
      totalBatches: batches.length,
      batchSize: BATCH_SIZE,
      validRecipients: validRecipients.length
    })

    const providerResponses = []

    // Send each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const phoneNumbers = batch.map(r => r.normalizedPhone).join(',')
      
      try {
        logger.info(`Sending SMS batch ${batchIndex + 1}/${batches.length}`, {
          recipientsInBatch: batch.length,
          phoneNumbers: phoneNumbers.substring(0, 100) + '...' // Log first 100 chars
        })

        const sendResult = await this.sendBulkSMS(phoneNumbers, message)

        if (sendResult.success) {
          // If bulk send successful, mark all in batch as sent
          results.sent += batch.length
          
          // Log each recipient as successful
          for (const recipient of batch) {
            providerResponses.push({
              phone: recipient.normalizedPhone,
              success: true,
              messageId: sendResult.messageId || `BULK-${Date.now()}-${batchIndex}`,
              error: null
            })
          }
        } else {
          // If bulk send failed, mark all in batch as failed
          results.failed += batch.length
          
          // Log each recipient as failed
          for (const recipient of batch) {
            providerResponses.push({
              phone: recipient.normalizedPhone,
              success: false,
              messageId: null,
              error: sendResult.error
            })
            
            results.errors.push({
              recipient: `${recipient.first_name} ${recipient.last_name}`,
              error: sendResult.error
            })
          }
        }
      } catch (error) {
        logger.error(`Error sending SMS batch ${batchIndex + 1}`, {
          error: error.message,
          batchSize: batch.length
        })
        
        results.failed += batch.length
        
        for (const recipient of batch) {
          results.errors.push({
            recipient: `${recipient.first_name} ${recipient.last_name}`,
            error: error.message
          })
        }
      }

      // Rate limiting: Small delay between batches to respect API limits
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
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

    logger.info('SMS bulk sending completed', {
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
    const maxLength = 1000 // Standard SMS length
    const prefix = '[SMARTLIAS]\n'
    
    let message = `${prefix}\n${announcement.content}`
    
    // Truncate if too long
    if (message.length > maxLength) {
      const availableLength = maxLength - prefix.length - suffix.length - 3 // 3 for "..."
      const truncatedContent = announcement.content.substring(0, availableLength)
      message = `${prefix}\n${truncatedContent}`
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
   * Send SMS to multiple recipients using the configured provider (IProg priority)
   * @param {String} phoneNumbers - Comma-separated phone numbers
   * @param {String} message - SMS message content
   * @returns {Object} Send result
   */
  static async sendBulkSMS(phoneNumbers, message) {
    const provider = config.SMS_PROVIDER || 'iprog'
    
    try {
      switch (provider.toLowerCase()) {
        case 'iprog':
          return await this.sendBulkViaIProg(phoneNumbers, message)
        default:
          // Default to IProg if provider not recognized
          logger.warn(`Unknown SMS provider: ${provider}, defaulting to IProg`)
          return await this.sendBulkViaIProg(phoneNumbers, message)
      }
    } catch (error) {
      logger.error(`Error with ${provider} SMS provider, trying fallback`, error)
      
      // Fallback logic: try the other provider
      try {
        // Fallback to IProg if other provider fails
        logger.info('Falling back to IProg SMS provider')
        return await this.sendBulkViaIProg(phoneNumbers, message)
      } catch (fallbackError) {
        logger.error('SMS provider failed', fallbackError)
        return {
          success: false,
          error: `Both SMS providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`
        }
      }
    }
  }

  /**
   * Send SMS to multiple recipients via IProg bulk API (Philippines SMS Provider)
   * @param {String} phoneNumbers - Comma-separated phone numbers
   * @param {String} message - SMS message content
   * @returns {Object} Send result
   */
  static async sendBulkViaIProg(phoneNumbers, message) {
    try {
      const apiToken = config.IPROG_API_TOKEN
      
      if (!apiToken || apiToken === 'your-iprog-api-token-here') {
        // Development mode - simulate bulk SMS
        if (config.NODE_ENV === 'development') {
          logger.info('Simulating IProg bulk SMS in development mode', {
            phoneCount: phoneNumbers.split(',').length,
            message: message.substring(0, 50) + '...'
          })
          
          return {
            success: true,
            messageId: `IPROG-SIM-${Date.now()}`,
            message: 'IProg bulk SMS simulated in development mode'
          }
        }
        
        // Production without API token - error
        return {
          success: false,
          error: 'IProg API token not configured'
        }
      }

      // Prepare URL parameters for IProg API
      const urlParams = new URLSearchParams({
        api_token: apiToken,
        phone_number: phoneNumbers, // Comma-separated phone numbers
        message: message
      })
      
      // Add SMS provider if configured
      if (config.IPROG_SMS_PROVIDER !== undefined) {
        urlParams.append('sms_provider', config.IPROG_SMS_PROVIDER.toString())
      }
      
      const apiUrl = `https://sms.iprogtech.com/api/v1/sms_messages/send_bulk?${urlParams.toString()}`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        logger.error('IProg bulk API HTTP error', { 
          status: response.status, 
          statusText: response.statusText,
          response: errorText,
          phoneCount: phoneNumbers.split(',').length
        })
        
        return {
          success: false,
          error: `IProg API HTTP ${response.status}: ${errorText || response.statusText}`
        }
      }

      // Parse JSON response
      const result = await response.json()
      
      // IProg API success response structure
      // IProg returns status: 200 (number) and message_ids when successful
      if (result.success || 
          result.status === 'success' || 
          result.status === 200 ||
          result.message_ids ||
          result.message === 'SMS sent successfully' ||
          result.message?.includes('successfully added to the queue')) {
        
        logger.info('IProg bulk SMS sent successfully', {
          phoneCount: phoneNumbers.split(',').length,
          messageId: result.message_ids || result.message_id || result.id || result.reference_id,
          response: result
        })
        
        return {
          success: true,
          messageId: result.message_ids || result.message_id || result.id || result.reference_id || `IPROG-${Date.now()}`,
          message: `IProg bulk SMS sent successfully to ${phoneNumbers.split(',').length} recipients`
        }
      } else {
        const errorMessage = result.message || result.error || result.errors || 'Failed to send bulk SMS via IProg'
        logger.error('Failed to send bulk SMS via IProg', { 
          phoneCount: phoneNumbers.split(',').length,
          error: errorMessage,
          result 
        })
        
        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error) {
      logger.error('Error sending bulk SMS via IProg', {
        error: error.message,
        phoneCount: phoneNumbers.split(',').length
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Removed: Semaphore SMS methods (legacy provider)
  // The system now uses IProg SMS API as the primary provider

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

  /**
   * Check SMS credits and service status via IProg API
   * @returns {Object} Service status and credits information
   */
  static async checkSMSCredits() {
    logger.info('Checking SMS credits and service status')
    
    try {
      const apiToken = config.IPROG_API_TOKEN
      if (!apiToken) {
        logger.warn('IProg API token not configured')
        return {
          available: false,
          credits: 0,
          provider: 'IProg',
          error: 'API token not configured'
        }
      }

      const url = `https://sms.iprogtech.com/api/v1/account/sms_credits?api_token=${encodeURIComponent(apiToken)}`
      
      logger.info('Making IProg credits API request', { url: url.replace(apiToken, '***') })
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      })

      if (!response.ok) {
        logger.error('IProg credits API HTTP error', { 
          status: response.status, 
          statusText: response.statusText 
        })
        return {
          available: false,
          credits: 0,
          provider: 'IProg',
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const data = await response.json()
      logger.info('IProg credits API response', { 
        status: data.status, 
        message: data.message,
        credits: data.data?.load_balance 
      })

      const isAvailable = data.status === 'success'
      const credits = data.data?.load_balance || 0

      return {
        available: isAvailable,
        credits: credits,
        provider: 'IProg',
        message: data.message || 'Unknown response',
        lastChecked: new Date().toISOString()
      }

    } catch (error) {
      logger.error('Error checking SMS credits', error)
      
      return {
        available: false,
        credits: 0,
        provider: 'IProg',
        error: error.message || 'Unknown error',
        lastChecked: new Date().toISOString()
      }
    }
  }
}

module.exports = SMSService
