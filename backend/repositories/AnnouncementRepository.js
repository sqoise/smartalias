const db = require('../config/db')
const logger = require('../config/logger')

class AnnouncementRepository {
  /**
   * Get all announcements (simplified - without target groups)
   */
  static async findAll() {
    try {
      const query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.type,
          a.is_active,
          a.created_by,
          a.created_at,
          a.updated_at,
          a.published_by,
          a.published_at,
          u_creator.username as created_by_username,
          u_publisher.username as published_by_username
        FROM announcements a
        LEFT JOIN users u_creator ON a.created_by = u_creator.id
        LEFT JOIN users u_publisher ON a.published_by = u_publisher.id
        WHERE a.is_active = 1
        ORDER BY a.created_at DESC
      `
      
      const result = await db.query(query)
      // Add empty target_groups array for frontend compatibility
      return result.rows.map(row => ({
        ...row,
        created_by: row.created_by_username || `User ${row.created_by}`,
        published_by: row.published_by_username || (row.published_by ? `User ${row.published_by}` : null),
        target_groups: ['all'] // Default to 'all' for now
      }))
    } catch (error) {
      logger.error('Error finding all announcements', error)
      throw error
    }
  }

  /**
   * Find announcement by ID (simplified - without target groups)
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.type,
          a.is_active,
          a.created_by,
          a.created_at,
          a.updated_at,
          a.published_by,
          a.published_at,
          u_creator.username as created_by_username,
          u_publisher.username as published_by_username
        FROM announcements a
        LEFT JOIN users u_creator ON a.created_by = u_creator.id
        LEFT JOIN users u_publisher ON a.published_by = u_publisher.id
        WHERE a.id = $1 AND a.is_active = 1
      `
      
      const result = await db.query(query, [id])
      if (!result.rows[0]) {
        return null
      }
      const row = result.rows[0]
      // Add default target_groups for frontend compatibility
      return {
        ...row,
        created_by: row.created_by_username || `User ${row.created_by}`,
        published_by: row.published_by_username || (row.published_by ? `User ${row.published_by}` : null),
        target_groups: ['all']
      }
    } catch (error) {
      logger.error('Error finding announcement by ID', error)
      throw error
    }
  }

  /**
   * Create new announcement with target groups
   */
  static async create(announcementData, targetGroups = []) {
    const client = await db.pool.connect()
    
    try {
      await client.query('BEGIN')

      // Insert announcement
      const insertQuery = `
        INSERT INTO announcements (
          title, content, type, is_active, created_by, published_by, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      
      const isPublished = announcementData.status === 'published'
      const values = [
        announcementData.title,
        announcementData.content,
        announcementData.type || 1,
        1, // is_active = 1 (always active when created)
        announcementData.created_by,
        isPublished ? (announcementData.published_by || announcementData.created_by) : null,
        isPublished ? new Date() : null
      ]
      
      const result = await client.query(insertQuery, values)
      const announcement = result.rows[0]

      // Skip target groups for now - table doesn't exist yet
      // TODO: Re-enable when announcement_target_groups table is created

      await client.query('COMMIT')
      
      // Return announcement with default target_groups
      return {
        ...announcement,
        target_groups: targetGroups.length > 0 ? targetGroups : ['all']
      }
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error creating announcement', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update announcement
   */
  static async update(id, announcementData, targetGroups = null) {
    const client = await db.pool.connect()
    
    try {
      await client.query('BEGIN')

      // Build update query dynamically
      const updates = []
      const values = []
      let paramCount = 1

      if (announcementData.title !== undefined) {
        updates.push(`title = $${paramCount++}`)
        values.push(announcementData.title)
      }
      if (announcementData.content !== undefined) {
        updates.push(`content = $${paramCount++}`)
        values.push(announcementData.content)
      }
      if (announcementData.type !== undefined) {
        updates.push(`type = $${paramCount++}`)
        values.push(announcementData.type)
      }
      if (announcementData.status !== undefined) {
        const isPublished = announcementData.status === 'published'
        
        // If publishing for the first time, set published_at and published_by
        if (isPublished) {
          updates.push(`published_at = COALESCE(published_at, $${paramCount++})`)
          values.push(new Date())
          updates.push(`published_by = COALESCE(published_by, $${paramCount++})`)
          values.push(announcementData.published_by || announcementData.created_by)
        }
      }

      updates.push(`updated_at = $${paramCount++}`)
      values.push(new Date())
      
      values.push(id) // WHERE id = $last
      
      const updateQuery = `
        UPDATE announcements 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `
      
      await client.query(updateQuery, values)

      // Skip target groups table operations - table doesn't exist yet
      // TODO: Re-enable when announcement_target_groups table is created

      await client.query('COMMIT')
      
      // Return updated announcement with default target_groups
      const updated = await this.findById(id)
      return updated
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error updating announcement', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Delete announcement
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM announcements WHERE id = $1 RETURNING *'
      const result = await db.query(query, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error deleting announcement', error)
      throw error
    }
  }

  /**
   * Log SMS notification
   */
  static async logSMS(announcementId, recipientPhone, recipientName, residentId, smsContent) {
    try {
      const query = `
        INSERT INTO sms_notifications (
          announcement_id, recipient_phone, recipient_name, resident_id, sms_content, delivery_status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      
      const values = [
        announcementId,
        recipientPhone,
        recipientName,
        residentId,
        smsContent,
        'pending',
        new Date()
      ]
      
      const result = await db.query(query, values)
      return result.rows[0]
    } catch (error) {
      logger.error('Error logging SMS notification', error)
      throw error
    }
  }
}

module.exports = AnnouncementRepository
