const db = require('../config/db')
const logger = require('../config/logger')

class AnnouncementRepository {
  /**
   * Get all announcements with their target groups
   */
  static async findAll() {
    try {
      const query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.type,
          a.created_by,
          a.created_at,
          a.updated_at,
          a.published_by,
          a.published_at,
          a.target_type,
          a.target_value,
          u_creator.username as created_by_username,
          u_publisher.username as published_by_username
        FROM announcements a
        LEFT JOIN users u_creator ON a.created_by = u_creator.id
        LEFT JOIN users u_publisher ON a.published_by = u_publisher.id
        ORDER BY a.created_at DESC
      `
      
      const result = await db.query(query)
      
      // Transform database format to API format
      const announcements = result.rows.map(row => {
        // Convert target columns back to frontend format
        let sms_target_groups = []
        if (row.target_type !== null && row.target_type !== '') {
          if (row.target_type === 'all') {
            sms_target_groups = ['all']
          } else if (row.target_type === 'multiple') {
            // Multiple target groups stored as JSON array
            try {
              sms_target_groups = JSON.parse(row.target_value || '[]')
            } catch (error) {
              logger.warn('Failed to parse multiple target groups', { target_value: row.target_value, error })
              sms_target_groups = []
            }
          } else {
            sms_target_groups = [`${row.target_type}:${row.target_value}`]
          }
        }
        // If target_type is null or empty, sms_target_groups remains empty array (SMS disabled)
        
        return {
          ...row,
          created_by: row.created_by_username || `User ${row.created_by}`,
          published_by: row.published_by_username || (row.published_by ? `User ${row.published_by}` : null),
          target_groups: ['all'], // Always 'all' for general visibility
          sms_target_groups: sms_target_groups // SMS target groups from direct columns
        }
      })
      
      return announcements
    } catch (error) {
      logger.error('Error finding all announcements', error)
      throw error
    }
  }

  /**
   * Find announcement by ID with target groups
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.type,
          a.created_by,
          a.created_at,
          a.updated_at,
          a.published_by,
          a.published_at,
          a.target_type,
          a.target_value,
          u_creator.username as created_by_username,
          u_publisher.username as published_by_username
        FROM announcements a
        LEFT JOIN users u_creator ON a.created_by = u_creator.id
        LEFT JOIN users u_publisher ON a.published_by = u_publisher.id
        WHERE a.id = $1
      `
      
      const result = await db.query(query, [id])
      if (!result.rows[0]) {
        return null
      }
      const row = result.rows[0]
      
      // Convert target columns back to frontend format
      let sms_target_groups = []
      if (row.target_type !== null && row.target_type !== '') {
        if (row.target_type === 'all') {
          sms_target_groups = ['all']
        } else if (row.target_type === 'multiple') {
          // Multiple target groups stored as JSON array
          try {
            sms_target_groups = JSON.parse(row.target_value || '[]')
          } catch (error) {
            logger.warn('Failed to parse multiple target groups', { target_value: row.target_value, error })
            sms_target_groups = []
          }
        } else {
          sms_target_groups = [`${row.target_type}:${row.target_value}`]
        }
      }
      // If target_type is null or empty, sms_target_groups remains empty array (SMS disabled)
      
      return {
        ...row,
        created_by: row.created_by_username || `User ${row.created_by}`,
        published_by: row.published_by_username || (row.published_by ? `User ${row.published_by}` : null),
        target_groups: ['all'], // Always 'all' for general visibility
        sms_target_groups: sms_target_groups // SMS target groups from direct columns
      }
    } catch (error) {
      logger.error('Error finding announcement by ID', error)
      throw error
    }
  }

  /**
   * Create new announcement
   */
  static async create(announcementData) {
    const client = await db.pg.connect()
    
    try {
      await client.query('BEGIN')

      // Insert announcement with target columns
      const insertQuery = `
        INSERT INTO announcements (
          title, content, type, created_by, published_by, published_at, target_type, target_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `
      
      const isPublished = announcementData.status === 'published'
      const values = [
        announcementData.title,
        announcementData.content,
        announcementData.type || 1,
        announcementData.created_by,
        isPublished ? (announcementData.published_by || announcementData.created_by) : null,
        isPublished ? new Date() : null,
        announcementData.target_type || null,  // null = SMS disabled
        announcementData.target_value || null
      ]
      
      const result = await client.query(insertQuery, values)
      const announcement = result.rows[0]

      logger.info('Announcement created with direct target columns', {
        announcementId: announcement.id,
        target_type: announcement.target_type,
        target_value: announcement.target_value
      })

      await client.query('COMMIT')
      
      // Return announcement with default target_groups
      return {
        ...announcement,
        target_groups: ['all'] // Always default to 'all' for general visibility
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
  static async update(id, announcementData) {
    const client = await db.pg.connect()
    
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
      if (announcementData.target_type !== undefined) {
        updates.push(`target_type = $${paramCount++}`)
        values.push(announcementData.target_type)
      }
      if (announcementData.target_value !== undefined) {
        updates.push(`target_value = $${paramCount++}`)
        values.push(announcementData.target_value)
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

      await client.query('COMMIT')
      
      // Return updated announcement
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
}

module.exports = AnnouncementRepository
