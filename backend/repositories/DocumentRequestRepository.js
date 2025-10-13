/**
 * DocumentRequestRepository
 * Handles document request database operations
 */

const db = require('../config/db')
const logger = require('../config/logger')

class DocumentRequestRepository {
  /**
   * Get all active documents from catalog
   */
  static async getActiveCatalog() {
    try {
      const query = `
        SELECT id, title, description, fee, filename, is_active 
        FROM document_catalog 
        WHERE is_active = 1 
        ORDER BY title ASC
      `
      const result = await db.query(query)
      return result.rows
    } catch (error) {
      logger.error('DocumentRequestRepository.getActiveCatalog error:', error)
      throw error
    }
  }

  /**
   * Get all documents from catalog (including inactive)
   */
  static async getAllCatalog() {
    try {
      const query = `
        SELECT id, title, description, fee, filename, is_active 
        FROM document_catalog 
        ORDER BY title ASC
      `
      const result = await db.query(query)
      return result.rows
    } catch (error) {
      logger.error('DocumentRequestRepository.getAllCatalog error:', error)
      throw error
    }
  }

  /**
   * Get document from catalog by title
   * @param {string} title - Document title
   * @returns {Object|null} - Document catalog entry or null
   */
  static async getDocumentByTitle(title) {
    try {
      const query = `
        SELECT id, title, description, fee, filename, is_active 
        FROM document_catalog 
        WHERE title = $1
      `
      const result = await db.query(query, [title])
      return result.rows[0] || null
    } catch (error) {
      logger.error('DocumentRequestRepository.getDocumentByTitle error:', error)
      throw error
    }
  }

  /**
   * Get document from catalog by ID
   * @param {number} documentId - Document ID
   * @returns {Object|null} - Document catalog entry or null
   */
  static async getDocumentById(documentId) {
    try {
      const query = `
        SELECT id, title, description, fee, filename, is_active 
        FROM document_catalog 
        WHERE id = $1
      `
      const result = await db.query(query, [documentId])
      return result.rows[0] || null
    } catch (error) {
      logger.error('DocumentRequestRepository.getDocumentById error:', error)
      throw error
    }
  }

  /**
   * Create new document request
   */
  static async createRequest(residentId, documentId, purpose, notes = null) {
    try {
      const query = `
        INSERT INTO document_requests (resident_id, document_id, purpose, notes, status, created_at)
        VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `
      const result = await db.query(query, [residentId, documentId, purpose.trim(), notes?.trim() || null])
      return result.rows[0]
    } catch (error) {
      logger.error('DocumentRequestRepository.createRequest error:', error)
      throw error
    }
  }

  /**
   * Check for existing pending/processing requests
   */
  static async hasExistingRequest(residentId, documentId) {
    try {
      const query = `
        SELECT id, status FROM document_requests 
        WHERE resident_id = $1 AND document_id = $2 AND status IN (0, 1)
      `
      const result = await db.query(query, [residentId, documentId])
      return result.rows.length > 0
    } catch (error) {
      logger.error('DocumentRequestRepository.hasExistingRequest error:', error)
      throw error
    }
  }

  /**
   * Get document request by ID with resident and document details
   */
  static async getRequestById(requestId, residentId = null) {
    try {
      let query = `
        SELECT 
          dr.id,
          dr.resident_id,
          CONCAT(r.first_name, ' ', r.last_name) as resident_name,
          r.address,
          r.birth_date,
          r.civil_status,
          dr.document_id,
          dc.title as document_type,
          dc.description as document_description,
          dc.fee,
          dr.purpose,
          dr.notes,
          dr.remarks,
          dr.status,
          dr.created_at,
          dr.updated_at,
          dr.processed_by,
          dr.processed_at,
          (SELECT created_at FROM document_requests_logs WHERE request_id = dr.id AND new_status = 2 ORDER BY created_at DESC LIMIT 1) as rejected_at,
          (SELECT created_at FROM document_requests_logs WHERE request_id = dr.id AND new_status = 4 ORDER BY created_at DESC LIMIT 1) as completed_at,
          CASE 
            WHEN dr.status = 0 THEN 'pending'
            WHEN dr.status = 1 THEN 'processing'
            WHEN dr.status = 2 THEN 'rejected'
            WHEN dr.status = 3 THEN 'ready'
            WHEN dr.status = 4 THEN 'claimed'
            ELSE 'unknown'
          END as status_text
        FROM document_requests dr
        JOIN residents r ON dr.resident_id = r.id
        JOIN document_catalog dc ON dr.document_id = dc.id
        WHERE dr.id = $1
      `

      let queryParams = [requestId]

      // If residentId is provided, add resident filtering
      if (residentId !== null) {
        query += ' AND dr.resident_id = $2'
        queryParams.push(residentId)
      }

      const result = await db.query(query, queryParams)
      return result.rows[0] || null
    } catch (error) {
      logger.error('DocumentRequestRepository.getRequestById error:', error)
      throw error
    }
  }

  /**
   * Get request timeline/logs
   */
  static async getRequestTimeline(requestId) {
    try {
      const query = `
        SELECT 
          drl.status,
          drl.action,
          drl.remarks,
          drl.performed_by,
          drl.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as performed_by_name,
          CASE 
            WHEN drl.status = 0 THEN 'pending'
            WHEN drl.status = 1 THEN 'processing'
            WHEN drl.status = 2 THEN 'rejected'
            WHEN drl.status = 3 THEN 'ready'
            WHEN drl.status = 4 THEN 'claimed'
            ELSE 'unknown'
          END as status_text
        FROM document_requests_logs drl
        LEFT JOIN users u ON drl.performed_by = u.id
        WHERE drl.request_id = $1
        ORDER BY drl.created_at ASC
      `
      const result = await db.query(query, [requestId])
      return result.rows
    } catch (error) {
      logger.error('DocumentRequestRepository.getRequestTimeline error:', error)
      throw error
    }
  }

  /**
   * Update request status
   */
  static async updateStatus(requestId, status, processedBy, remarks = null) {
    try {
      const query = `
        UPDATE document_requests 
        SET status = $1, processed_by = $2, processed_at = CURRENT_TIMESTAMP, 
            remarks = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, status, processed_at
      `
      const result = await db.query(query, [status, processedBy, remarks?.trim() || null, requestId])
      return result.rows[0]
    } catch (error) {
      logger.error('DocumentRequestRepository.updateStatus error:', error)
      throw error
    }
  }

  /**
   * Log an action performed on a document request
   * @param {number} requestId - The request ID
   * @param {string} action - The action performed
   * @param {string} oldStatus - Previous status (optional)
   * @param {string} newStatus - New status (optional)  
   * @param {number} performedBy - User ID who performed the action
   * @returns {Object} The created log entry
   */
  static async logAction(requestId, action, oldStatus = null, newStatus = null, performedBy) {
    try {
      const query = `
        INSERT INTO document_requests_logs (request_id, action, old_status, new_status, action_by, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id
      `
      const result = await db.query(query, [requestId, action, oldStatus, newStatus, performedBy])
      return result.rows[0]
    } catch (error) {
      logger.error('DocumentRequestRepository.logAction error:', error)
      throw error
    }
  }

  /**
   * Get requests with advanced filters and pagination (optimized for POST requests)
   */
  static async searchRequests(filters = {}, pagination = { page: 1, limit: 25 }, sorting = {}) {
    try {
      const { 
        residentId = null, 
        status = null, 
        documentType = null, 
        search = null, 
        dateRange = null 
      } = filters
      
      const { page, limit } = pagination
      const { sortField = 'created_at', sortDirection = 'desc' } = sorting

      let whereConditions = []
      let queryParams = []
      let paramIndex = 1

      // Role-based filtering
      if (residentId) {
        whereConditions.push(`dr.resident_id = $${paramIndex}`)
        queryParams.push(residentId)
        paramIndex++
      }

      // Status filtering
      if (status && status !== 'all') {
        const statusMap = {
          'pending': 0,
          'processing': 1, 
          'rejected': 2,
          'ready': 3,
          'claimed': 4,
          'completed': 4 // Alias for claimed (status 4)
        }
        if (statusMap[status] !== undefined) {
          whereConditions.push(`dr.status = $${paramIndex}`)
          queryParams.push(statusMap[status])
          paramIndex++
        }
      }

      // Document type filtering
      if (documentType && documentType !== 'all') {
        whereConditions.push(`dc.title ILIKE $${paramIndex}`)
        queryParams.push(`%${documentType}%`)
        paramIndex++
      }

      // Enhanced search filtering (optimized for performance)
      if (search && search.trim()) {
        const searchTerm = search.trim()
        whereConditions.push(`(
          dr.id::text ILIKE $${paramIndex} OR
          CONCAT(r.first_name, ' ', r.last_name) ILIKE $${paramIndex + 1} OR
          dc.title ILIKE $${paramIndex + 2} OR
          dr.purpose ILIKE $${paramIndex + 3}
        )`)
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`)
        paramIndex += 4
      }

      // Date range filtering (optimized)
      if (dateRange && dateRange !== 'all') {
        const now = new Date()
        let dateFilter
        if (dateRange === '7days') {
          dateFilter = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
        } else if (dateRange === '30days') {
          dateFilter = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        } else if (dateRange === '90days') {
          dateFilter = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
        }
        
        if (dateFilter) {
          whereConditions.push(`dr.created_at >= $${paramIndex}`)
          queryParams.push(dateFilter)
          paramIndex++
        }
      }

      // Build WHERE clause
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

      // Validate and sanitize sort parameters
      const allowedSortFields = ['created_at', 'status', 'document_type', 'resident_name', 'id', 'updated_at']
      const sanitizedSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at'
      const sanitizedSortDirection = sortDirection === 'asc' ? 'ASC' : 'DESC'

      // Map sort fields to actual column names
      const sortFieldMap = {
        'created_at': 'dr.created_at',
        'updated_at': 'dr.updated_at',
        'status': 'dr.status',
        'document_type': 'dc.title',
        'resident_name': 'resident_name',
        'id': 'dr.id'
      }

      const actualSortField = sortFieldMap[sanitizedSortField]

      // Pagination with limits (max 100 per request)
      const maxLimit = 100
      const sanitizedLimit = Math.min(Math.max(1, parseInt(limit)), maxLimit)
      const sanitizedPage = Math.max(1, parseInt(page))
      const offset = (sanitizedPage - 1) * sanitizedLimit
      
      const limitParamIndex = paramIndex
      const offsetParamIndex = paramIndex + 1
      queryParams.push(sanitizedLimit, offset)

      const query = `
        SELECT 
          dr.id,
          dr.resident_id,
          CONCAT(r.first_name, ' ', r.last_name) as resident_name,
          r.address,
          dr.document_id,
          dc.title as document_type,
          dc.filename as template_filename,
          dr.purpose,
          dr.notes,
          dr.remarks,
          dr.status,
          dr.created_at,
          dr.updated_at,
          dr.processed_by,
          dr.processed_at,
          dc.fee,
          (SELECT created_at FROM document_requests_logs WHERE request_id = dr.id AND new_status = 2 ORDER BY created_at DESC LIMIT 1) as rejected_at,
          (SELECT created_at FROM document_requests_logs WHERE request_id = dr.id AND new_status = 4 ORDER BY created_at DESC LIMIT 1) as completed_at,
          CASE 
            WHEN dr.status = 0 THEN 'pending'
            WHEN dr.status = 1 THEN 'processing'
            WHEN dr.status = 2 THEN 'rejected'
            WHEN dr.status = 3 THEN 'ready'
            WHEN dr.status = 4 THEN 'claimed'
            ELSE 'unknown'
          END as status_text
        FROM document_requests dr
        JOIN residents r ON dr.resident_id = r.id
        JOIN document_catalog dc ON dr.document_id = dc.id
        ${whereClause}
        ORDER BY ${actualSortField} ${sanitizedSortDirection}
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `

      const result = await db.query(query, queryParams)

      // Get total count for pagination (optimized count query)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM document_requests dr
        JOIN residents r ON dr.resident_id = r.id
        JOIN document_catalog dc ON dr.document_id = dc.id
        ${whereClause}
      `
      
      const countResult = await db.query(countQuery, queryParams.slice(0, -2))
      const total = parseInt(countResult.rows[0].total)

      return {
        requests: result.rows,
        pagination: {
          page: sanitizedPage,
          limit: sanitizedLimit,
          total,
          totalPages: Math.ceil(total / sanitizedLimit)
        },
        filters: {
          ...filters,
          sortField: sanitizedSortField,
          sortDirection: sanitizedSortDirection
        }
      }
    } catch (error) {
      logger.error('DocumentRequestRepository.searchRequests error:', error)
      throw error
    }
  }

  /**
   * Get advanced statistics with grouping and trends
   */
  static async getAdvancedStatistics(options = {}) {
    try {
      const { 
        dateRange = '7days', 
        documentType = null,
        groupBy = null,
        includeTrends = false 
      } = options

      // Calculate date filter
      const now = new Date()
      let dateFilter
      if (dateRange === '7days') {
        dateFilter = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      } else if (dateRange === '30days') {
        dateFilter = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
      } else if (dateRange === '90days') {
        dateFilter = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
      } else {
        // For 'all', use a very old date
        dateFilter = new Date('2020-01-01')
      }

      let whereConditions = ['dr.created_at >= $1']
      let queryParams = [dateFilter]
      let paramIndex = 2

      // Document type filtering
      if (documentType && documentType !== 'all') {
        whereConditions.push(`dc.title ILIKE $${paramIndex}`)
        queryParams.push(`%${documentType}%`)
        paramIndex++
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`

      // Basic statistics query with additional metrics
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      queryParams.push(todayStart)

      const statsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE dr.status = 0) as pending,
          COUNT(*) FILTER (WHERE dr.status = 1) as processing,
          COUNT(*) FILTER (WHERE dr.status = 2) as rejected,
          COUNT(*) FILTER (WHERE dr.status = 3) as ready,
          COUNT(*) FILTER (WHERE dr.status = 4) as claimed,
          COUNT(*) as total,
          AVG(EXTRACT(EPOCH FROM (dr.processed_at - dr.created_at))/3600) FILTER (WHERE dr.processed_at IS NOT NULL) as avg_processing_hours,
          COUNT(*) FILTER (WHERE dr.created_at >= $${paramIndex}) as today_total,
          COUNT(DISTINCT dr.resident_id) as unique_residents,
          COUNT(DISTINCT dc.id) as document_types_requested
        FROM document_requests dr
        JOIN document_catalog dc ON dr.document_id = dc.id
        ${whereClause}
      `

      const result = await db.query(statsQuery, queryParams)
      const stats = result.rows[0]

      // Convert and format numbers
      Object.keys(stats).forEach(key => {
        if (key === 'avg_processing_hours') {
          stats[key] = parseFloat(stats[key]) || 0
        } else {
          stats[key] = parseInt(stats[key]) || 0
        }
      })

      const responseData = { basic: stats }

      // Group by statistics if requested
      if (groupBy) {
        const groupParams = queryParams.slice(0, -1) // Remove today parameter
        let groupQuery

        if (groupBy === 'document_type') {
          groupQuery = `
            SELECT 
              dc.title as label,
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE dr.status = 0) as pending,
              COUNT(*) FILTER (WHERE dr.status = 1) as processing,
              COUNT(*) FILTER (WHERE dr.status = 2) as rejected,
              COUNT(*) FILTER (WHERE dr.status = 3) as ready,
              COUNT(*) FILTER (WHERE dr.status = 4) as claimed,
              AVG(dc.fee) as avg_fee
            FROM document_requests dr
            JOIN document_catalog dc ON dr.document_id = dc.id
            ${whereClause}
            GROUP BY dc.title, dc.fee
            ORDER BY total DESC
            LIMIT 20
          `
        } else if (groupBy === 'status') {
          groupQuery = `
            SELECT 
              CASE 
                WHEN dr.status = 0 THEN 'pending'
                WHEN dr.status = 1 THEN 'processing'
                WHEN dr.status = 2 THEN 'rejected'
                WHEN dr.status = 3 THEN 'ready'
                WHEN dr.status = 4 THEN 'claimed'
                ELSE 'unknown'
              END as label,
              COUNT(*) as total,
              ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM document_requests dr
            JOIN document_catalog dc ON dr.document_id = dc.id
            ${whereClause}
            GROUP BY dr.status
            ORDER BY dr.status
          `
        } else if (groupBy === 'daily' && dateRange !== 'all') {
          groupQuery = `
            SELECT 
              DATE(dr.created_at) as label,
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE dr.status = 0) as pending,
              COUNT(*) FILTER (WHERE dr.status = 1) as processing,
              COUNT(*) FILTER (WHERE dr.status = 2) as rejected,
              COUNT(*) FILTER (WHERE dr.status = 3) as ready,
              COUNT(*) FILTER (WHERE dr.status = 4) as claimed
            FROM document_requests dr
            JOIN document_catalog dc ON dr.document_id = dc.id
            ${whereClause}
            GROUP BY DATE(dr.created_at)
            ORDER BY DATE(dr.created_at) DESC
            LIMIT 30
          `
        }

        if (groupQuery) {
          const groupResult = await db.query(groupQuery, groupParams)
          responseData.grouped = groupResult.rows
        }
      }

      // Trends data if requested
      if (includeTrends && dateRange !== 'all') {
        const trendsQuery = `
          SELECT 
            DATE(dr.created_at) as date,
            COUNT(*) as requests,
            COUNT(*) FILTER (WHERE dr.status = 4) as completed,
            COUNT(*) FILTER (WHERE dr.status = 2) as rejected,
            AVG(EXTRACT(EPOCH FROM (dr.processed_at - dr.created_at))/3600) FILTER (WHERE dr.processed_at IS NOT NULL) as avg_processing_time
          FROM document_requests dr
          JOIN document_catalog dc ON dr.document_id = dc.id
          ${whereClause}
          GROUP BY DATE(dr.created_at)
          ORDER BY DATE(dr.created_at) ASC
        `
        
        const trendsResult = await db.query(trendsQuery, queryParams.slice(0, -1))
        responseData.trends = trendsResult.rows.map(row => ({
          ...row,
          avg_processing_time: parseFloat(row.avg_processing_time) || 0
        }))
      }

      return responseData
    } catch (error) {
      logger.error('DocumentRequestRepository.getAdvancedStatistics error:', error)
      throw error
    }
  }

  /**
   * Bulk update requests (for performance)
   */
  static async bulkUpdateStatus(updates, performedBy) {
    try {
      const results = []
      const errors = []

      for (const update of updates) {
        try {
          const { id, status, remarks } = update

          if (!id || !status) {
            errors.push({ id, error: 'ID and status are required' })
            continue
          }

          // Validate status
          const statusMap = {
            'processing': 1,
            'rejected': 2,
            'ready': 3,
            'claimed': 4,
            'completed': 4 // Alias for claimed (status 4)
          }

          if (!statusMap[status]) {
            errors.push({ id, error: 'Invalid status' })
            continue
          }

          const statusValue = statusMap[status]

          // Check current status and validate transition
          const currentRequest = await db.query(
            'SELECT id, status FROM document_requests WHERE id = $1',
            [id]
          )

          if (currentRequest.rows.length === 0) {
            errors.push({ id, error: 'Document request not found' })
            continue
          }

          const currentStatus = currentRequest.rows[0].status

          // Validate transitions
          if (!this.validateStatusTransition(currentStatus, statusValue)) {
            errors.push({ id, error: 'Invalid status transition' })
            continue
          }

          // If rejecting, require remarks
          if (status === 'rejected' && !remarks?.trim()) {
            errors.push({ id, error: 'Remarks required for rejection' })
            continue
          }

          // Update status
          await this.updateStatus(id, statusValue, performedBy, remarks)

          // Log action
          const actionMap = {
            'processing': 'Marked as processing',
            'rejected': 'Request rejected',
            'ready': 'Marked as ready for pickup',
            'claimed': 'Marked as completed',
            'completed': 'Marked as completed' // Alias for claimed
          }

          await this.logAction(id, actionMap[status], currentStatus, statusValue, performedBy)

          results.push({
            id: parseInt(id),
            status,
            success: true
          })

        } catch (error) {
          errors.push({ id: update.id, error: error.message })
        }
      }

      return { results, errors }
    } catch (error) {
      logger.error('DocumentRequestRepository.bulkUpdateStatus error:', error)
      throw error
    }
  }

  /**
   * Get statistics for admin dashboard
   */
  static async getStatistics(dateRange = '7days') {
    try {
      // Calculate date filter
      const now = new Date()
      let dateFilter
      if (dateRange === '7days') {
        dateFilter = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      } else if (dateRange === '30days') {
        dateFilter = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
      } else if (dateRange === '90days') {
        dateFilter = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
      } else {
        // For 'all', use a very old date
        dateFilter = new Date('2020-01-01')
      }

      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 0) as pending,
          COUNT(*) FILTER (WHERE status = 1) as processing,
          COUNT(*) FILTER (WHERE status = 2) as rejected,
          COUNT(*) FILTER (WHERE status = 3) as ready,
          COUNT(*) FILTER (WHERE status = 4) as claimed,
          COUNT(*) as total
        FROM document_requests
        WHERE created_at >= $1
      `

      const result = await db.query(query, [dateFilter])
      const stats = result.rows[0]

      // Convert string numbers to integers
      Object.keys(stats).forEach(key => {
        stats[key] = parseInt(stats[key]) || 0
      })

      return stats
    } catch (error) {
      logger.error('DocumentRequestRepository.getStatistics error:', error)
      throw error
    }
  }

  /**
   * Check if document exists and is active
   */
  static async isDocumentActive(documentId) {
    try {
      const query = 'SELECT id, title FROM document_catalog WHERE id = $1 AND is_active = 1'
      const result = await db.query(query, [documentId])
      return result.rows[0] || null
    } catch (error) {
      logger.error('DocumentRequestRepository.isDocumentActive error:', error)
      throw error
    }
  }

  /**
   * Validate status transition
   */
  static validateStatusTransition(currentStatus, newStatus) {
    const statusMap = {
      'pending': 0,
      'processing': 1,
      'rejected': 2,
      'ready': 3,
      'claimed': 4,
      'completed': 4 // Alias for claimed (status 4)
    }

    const currentStatusValue = typeof currentStatus === 'string' ? statusMap[currentStatus] : currentStatus
    const newStatusValue = typeof newStatus === 'string' ? statusMap[newStatus] : newStatus

    const validTransitions = {
      0: [1, 2], // pending -> processing, rejected
      1: [2, 3], // processing -> rejected, ready
      3: [4]     // ready -> claimed/completed
    }

    return validTransitions[currentStatusValue]?.includes(newStatusValue) || false
  }
}

module.exports = DocumentRequestRepository
