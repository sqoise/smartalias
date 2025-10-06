/**
 * Dashboard Repository
 * Handles all database queries for admin dashboard with optimized performance
 */

const db = require('../config/db')
const logger = require('../config/logger')

class DashboardRepository {
  
  /**
   * Get lightweight stats for initial page load (essential data only)
   * Optimized for the fastest possible response
   */
  static async getLightweightStats() {
    try {
      const query = `
        WITH resident_stats AS (
          SELECT 
            COUNT(*) as total_residents,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_residents
          FROM residents 
          WHERE is_active = 1
        ),
        announcement_stats AS (
          SELECT 
            COUNT(CASE WHEN published_at IS NULL THEN 1 END) as pending_announcements
          FROM announcements
        )
        SELECT 
          rs.total_residents,
          rs.recent_residents,
          ans.pending_announcements
        FROM resident_stats rs
        CROSS JOIN announcement_stats ans
      `

      const result = await db.query(query)
      
      if (result.rows.length === 0) {
        return {
          residents: { total: 0, recent: 0 },
          announcements: { pending: 0 },
          system: { dbStatus: 'connected' }
        }
      }

      const data = result.rows[0]
      
      return {
        residents: {
          total: parseInt(data.total_residents) || 0,
          recent: parseInt(data.recent_residents) || 0
        },
        announcements: {
          pending: parseInt(data.pending_announcements) || 0
        },
        system: {
          dbStatus: 'connected',
          lastUpdated: new Date().toISOString()
        }
      }

    } catch (error) {
      logger.error('Error fetching lightweight stats:', error)
      return {
        residents: { total: 0, recent: 0 },
        announcements: { pending: 0 },
        system: { dbStatus: 'error' }
      }
    }
  }

  /**
   * Get resident categories breakdown (separate endpoint for lazy loading)
   * Uses simple query with post-processing for better performance and maintainability
   */
  static async getResidentCategories() {
    try {
      // Simple query - get all residents with their special categories
      const query = `
        SELECT 
          r.id,
          r.birth_date,
          r.special_category_id,
          sc.category_code
        FROM residents r
        LEFT JOIN special_categories sc ON r.special_category_id = sc.id
        WHERE r.is_active = 1
      `

      const result = await db.query(query)
      const residents = result.rows

      // Post-process in JavaScript for flexibility and maintainability
      return this.processResidentCategories(residents)

    } catch (error) {
      logger.error('Error fetching resident categories:', error)
      return { regular: 0, pwd: 0, senior: 0, solo_parent: 0 }
    }
  }

  /**
   * Process resident categories in JavaScript (post-processing)
   * Calculates age-based senior citizen status dynamically
   */
  static processResidentCategories(residents) {
    const categories = { regular: 0, pwd: 0, senior: 0, solo_parent: 0 }
    
    residents.forEach(resident => {
      const age = this.calculateAge(resident.birth_date)
      
      // Priority: Age-based senior citizen status first
      if (age >= 60) {
        categories.senior++
      } else if (resident.category_code === 'PWD') {
        categories.pwd++
      } else if (resident.category_code === 'SOLO_PARENT') {
        categories.solo_parent++
      } else {
        categories.regular++
      }
    })
    
    return categories
  }

  /**
   * Calculate age from birth date
   */
  static calculateAge(birthDate) {
    if (!birthDate) return 0
    
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  /**
   * Get SMS statistics (separate endpoint for lazy loading)
   * Handles missing sms_logs table gracefully
   */
  static async getSMSStats() {
    try {
      // Check if announcement_sms_logs table exists first
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'announcement_sms_logs'
        );
      `
      
      const tableCheck = await db.query(tableExistsQuery)
      const tableExists = tableCheck.rows[0]?.exists
      
      if (!tableExists) {
        logger.info('Announcement SMS logs table does not exist yet, returning mock data')
        return {
          totalSent: 0,
          today: 0,
          delivered: 0,
          failed: 0,
          deliveryRate: 0
        }
      }

      const query = `
        SELECT 
          COALESCE(SUM(total_recipients), 0) as total_sms_sent,
          COALESCE(SUM(CASE WHEN sent_at >= NOW() - INTERVAL '24 hours' THEN total_recipients ELSE 0 END), 0) as sms_today,
          COALESCE(SUM(successful_sends), 0) as sms_delivered,
          COALESCE(SUM(failed_sends), 0) as sms_failed
        FROM announcement_sms_logs
        WHERE sent_at >= NOW() - INTERVAL '30 days'
      `

      const result = await db.query(query)
      const data = result.rows[0]
      
      return {
        totalSent: parseInt(data.total_sms_sent) || 0,
        today: parseInt(data.sms_today) || 0,
        delivered: parseInt(data.sms_delivered) || 0,
        failed: parseInt(data.sms_failed) || 0,
        deliveryRate: this.calculateDeliveryRate(data.sms_delivered, data.total_sms_sent)
      }

    } catch (error) {
      logger.error('Error fetching SMS stats:', error)
      return {
        totalSent: 0, today: 0, delivered: 0, failed: 0, deliveryRate: 0
      }
    }
  }
  static async getDashboardStats() {
    try {
      const query = `
        WITH resident_stats AS (
          SELECT 
            COUNT(*) as total_residents,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_residents,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly_residents
          FROM residents 
          WHERE is_active = 1
        ),
        category_stats AS (
          SELECT 
            COALESCE(sc.category_name, 'Regular') as category_name,
            COUNT(r.id) as count
          FROM residents r
          LEFT JOIN special_categories sc ON r.special_category_id = sc.id
          WHERE r.is_active = 1
          GROUP BY sc.id, sc.category_name
        ),
        announcement_stats AS (
          SELECT 
            COUNT(*) as total_announcements,
            COUNT(CASE WHEN published_at IS NULL THEN 1 END) as pending_announcements,
            COUNT(CASE WHEN published_at IS NOT NULL AND published_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_published
          FROM announcements
        ),
        sms_stats AS (
          SELECT 
            COALESCE(SUM(total_recipients), 0) as total_sms_sent,
            COALESCE(SUM(CASE WHEN sent_at >= NOW() - INTERVAL '24 hours' THEN total_recipients ELSE 0 END), 0) as sms_today,
            COALESCE(SUM(successful_sends), 0) as sms_delivered,
            COALESCE(SUM(failed_sends), 0) as sms_failed
          FROM announcement_sms_logs
          WHERE sent_at >= NOW() - INTERVAL '30 days'
        )
        SELECT 
          -- Resident Statistics
          rs.total_residents,
          rs.recent_residents,
          rs.weekly_residents,
          
          -- Announcement Statistics  
          ans.total_announcements,
          ans.pending_announcements,
          ans.recent_published,
          
          -- SMS Statistics
          ss.total_sms_sent,
          ss.sms_today,
          ss.sms_delivered,
          ss.sms_failed,
          
          -- Category breakdown as JSON
          json_object_agg(
            LOWER(REPLACE(cs.category_name, ' ', '_')), 
            cs.count
          ) as categories
        FROM resident_stats rs
        CROSS JOIN announcement_stats ans
        CROSS JOIN sms_stats ss
        CROSS JOIN category_stats cs
        GROUP BY rs.total_residents, rs.recent_residents, rs.weekly_residents,
                 ans.total_announcements, ans.pending_announcements, ans.recent_published,
                 ss.total_sms_sent, ss.sms_today, ss.sms_delivered, ss.sms_failed
      `

      const result = await db.query(query)
      
      if (result.rows.length === 0) {
        return this.getEmptyDashboardStats()
      }

      const data = result.rows[0]
      
      // Format the response
      return {
        residents: {
          total: parseInt(data.total_residents) || 0,
          recent: parseInt(data.recent_residents) || 0,
          weekly: parseInt(data.weekly_residents) || 0,
          categories: data.categories || {}
        },
        announcements: {
          total: parseInt(data.total_announcements) || 0,
          pending: parseInt(data.pending_announcements) || 0,
          recentPublished: parseInt(data.recent_published) || 0
        },
        sms: {
          totalSent: parseInt(data.total_sms_sent) || 0,
          today: parseInt(data.sms_today) || 0,
          delivered: parseInt(data.sms_delivered) || 0,
          failed: parseInt(data.sms_failed) || 0,
          deliveryRate: this.calculateDeliveryRate(data.sms_delivered, data.total_sms_sent)
        },
        system: {
          lastUpdated: new Date().toISOString(),
          dbStatus: 'connected'
        }
      }

    } catch (error) {
      logger.error('Error fetching dashboard stats:', error)
      return this.getEmptyDashboardStats()
    }
  }

  /**
   * Get recent activity for dashboard
   * Optimized to show last 10 activities across different modules
   */
  /**
   * Get recent activity (separate endpoint for lazy loading)
   * Uses simple queries with post-processing for better maintainability
   */
  static async getRecentActivity() {
    try {
      // Simple queries instead of complex UNION
      const [residentsResult, announcementsResult] = await Promise.all([
        db.query(`
          SELECT 
            'resident' as type,
            CONCAT(first_name, ' ', last_name) as details,
            created_at,
            id as reference_id
          FROM residents 
          WHERE is_active = 1
          ORDER BY created_at DESC 
          LIMIT 5
        `),
        db.query(`
          SELECT 
            'announcement' as type,
            title as details,
            published_at,
            created_at,
            id as reference_id
          FROM announcements 
          ORDER BY 
            CASE 
              WHEN published_at IS NOT NULL THEN published_at
              ELSE created_at
            END DESC 
          LIMIT 5
        `)
      ])

      // Post-process in JavaScript for flexibility
      return this.processRecentActivity(residentsResult.rows, announcementsResult.rows)

    } catch (error) {
      logger.error('Error fetching recent activity:', error)
      return []
    }
  }

  /**
   * Process recent activity data in JavaScript (post-processing)
   */
  static processRecentActivity(residents, announcements) {
    const activities = []

    // Process residents
    residents.forEach(resident => {
      activities.push({
        type: resident.type,
        activity: 'New resident registered',
        details: resident.details,
        timestamp: resident.created_at,
        referenceId: resident.reference_id
      })
    })

    // Process announcements
    announcements.forEach(announcement => {
      activities.push({
        type: announcement.type,
        activity: announcement.published_at ? 'Announcement published' : 'Announcement created',
        details: announcement.details.length > 50 ? 
          announcement.details.substring(0, 47) + '...' : 
          announcement.details,
        timestamp: announcement.published_at || announcement.created_at,
        referenceId: announcement.reference_id
      })
    })

    // Sort by timestamp and limit to 5 most recent
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
  }

  /**
   * Get system health status
   * Quick checks for database performance and service availability
   */
  static async getSystemHealth() {
    try {
      const healthChecks = await Promise.all([
        this.checkDatabasePerformance(),
        this.checkTableSizes(),
        this.checkRecentErrors()
      ])

      return {
        database: healthChecks[0],
        storage: healthChecks[1],
        errors: healthChecks[2],
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      logger.error('Error checking system health:', error)
      return {
        database: { status: 'error', message: 'Health check failed' },
        storage: { status: 'unknown' },
        errors: { count: 0 },
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get growth trends for charts
   * Optimized query for monthly growth data
   */
  static async getGrowthTrends() {
    try {
      const query = `
        WITH monthly_data AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            'residents' as type,
            COUNT(*) as count
          FROM residents 
          WHERE is_active = 1 
            AND created_at >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', created_at)
          
          UNION ALL
          
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            'announcements' as type,
            COUNT(*) as count
          FROM announcements
          WHERE created_at >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', created_at)
        )
        SELECT 
          month,
          type,
          count,
          TO_CHAR(month, 'Mon YYYY') as month_label
        FROM monthly_data
        ORDER BY month DESC, type
      `

      const result = await db.query(query)
      
      // Group by type for easier frontend consumption
      const trends = {
        residents: [],
        announcements: []
      }

      result.rows.forEach(row => {
        trends[row.type].push({
          month: row.month,
          label: row.month_label,
          count: parseInt(row.count)
        })
      })

      return trends

    } catch (error) {
      logger.error('Error fetching growth trends:', error)
      return { residents: [], announcements: [] }
    }
  }

  /**
   * Get top performing announcements by engagement
   */
  static async getTopAnnouncements() {
    try {
      const query = `
        SELECT 
          a.id,
          a.title,
          a.created_at,
          a.published_at,
          COALESCE(SUM(asl.total_recipients), 0) as sms_sent,
          COALESCE(SUM(asl.successful_sends), 0) as sms_delivered,
          CASE 
            WHEN COALESCE(SUM(asl.total_recipients), 0) > 0 
            THEN ROUND((COALESCE(SUM(asl.successful_sends), 0)::decimal / COALESCE(SUM(asl.total_recipients), 1)) * 100, 1)
            ELSE 0 
          END as delivery_rate
        FROM announcements a
        LEFT JOIN announcement_sms_logs asl ON a.id = asl.announcement_id
        WHERE a.published_at IS NOT NULL
          AND a.published_at >= NOW() - INTERVAL '30 days'
        GROUP BY a.id, a.title, a.created_at, a.published_at
        ORDER BY sms_sent DESC, delivery_rate DESC
        LIMIT 5
      `

      const result = await db.query(query)
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        publishedAt: row.published_at,
        smsSent: parseInt(row.sms_sent) || 0,
        smsDelivered: parseInt(row.sms_delivered) || 0,
        deliveryRate: parseFloat(row.delivery_rate) || 0
      }))

    } catch (error) {
      logger.error('Error fetching top announcements:', error)
      return []
    }
  }

  // Helper Methods

  /**
   * Calculate SMS delivery rate percentage
   */
  static calculateDeliveryRate(delivered, total) {
    if (!total || total === 0) return 0
    return Math.round((delivered / total) * 100 * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Fallback empty stats when database is unavailable
   */
  static getEmptyDashboardStats() {
    return {
      residents: {
        total: 0,
        recent: 0,
        weekly: 0,
        categories: { regular: 0, pwd: 0, senior: 0, solo_parent: 0 }
      },
      announcements: {
        total: 0,
        pending: 0,
        recentPublished: 0
      },
      sms: {
        totalSent: 0,
        today: 0,
        delivered: 0,
        failed: 0,
        deliveryRate: 0
      },
      system: {
        lastUpdated: new Date().toISOString(),
        dbStatus: 'disconnected'
      }
    }
  }

  /**
   * Check database performance metrics
   */
  static async checkDatabasePerformance() {
    try {
      const start = Date.now()
      await db.query('SELECT 1')
      const responseTime = Date.now() - start

      return {
        status: responseTime < 100 ? 'good' : responseTime < 500 ? 'warning' : 'slow',
        responseTime: responseTime,
        message: `Query response: ${responseTime}ms`
      }
    } catch (error) {
      return {
        status: 'error',
        responseTime: null,
        message: 'Database connection failed'
      }
    }
  }

  /**
   * Check table sizes for storage monitoring
   */
  static async checkTableSizes() {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('residents', 'announcements', 'sms_logs', 'users')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `

      const result = await db.query(query)
      
      return {
        status: 'good',
        tables: result.rows.map(row => ({
          name: row.tablename,
          size: row.size
        }))
      }
    } catch (error) {
      return {
        status: 'error',
        tables: []
      }
    }
  }

  /**
   * Check for recent application errors
   */
  static async checkRecentErrors() {
    try {
      // This would typically check application logs
      // For now, return a simple count
      return {
        count: 0,
        lastError: null,
        status: 'good'
      }
    } catch (error) {
      return {
        count: 1,
        lastError: new Date().toISOString(),
        status: 'warning'
      }
    }
  }
}

module.exports = DashboardRepository
